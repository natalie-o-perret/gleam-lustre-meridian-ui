import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { expect } from "playwright/test";
import { serve } from "../browser/server.mjs";

const require = createRequire(import.meta.url);
const entries = JSON.parse(await readFile("dist/catalogue.json", "utf8"));
const engines = { chromium, firefox, webkit };
const browsers = (process.env.BROWSER ?? "chromium,firefox,webkit").split(",");
assert.ok(
  browsers.every((name) => Object.hasOwn(engines, name)),
  "Unknown browser",
);
const scenarios = [
  { width: 1440, theme: "light", direction: "ltr", motion: "no-preference" },
  { width: 320, theme: "dark", direction: "rtl", motion: "reduce" },
];
await mkdir("test-results", { recursive: true });
const server = await serve("dist", "/gleam-lustre-meridian-ui/");
const base = `${server.url}/gleam-lustre-meridian-ui/`;

async function accessible(frame, label) {
  await frame.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await frame.evaluate(async () => {
    await document.fonts.ready;
    await Promise.allSettled(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" &&
            Number.isFinite(animation.effect.getComputedTiming().endTime),
        )
        .map((animation) => animation.finished),
    );
    const result = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((node) => ({
        html: node.html,
        summary: node.failureSummary,
      })),
    }));
  });
  assert.deepEqual(violations, [], label);
}

async function open(page, id) {
  await page.evaluate((id) => {
    location.hash = `#/components/${id}`;
  }, id);
  await expect(page.locator(`iframe[data-ready="${id}"]`)).toBeVisible();
  return (await page.locator("iframe").elementHandle()).contentFrame();
}

async function setTheme(page, preference) {
  const control = page.locator("#theme");
  for (
    let attempt = 0;
    attempt < 3 &&
    (await control.getAttribute("data-preference")) !== preference;
    attempt++
  )
    await control.click();
  await expect(control).toHaveAttribute("data-preference", preference);
}

async function pasteCode(page, source, selection = false) {
  if (selection) {
    const block = page.locator(".meridian-code-block:visible").first();
    await block.focus();
    await block.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    await page.keyboard.press("ControlOrMeta+c");
  } else {
    await page.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(page.locator("#copy-status")).toHaveText("Copied.");
  }
  await page.evaluate(() => {
    const input = document.createElement("textarea");
    input.id = "clipboard-probe";
    document.body.append(input);
    input.focus();
  });
  await page.locator("#clipboard-probe").press("ControlOrMeta+v");
  await expect(page.locator("#clipboard-probe")).toHaveValue(source);
  await page.locator("#clipboard-probe").evaluate((input) => input.remove());
}

