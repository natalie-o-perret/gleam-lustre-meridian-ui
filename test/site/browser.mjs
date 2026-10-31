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

  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.locator("#copy-status")).toHaveText("Copied.");
  await page.evaluate(() => {
    const input = document.createElement("textarea");
    input.id = "clipboard-probe";
    document.body.append(input);
    input.focus();
  });
  await page.locator("#clipboard-probe").press("ControlOrMeta+v");
  await expect(page.locator("#clipboard-probe")).toHaveValue(
    entries.find((entry) => entry.id === "button").snippet,
  );
  await page.locator("#clipboard-probe").evaluate((input) => input.remove());
  await page
    .getByRole("button", { name: "Show full module", exact: true })
    .click();
  await expect(page.locator("#example-code")).toContainText("fn update(");
  await page
    .getByRole("button", { name: "Show view only", exact: true })
    .click();
  await expect(page.locator("#example-code")).toHaveText(
    entries.find((entry) => entry.id === "button").snippet,
  );
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
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(frame.locator("#demo-root")).not.toHaveAttribute(
    "data-theme",
    previousTheme,
  );
  await expect(
    frame.getByRole("textbox", { name: "Your name", exact: true }),
  ).toHaveValue("Alex");
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-theme",
    previousTheme,
  );

  frame = await open(page, "inputcolor");
  await frame.getByLabel("Accent colour", { exact: true }).fill("#316a91");
  await expect(frame.getByLabel("Accent colour", { exact: true })).toHaveValue(
    "#316a91",
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
  await frame
    .getByRole("textbox", { name: "Project name", exact: true })
    .press("Escape");
  await expect(frame.getByRole("dialog")).not.toBeVisible();
  await expect(launch).toBeFocused();

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
          await expect(page.locator(".docs-nav-link")).toHaveCount(98);
          if (scenario.theme === "dark")
            await page
              .getByRole("button", { name: "Dark mode", exact: true })
              .click();
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
          if (scenario.width < 900)
            await page
              .getByRole("button", { name: "Components", exact: true })
              .click();
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
          await expect(page.locator("#search-status")).toContainText("0 of 98");
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
            if (["button", "table", "scheduler"].includes(entry.id))
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
            `${label}: 98 routes, source, interactions, clipboard and WCAG checks PASS`,
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
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
