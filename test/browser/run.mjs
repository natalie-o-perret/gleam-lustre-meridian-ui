import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
import { serve } from "./server.mjs";
import { keyboard } from "./keyboard.mjs";
import { overlays } from "./overlays.mjs";
import { selection } from "./selection.mjs";
import { data } from "./data.mjs";
import { utilities } from "./utilities.mjs";
import { pro } from "./pro.mjs";
import { feedback } from "./feedback.mjs";
import { forms } from "./forms.mjs";
import { panels } from "./panels.mjs";

const require = createRequire(import.meta.url);
const engines = { chromium, firefox, webkit };
const names = (process.env.BROWSER ?? "chromium,firefox,webkit").split(",");
assert.ok(
  names.length && names.every((name) => Object.hasOwn(engines, name)),
  "Unknown browser",
);
const scenarios = [
  { width: 1440, theme: "light", direction: "ltr", motion: "no-preference" },
  { width: 390, theme: "dark", direction: "ltr", motion: "reduce" },
  { width: 320, theme: "light", direction: "rtl", motion: "reduce" },
  { width: 1440, theme: "dark", direction: "rtl", motion: "no-preference" },
  {
    width: 390,
    theme: "light",
    direction: "ltr",
    motion: "reduce",
    forcedColors: "active",
  },
  {
    width: 320,
    theme: "dark",
    direction: "rtl",
    motion: "reduce",
    forcedColors: "active",
  },
];
const suites = [
  { name: "feedback", check: feedback, root: "component-demo" },
  { name: "forms", check: forms, root: "forms-demo" },
  { name: "panels", check: panels, root: "panels-demo" },
  { name: "keyboard", check: keyboard, root: "keyboard-demo" },
  { name: "overlays", check: overlays, root: "overlays-demo" },
  { name: "selection", check: selection, root: "selection-demo" },
  { name: "data", check: data, root: "data-demo" },
  { name: "utilities", check: utilities, root: "utilities-demo" },
  { name: "pro", check: pro, root: "pro-demo" },
];
if (process.env.SUITE)
  assert.ok(
    process.env.SUITE.split(",").every((name) =>
      suites.some((suite) => suite.name === name),
    ),
    "Unknown suite",
  );
await mkdir("test-results", { recursive: true });
const server = await serve();
try {
  for (const name of names) {
    const browser = await engines[name].launch();
    try {
      for (const suite of suites.filter(
        (suite) =>
          !process.env.SUITE ||
          process.env.SUITE.split(",").includes(suite.name),
      )) {
        for (const scenario of scenarios) {
          const context = await browser.newContext({
            viewport: { width: scenario.width, height: 1000 },
            colorScheme: scenario.theme,
            reducedMotion: scenario.motion,
            forcedColors: scenario.forcedColors ?? "none",
          });
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("response", (response) => {
            if (response.status() >= 400)
              errors.push(
                `${response.status()} ${new URL(response.url()).pathname}`,
              );
          });
          const label = `${name} ${suite.name} ${scenario.width}px ${scenario.theme} ${scenario.direction}${scenario.forcedColors ? " forced" : ""}`;
          try {
            await page.goto(`${server.url}/test/${suite.name}.html`);
            await page.locator(`#${suite.root}`).waitFor();
            await page.evaluate(
              (dir) => (document.documentElement.dir = dir),
              scenario.direction,
            );
            if (scenario.theme === "dark")
              await page
                .getByRole("button", { name: "Toggle theme", exact: true })
                .click();
            await suite.check(page, scenario);
            if (scenario.forcedColors) {
              const colours = await page
                .locator(".meridian-ui.fixture")
                .evaluateAll((roots) =>
                  roots.map((root) => {
                    const style = getComputedStyle(root);
                    return [style.color, style.backgroundColor];
                  }),
                );
              const luminance = (colour) => {
                const values = colour
                  .match(/[0-9.]+/g)
                  .slice(0, 3)
                  .map(Number)
                  .map((value) => value / 255)
                  .map((value) =>
                    value <= 0.04045
                      ? value / 12.92
                      : ((value + 0.055) / 1.055) ** 2.4,
                  );
                return (
                  values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
                );
              };
              for (const [foreground, background] of colours) {
                const a = luminance(foreground),
                  b = luminance(background);
                assert.ok(
                  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
                  `${label}: used system colour contrast`,
                );
              }
            }
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
              `${label}: overflow`,
            );
            await page.addScriptTag({
              path: require.resolve("axe-core/axe.min.js"),
            });
            const violations = await page.evaluate(async () => {
              const result = await axe.run(document, {
                rules: {
                  "color-contrast": {
                    enabled: !matchMedia("(forced-colors: active)").matches,
                  },
                },
                runOnly: {
                  type: "tag",
                  values: [
                    "wcag2a",
                    "wcag2aa",
                    "wcag21a",
                    "wcag21aa",
                    "wcag22aa",
                  ],
                },
              });
              return result.violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => ({
                  html: n.html,
                  summary: n.failureSummary,
                })),
              }));
            });
            assert.deepEqual(
              violations,
              [],
              `${label}: ${JSON.stringify(violations)}`,
            );
            assert.deepEqual(errors, [], label);
            if (scenario.width === 1440 || scenario.forcedColors)
              await page.screenshot({
                path: `test-results/${name}-${suite.name}-${scenario.width}-${scenario.theme}-${scenario.direction}${scenario.forcedColors ? "-forced" : ""}.png`,
                fullPage: true,
                animations: "disabled",
              });
            console.log(`${label}: PASS`);
          } catch (error) {
            await page.screenshot({
              path: `test-results/${name}-${suite.name}-${scenario.width}-${scenario.direction}.png`,
              fullPage: true,
            });
            throw error;
          } finally {
            await context.close();
          }
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