async function interactions(page) {
  let frame = await open(page, "button");
  await frame
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(frame.getByRole("status")).toHaveText("Actions: 1");
  const scripts = await frame.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => entry.initiatorType === "script"),
  );
  assert.ok(
    scripts.every((entry) => entry.encodedBodySize < 200_000),
    "Ordinary previews must not load advanced engines",
  );

  await pasteCode(page, entries.find((entry) => entry.id === "button").snippet);
  await expect(page.locator(".meridian-code-gutter:visible")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await pasteCode(
    page,
    entries.find((entry) => entry.id === "button").snippet,
    true,
  );
  await page.getByRole("tab", { name: "Full module", exact: true }).click();
  await expect(page.locator("#module-code")).toContainText("fn update(");
  await pasteCode(page, await readFile("dist/source/feedback.gleam", "utf8"));
  await page.getByRole("tab", { name: "Helpers", exact: true }).click();
  await expect(page.locator("#helpers-code")).toContainText("pub fn start(");
  await pasteCode(page, await readFile("dist/source/common.gleam", "utf8"));
  const exampleTab = page.getByRole("tab", { name: "Example", exact: true });
  await exampleTab.click();
  await exampleTab.focus();
  await exampleTab.press(
    (await page.locator("html").getAttribute("dir")) === "rtl"
      ? "ArrowLeft"
      : "ArrowRight",
  );
  await expect(
    page.getByRole("tab", { name: "Full module", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Full module", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await exampleTab.click();
  await expect(page.locator("#example-code")).toHaveText(
    entries.find((entry) => entry.id === "button").snippet,
  );
  assert.ok(await page.locator("#example-code .meridian-code-keyword").count());
  await page
    .getByRole("button", { name: "Gleam example", exact: true })
    .click();
  await expect(page.locator("#source-section-content")).toBeHidden();
  await page
    .getByRole("button", { name: "Gleam example", exact: true })
    .click();
  await expect(exampleTab).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Live example", exact: true }).click();
  await expect(page.locator("iframe")).toBeHidden();
  await page.getByRole("button", { name: "Live example", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Actions: 1");
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error("Clipboard denied");
    };
  });
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.locator("#copy-status")).toContainText("Copy unavailable.");

  frame = await open(page, "inputtext");
  await frame
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Alex");
  await expect(frame.getByRole("status")).toHaveText("Value: Alex");
  const previousTheme = await frame
    .locator("#demo-root")
    .getAttribute("data-theme");
  const previousPreference = await page
    .locator("#theme")
    .getAttribute("data-preference");
  await setTheme(page, previousTheme === "light" ? "dark" : "light");
  await expect(frame.locator("#demo-root")).not.toHaveAttribute(
    "data-theme",
    previousTheme,
  );
  await expect(
    frame.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Alex");
  await setTheme(page, "system");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await setTheme(page, "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await setTheme(page, previousPreference);
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-theme",
    previousTheme,
  );

  frame = await open(page, "inputcolor");
  await frame.getByLabel("Accent colour", { exact: true }).fill("#316a91");
  await expect(frame.getByLabel("Accent colour", { exact: true })).toHaveValue(
    "#316a91",
  );

  frame = await open(page, "datepicker");
  await frame.getByLabel("Single date", { exact: true }).fill("2026-11-07");
  await frame.getByLabel("Single date", { exact: true }).click();
  await expect(frame.locator(".meridian-picker-popup")).toBeVisible();
  await accessible(frame, "Themed date popup");
  await frame.locator('[data-date="2026-11-09"]').click();
  await expect(frame.getByLabel("Single date", { exact: true })).toHaveValue(
    "2026-11-09",
  );
  await frame.getByLabel("Single date", { exact: true }).fill("2026-11-07");
  await frame.getByLabel("Start date", { exact: true }).fill("2026-11-08");
  await frame.getByLabel("End date", { exact: true }).fill("2026-11-12");
  await expect(frame.getByLabel("Start date", { exact: true })).toHaveAttribute(
    "max",
    "2026-11-12",
  );
  await expect(frame.getByLabel("End date", { exact: true })).toHaveAttribute(
    "min",
    "2026-11-08",
  );
  const values = await frame
    .locator("form")
    .evaluate((form) => Object.fromEntries(new FormData(form)));
  assert.equal(values.date, "2026-11-07");
  assert.equal(values["travel-start"], "2026-11-08");
  assert.equal(values["travel-end"], "2026-11-12");
  await frame.getByLabel("End date", { exact: true }).fill("2026-11-06");
  assert.equal(
    await frame.locator("form").evaluate((form) => form.checkValidity()),
    false,
  );
  await frame.getByLabel("End date", { exact: true }).fill("2026-11-12");
  await frame
    .getByRole("button", { name: "Validate dates", exact: true })
    .click();
  await expect(frame.locator(".demo-status")).toContainText(
    "The native form is valid.",
  );
  await frame.evaluate(() => {
    document.querySelector('link[href="./preview.css"]').disabled = true;
  });
  assert.ok(
    await frame
      .getByLabel("Start date", { exact: true })
      .evaluate(
        (input) =>
          getComputedStyle(input).borderRadius === "9px" &&
          getComputedStyle(input).fontFamily.includes("Manrope"),
      ),
  );

  frame = await open(page, "timepicker");
  await frame
    .getByLabel("Meeting time (09:00-17:00)", { exact: true })
    .fill("10:15");
  await frame.getByLabel("Meeting time (09:00-17:00)", { exact: true }).click();
  await accessible(frame, "Themed time popup");
  await frame
    .getByRole("spinbutton", { name: "Hours", exact: true })
    .fill("11");
  await frame.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    frame.getByLabel("Meeting time (09:00-17:00)", { exact: true }),
  ).toHaveValue("11:15");
  await frame
    .getByLabel("Meeting time (09:00-17:00)", { exact: true })
    .fill("10:15");
  assert.equal(
    await frame
      .locator("form")
      .evaluate((form) => new FormData(form).get("time")),
    "10:15",
  );
  await frame
    .getByRole("button", { name: "Validate time", exact: true })
    .click();
  await expect(frame.locator(".demo-status")).toContainText(
    "The native form is valid.",
  );

  frame = await open(page, "datetimepicker");
  await frame
    .getByLabel("Meeting date and time", { exact: true })
    .fill("2026-11-06T10:15");
  await frame.getByLabel("Meeting date and time", { exact: true }).click();
  await accessible(frame, "Themed date and time popup");
  await frame
    .getByRole("button", { name: "Close picker", exact: true })
    .click();
  assert.equal(
    await frame
      .locator("form")
      .evaluate((form) => new FormData(form).get("date-time")),
    "2026-11-06T10:15",
  );
  await frame
    .getByRole("button", { name: "Validate date and time", exact: true })
    .click();
  await expect(frame.locator(".demo-status")).toContainText(
    "The native form is valid.",
  );

  frame = await open(page, "accordion");
  await frame
    .getByRole("button", { name: "Who owns the state?", exact: true })
    .click();
  await expect(
    frame.getByText("Your application's update function owns the state."),
  ).toBeVisible();

  frame = await open(page, "dialog");
  const launch = frame.getByRole("button", {
    name: "Edit project",
    exact: true,
  });
  await launch.focus();
  await launch.press("Enter");
  await expect(
    frame.getByRole("dialog", { name: "Edit project", exact: true }),
  ).toBeVisible();
  const spacing = await frame
    .locator(".meridian-dialog-content")
    .evaluate((node) => {
      const [field, action] = [...node.children].map((child) =>
        child.getBoundingClientRect(),
      );
      return action.top - field.bottom;
    });
  assert.ok(spacing >= 16, "Dialog fields and actions need a gap");
  await frame
    .getByRole("textbox", { name: "Project name", exact: true })
    .press("Escape");
  await expect(frame.getByRole("dialog")).not.toBeVisible();
  await expect(launch).toBeFocused();

  frame = await open(page, "iconfield");
  await expect(frame.locator(".meridian-field-icon > svg")).toHaveCSS(
    "width",
    "20px",
  );
  await expect(frame.locator(".meridian-field-icon > svg")).toHaveCSS(
    "height",
    "20px",
  );

  frame = await open(page, "commandmenu");
  await frame
    .getByRole("button", { name: "Open command palette", exact: true })
    .click();
  await frame.getByRole("dialog").getByRole("searchbox").fill("settings");
  await frame
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await expect(frame.locator(".demo-status")).toHaveText("Actions: 1");

  frame = await open(page, "filterservice");
  await frame.getByRole("searchbox").fill("eire");
  await expect(frame.locator("li")).toHaveText(["Éire"]);

  frame = await open(page, "fileupload");
  await frame.locator('input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Hello"),
  });
  await expect(
    frame.getByText("notes.txt (5 bytes)", { exact: true }),
  ).toBeVisible();

  frame = await open(page, "terminal");
  const command = frame.getByRole("textbox");
  await command.fill("hello");
  await command.press("Enter");
  await expect(
    frame.getByText("You entered: hello", { exact: true }),
  ).toBeVisible();

  frame = await open(page, "charts");
  await expect(frame.locator("#requests-chart svg")).toBeVisible();
  await frame
    .getByRole("combobox", { name: "Chart kind", exact: true })
    .selectOption("line");
  await expect(frame.locator("#requests-chart")).toHaveAttribute(
    "data-chart",
    /"type":"line"/,
  );
  await frame.getByText("Chart data", { exact: true }).click();
  await frame
    .getByRole("button", { name: "Select Requests Tue", exact: true })
    .click();
  await expect(frame.getByRole("status")).toHaveText("Requests: Tue");

  frame = await open(page, "scheduler");
  await expect(frame.locator(".fc-toolbar-title")).toHaveText("November 2026");
  await frame
    .getByLabel("Review start", { exact: true })
    .fill("2026-11-12T09:30");
  await expect(frame.locator("#project-calendar")).toHaveAttribute(
    "data-scheduler",
    /09:30/,
  );
  await frame.locator(".fc-listWeek-button").click();
  await expect(frame.locator(".fc-listWeek-view")).toBeVisible();

  frame = await open(page, "taskboard");
  await frame
    .getByRole("combobox", {
      name: "Move Review colour tokens to",
      exact: true,
    })
    .selectOption("done");
  await expect(
    frame
      .getByRole("region", { name: "Done", exact: true })
      .getByText("Review colour tokens", { exact: true }),
  ).toBeVisible();

  frame = await open(page, "texteditor");
  const editor = frame.getByRole("textbox", {
    name: "Project notes",
    exact: true,
  });
  await editor.click();
  await editor.press("ControlOrMeta+End");
  await editor.pressSequentially(" Hello");
  await expect(frame.locator("#document-json")).toContainText("Hello");
  await frame
    .getByRole("switch", { name: "Read-only editor", exact: true })
    .check();
  await expect(editor).toHaveAttribute("contenteditable", "false");
}

