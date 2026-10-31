import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { expect } from "playwright/test";
import { serve } from "../browser/server.mjs";
import { catalogueScenarios, viewportChecks } from "./viewport.mjs";
import { polishChecks } from "./polish.mjs";
import { propertyChecks, propertyInteractions } from "./properties.mjs";
import { feedbackChecks } from "./feedback.mjs";
import { refinements } from "./refinements.mjs";

const require = createRequire(import.meta.url);
const entries = JSON.parse(await readFile("dist/catalogue.json", "utf8"));
const starterSource = await readFile(
  "examples/catalogue/src/getting_started.gleam",
  "utf8",
);
const engines = { chromium, firefox, webkit };
const browsers = (process.env.BROWSER ?? "chromium,firefox,webkit").split(",");
assert.ok(
  browsers.every((name) => Object.hasOwn(engines, name)),
  "Unknown browser",
);
const scenarios = catalogueScenarios(process.env.WIDTH);
await mkdir("test-results", { recursive: true });
const server = await serve("dist", "/gleam-lustre-meridian-ui/");
const base = `${server.url}/gleam-lustre-meridian-ui/`;

async function accessible(frame, label) {
  await frame.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await frame.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations())
      if (
        animation.playState === "running" &&
        Number.isFinite(animation.effect.getComputedTiming().endTime)
      )
        animation.finish();
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
    await expect(page.locator(".meridian-code-status:visible")).toHaveText(
      "Copied.",
    );
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
  await expect(
    page.locator(".meridian-code-gutter:visible [data-number]").first(),
  ).toHaveAttribute("aria-hidden", "true");
  const sourceToggle = page
    .locator(".meridian-code-viewer:visible > summary")
    .first();
  await sourceToggle.click();
  await expect(page.locator("#example-code")).toBeHidden();
  await sourceToggle.press("Enter");
  await expect(page.locator("#example-code")).toBeVisible();
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
  await expect(page.locator(".meridian-code-status:visible")).toContainText(
    "Copy unavailable.",
  );

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
  await frame.getByLabel("Accent colour", { exact: true }).click();
  await accessible(frame, "Themed colour popup");
  await frame
    .getByRole("textbox", { name: "Hex colour", exact: true })
    .fill("#b41472");
  await frame.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(frame.getByLabel("Accent colour", { exact: true })).toHaveValue(
    "#b41472",
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
    document.querySelector('link[href^="./preview.css"]').disabled = true;
  });
  assert.ok(
    await frame
      .getByLabel("Start date", { exact: true })
      .evaluate(
        (input) =>
          getComputedStyle(input).borderRadius === "12px" &&
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
    .getByRole("listbox", { name: "Hours", exact: true })
    .selectOption("11");
  await frame
    .getByRole("listbox", { name: "Seconds", exact: true })
    .selectOption("27");
  await frame.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    frame.getByLabel("Meeting time (09:00-17:00)", { exact: true }),
  ).toHaveValue("11:15:27");
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
  await command.fill("echo hello");
  await command.press("Enter");
  await expect(frame.getByRole("log").locator("pre")).toHaveText("hello");

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
  // Old cached entrypoints can import chunks removed by the next deployment.
  await context.route(
    /\/assets\/(?:catalogue|preview|examples\/[^/]+)\.js$/,
    (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: 'import "./removed-from-previous-deployment.js";',
      }),
  );
  await context.route(/\/preview\.html\?/, (route) =>
    new URL(route.request().url()).searchParams.get("v")
      ? route.continue()
      : route.fulfill({
          contentType: "text/html",
          body: '<script type="module" src="./assets/preview.js"></script>',
        }),
  );
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
    const offscreen = await page.addStyleTag({
      content: "#preview-container { margin-block-start: 2000px; }",
    });
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
    assert.equal(
      new URL(firstFrame.url()).searchParams.get("v"),
      await page.locator("body").getAttribute("data-preview-version"),
      "Preview documents must bypass the previous deployment's cache",
    );
    await expect(firstFrame.locator("#demo-root")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await offscreen.evaluate((style) => style.remove());
    await page.getByRole("tab", { name: "Full module", exact: true }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Full module", exact: true }),
    ).toContainText("Loading source...");
    await expect(
      page.getByRole("button", { name: "Copy code", exact: true }),
    ).toHaveCount(0);
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
    ).toHaveCount(0);
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
      "**/assets/chunks/forms-*.js",
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
      `${name}: cache-safe assets, preview readiness/failure, source failure, pending-source disposal and blocked-storage checks PASS`,
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
        page.on("pageerror", (error) => {
          const message = `${new URL(page.url()).hash}: ${error.message}`;
          errors.push(message);
          console.error(message);
        });
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
        let active = "getting started";
        try {
          console.log(`${label}: getting started`);
          await page.goto(base);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Getting started",
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
          await expect(page.locator(".docs-start-link")).toHaveAttribute(
            "aria-current",
            "page",
          );
          await expect(page.locator(".docs-setup h2")).toHaveText([
            "1. Add the dependency",
            "2. Load the styles",
            "3. Render a component",
            "4. Mount interactions",
          ]);
          await expect(
            page.getByLabel("Git dependency", { exact: true }),
          ).toContainText('ref = "main"');
          await expect(
            page.getByLabel("Stylesheet link", { exact: true }),
          ).toContainText("meridian-ui/meridian-ui.css");
          const starter = page.getByLabel("Component example", { exact: true });
          assert.equal(await starter.textContent(), starterSource);
          const starterToggle = page
            .locator(".docs-setup .meridian-code-viewer")
            .filter({ has: starter })
            .locator("summary");
          for (const [label, language, count] of [
            ["Git dependency", "toml", 2],
            ["Stylesheet link", "html", 1],
          ]) {
            const snippet = page.getByLabel(label, { exact: true });
            await expect(snippet.locator("code")).toHaveAttribute(
              "data-language",
              language,
            );
            await expect(snippet.locator("[data-code-number]")).toHaveCount(
              count,
            );
            await expect(
              snippet.locator(".meridian-code-string"),
            ).not.toHaveCount(0);
          }
          await starterToggle.focus();
          await starterToggle.press("Enter");
          await expect(starter).toBeHidden();
          await starterToggle.press("Space");
          await expect(starter).toBeVisible();
          await expect(page.locator(".docs-category-grid")).toHaveCount(0);
          console.log(`${label}: getting started WCAG`);
          await accessible(page, `${label} getting started`);
          console.log(`${label}: getting started screenshot`);
          await page.screenshot({
            path: `test-results/site-${name}-${scenario.width}-getting-started.png`,
            fullPage: true,
            animations: "disabled",
          });
          console.log(`${label}: navigation`);
          await page
            .getByRole("link", { name: "Try the Button example", exact: true })
            .click();
          await expect(
            page.locator('iframe[data-ready="button"]'),
          ).toBeVisible();
          await page.goBack();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Getting started",
          );
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
          active = "component interactions";
          console.log(`${label}: ${active}`);
          await interactions(page);
          active = "polish checks";
          console.log(`${label}: ${active}`);
          await polishChecks(page, (id) => open(page, id));
          active = "property interactions";
          console.log(`${label}: ${active}`);
          await propertyInteractions(page, (id) => open(page, id));
          active = "feedback checks";
          console.log(`${label}: ${active}`);
          await feedbackChecks(page, (id) => open(page, id));
          active = "refinements";
          console.log(`${label}: ${active}`);
          await refinements(page, (id) => open(page, id));
          for (const entry of entries) {
            active = entry.id;
            console.log(
              `${label} ${active}: ${entry.examples.length} presets and WCAG`,
            );
            const frame = await open(page, entry.id);
            await propertyChecks(page, frame, entry);
            if (entry.id === "scheduler" && scenario.width < 560)
              await propertyChecks(page, frame, entry);
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
            if (entry.id === "animateonscroll") {
              await frame
                .getByRole("region", {
                  name: "Animation viewport",
                  exact: true,
                })
                .evaluate((node) => {
                  node.scrollTop = node.scrollHeight;
                });
              await expect(frame.locator("[data-meridian-reveal]")).toHaveCSS(
                "opacity",
                "1",
              );
            }
            await accessible(frame, `${label} ${entry.name}`);
            await expect(page.locator(".docs-properties")).toBeVisible();
            await page
              .getByRole("button", { name: "API reference", exact: true })
              .click();
            await expect(page.locator(".docs-api-content")).toBeVisible();
            if (scenario.width < 560)
              assert.ok(
                await page
                  .locator(".docs-api-table")
                  .first()
                  .evaluate(
                    (table) =>
                      table.getBoundingClientRect().width >= 512 &&
                      table.parentElement.scrollWidth >
                        table.parentElement.clientWidth,
                  ),
                `${entry.name}: API tables must scroll instead of crushing columns`,
              );
            if (entry.module)
              await expect(page.locator(".docs-api-function")).toHaveCount(
                entry.api.functions.length + entry.api.types.length,
              );
            if (scenario.width < 560 && entry.id === "select") {
              const scroll = page.locator(".docs-api-scroll").first();
              await scroll.focus();
              await scroll.press(
                scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight",
              );
              await expect
                .poll(() =>
                  scroll.evaluate((node) => Math.abs(node.scrollLeft)),
                )
                .toBeGreaterThan(0);
              await scroll.evaluate((node) => {
                node.scrollLeft = 0;
              });
            }
            if (
              [
                "button",
                "table",
                "scheduler",
                "datepicker",
                "timepicker",
                "datetimepicker",
                "codeblock",
                "select",
                "filetree",
              ].includes(entry.id)
            ) {
              await accessible(page, `${label} ${entry.name} reference`);
              await page.screenshot({
                path: `test-results/site-${name}-${scenario.width}-${entry.id}.png`,
                fullPage: true,
                animations: "disabled",
              });
            }
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
            .locator("#main")
            .getByRole("link", { name: "Getting started", exact: true })
            .click();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(
            "Getting started",
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
      // Keep shared checks on the shorter mobile job without duplicating them.
      if (scenarios.some((scenario) => scenario.width === 320)) {
        await fallbackChecks(browser, name);
        await viewportChecks(browser, name, base);
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