async function fallbackChecks(browser, name) {
  const context = await browser.newContext();
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await context.route("**/source/feedback.gleam", async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto(base);
    let releasePreview;
    const pendingPreview = new Promise((resolve) => {
      releasePreview = resolve;
    });
    await page.route(
      /preview\.html\?component=button&/,
      async (route) => {
        await pendingPreview;
        await route.continue();
      },
      { times: 1 },
    );
    const loaded = open(page, "button");
    await page.locator("iframe").waitFor({ state: "attached" });
    await expect(page.locator("iframe")).toHaveCSS("visibility", "hidden");
    await setTheme(page, "dark");
    releasePreview();
    const firstFrame = await loaded;
    await expect(firstFrame.locator("#demo-root")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await page.getByRole("tab", { name: "Full module", exact: true }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Full module", exact: true }),
    ).toContainText("Loading source...");
    await expect(
      page.getByRole("button", { name: "Copy code", exact: true }),
    ).toBeDisabled();
    await open(page, "inputtext");
    release();
    await open(page, "button");
    await page.getByRole("tab", { name: "Full module", exact: true }).click();
    await expect(page.locator("#module-code")).toContainText("fn update(");
    await context.route("**/source/forms.gleam", (route) =>
      route.fulfill({ status: 503, body: "Unavailable" }),
    );
    await open(page, "datepicker");
    await page.getByRole("tab", { name: "Full module", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Source could not be loaded. Use the GitHub link above.",
    );
    await expect(
      page.getByRole("button", { name: "Copy code", exact: true }),
    ).toBeDisabled();
    await page.getByRole("tab", { name: "Example", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Copy code", exact: true }),
    ).toBeEnabled();
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          "meridian-catalogue",
          JSON.stringify({ theme: "invalid", direction: "invalid" }),
        );
      } catch {}
    });
    await page.reload();
    await expect(page.locator("#theme")).toHaveAttribute(
      "data-preference",
      "system",
    );
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("Storage denied");
      };
      Storage.prototype.setItem = () => {
        throw new Error("Storage denied");
      };
    });
    await page.reload();
    await expect(page.locator("#theme")).toHaveAttribute(
      "data-preference",
      "system",
    );
    await setTheme(page, "dark");
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    await open(page, "button");
    await page.route(
      "**/assets/examples/forms.js",
      (route) => route.fulfill({ status: 503, body: "Unavailable" }),
      { times: 1 },
    );
    await page.evaluate(() => {
      location.hash = "#/components/datepicker";
    });
    await expect(page.locator("#preview-status")).toBeVisible();
    await expect(page.locator("#preview-status")).toContainText(
      "The preview could not be loaded.",
    );
    await expect(page.locator("iframe")).toHaveCSS("visibility", "hidden");
    assert.deepEqual(errors, []);
    console.log(
      `${name}: preview readiness/failure, source failure, pending-source disposal and blocked-storage checks PASS`,
    );
  } finally {
    release();
    await context.close();
  }
}

try {
  for (const name of browsers) {
    const browser = await engines[name].launch();
    try {
      for (const scenario of scenarios) {
        const context = await browser.newContext({
          viewport: { width: scenario.width, height: 1000 },
          colorScheme: "light",
          reducedMotion: scenario.motion,
        });
        if (name === "chromium")
          await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("response", (response) => {
          if (response.status() >= 400)
            errors.push(`${response.status()} ${response.url()}`);
        });
        page.on("request", (request) => {
          if (
            !request.url().startsWith(server.url + "/") &&
            !request.url().startsWith("data:")
          )
            errors.push(`External request: ${request.url()}`);
        });
        const label = `${name} ${scenario.width}px ${scenario.theme} ${scenario.direction}`;
        let active = "overview";
        try {
          await page.goto(base);
          await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Small components.",
          );
          await expect(page.locator(".docs-nav-link")).toHaveCount(
            entries.length,
          );
          await expect(page.locator("#theme")).toHaveAttribute(
            "data-preference",
            "system",
          );
          await setTheme(page, scenario.theme);
          if (scenario.direction === "rtl")
            await page
              .getByRole("button", { name: "RTL", exact: true })
              .click();
          await accessible(page, `${label} overview`);
          await page.screenshot({
            path: `test-results/site-${name}-${scenario.width}-overview.png`,
            fullPage: true,
            animations: "disabled",
          });
          const overviewGroup = page.locator("#category-form-toggle");
          await overviewGroup.focus();
          await overviewGroup.press("Enter");
          await expect(page.locator("#category-form-content")).toBeHidden();
          await overviewGroup.press("Space");
          await expect(page.locator("#category-form-content")).toBeVisible();
          if (scenario.width < 900)
            await page
              .getByRole("button", { name: "Components", exact: true })
              .click();
          const navigation = page.getByRole("navigation", {
            name: "Components",
            exact: true,
          });
          const formGroup = navigation.getByRole("button", {
            name: "Form",
            exact: true,
          });
          assert.ok(
            await formGroup.evaluate((node) => {
              const group = node.closest(".docs-nav-group");
              const heading = node.getBoundingClientRect();
              const list = group.querySelector("ul").getBoundingClientRect();
              const icon = node
                .querySelector(".meridian-disclosure-icon")
                .getBoundingClientRect();
              return getComputedStyle(node).direction === "rtl"
                ? heading.right - list.right >= 20 &&
                    heading.right - icon.right >= 10
                : list.left - heading.left >= 20 &&
                    icon.left - heading.left >= 10;
            }),
            "Navigation entries must be nested and chevrons inset",
          );
          await expect(page.locator("#direction")).toHaveCSS(
            "align-items",
            "center",
          );
          await formGroup.click();
          await expect(page.locator("#navigation-form-content")).toBeHidden();
          await page
            .getByRole("searchbox", { name: "Search components", exact: true })
            .fill("text editor");
          await expect(page.locator(".docs-nav-link")).toHaveText([
            "Text Editor",
          ]);
          await page
            .getByRole("navigation", { name: "Components", exact: true })
            .getByRole("link", { name: "Text Editor", exact: true })
            .click();
          await expect(
            page.locator('iframe[data-ready="texteditor"]'),
          ).toBeVisible();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Text Editor",
          );
          if (scenario.width < 900) {
            await expect(page.locator("#navigation-dialog")).not.toBeVisible();
            await page
              .getByRole("button", { name: "Components", exact: true })
              .click();
          }
          await page
            .getByRole("searchbox", { name: "Search components", exact: true })
            .fill("nothing-matches-this");
          await expect(page.locator("#search-status")).toContainText(
            `0 of ${entries.length}`,
          );
          await page
            .getByRole("searchbox", { name: "Search components", exact: true })
            .fill("");
          if (scenario.width < 900) {
            await page
              .getByRole("searchbox", {
                name: "Search components",
                exact: true,
              })
              .press("Escape");
            await expect(
              page.getByRole("button", { name: "Components", exact: true }),
            ).toBeFocused();
          }
          if (scenario.width >= 900) {
            await expect(page.locator("#navigation-form-content")).toBeHidden();
            await formGroup.click();
          }
          await interactions(page);
          for (const entry of entries) {
            active = entry.id;
            const frame = await open(page, entry.id);
            await expect(page.getByRole("heading", { level: 1 })).toHaveText(
              entry.name,
            );
            await expect(page.locator("#example-code")).toHaveText(
              entry.snippet,
            );
            assert.ok(
              await page
                .locator("#example-code .meridian-code-keyword")
                .count(),
              `${entry.name}: highlighted source`,
            );
            assert.equal(
              await frame.locator("#demo-root").getAttribute("data-theme"),
              scenario.theme,
            );
            assert.equal(
              await frame.locator("html").getAttribute("dir"),
              scenario.direction,
            );
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
              `${entry.name}: shell overflow`,
            );
            assert.ok(
              await frame.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
              `${entry.name}: preview overflow`,
            );
            await expect(frame.getByRole("alert")).toHaveCount(0);
            if (entry.id === "animateonscroll")
              await expect(frame.locator("[data-meridian-reveal]")).toHaveCSS(
                "opacity",
                "1",
              );
            await accessible(frame, `${label} ${entry.name}`);
            if (
              [
                "button",
                "table",
                "scheduler",
                "datepicker",
                "timepicker",
                "datetimepicker",
                "codeblock",
              ].includes(entry.id)
            )
              await page.screenshot({
                path: `test-results/site-${name}-${scenario.width}-${entry.id}.png`,
                fullPage: true,
                animations: "disabled",
              });
          }
          await open(page, "button");
          await open(page, "slider");
          await page.goBack();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Button",
          );
          await page.reload();
          await expect(
            page.locator('iframe[data-ready="button"]'),
          ).toBeVisible();
          assert.equal(
            await page.locator("body").getAttribute("data-theme"),
            scenario.theme,
          );
          assert.equal(
            await page.locator("html").getAttribute("dir"),
            scenario.direction,
          );
          const skip = page.getByRole("link", {
            name: "Skip to content",
            exact: true,
          });
          await skip.focus();
          await skip.press("Enter");
          await expect(page.locator("#main")).toBeFocused();
          assert.equal(new URL(page.url()).hash, "#/components/button");
          await accessible(page, `${label} component shell`);
          await page.evaluate(() => {
            location.hash = "#/components/not-a-component";
          });
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Component not found",
          );
          await page
            .getByRole("link", { name: "Browse all components", exact: true })
            .click();
          await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Small components.",
          );
          assert.deepEqual(errors, [], label);
          console.log(
            `${label}: ${entries.length} routes, source, interactions, clipboard and WCAG checks PASS`,
          );
        } catch (error) {
          await page.screenshot({
            path: `test-results/site-${name}-${scenario.width}-failure.png`,
            fullPage: true,
          });
          throw new Error(`${label} ${active}: ${error.message}`, {
            cause: error,
          });
        } finally {
          await context.close();
        }
      }
      await fallbackChecks(browser, name);
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
