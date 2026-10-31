import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { appearanceMobileChecks } from "./appearance-mobile.mjs";

export function catalogueScenarios(width = "") {
  const scenarios = [
    { width: 1440, theme: "light", direction: "ltr", motion: "no-preference" },
    { width: 320, theme: "dark", direction: "rtl", motion: "reduce" },
  ].filter((scenario) => !width || String(scenario.width) === width);
  assert.ok(scenarios.length, "Unknown catalogue width");
  return scenarios;
}

export async function viewportChecks(browser, name, base) {
  await appearanceMobileChecks(browser, name, base);
  await layoutChecks(browser, name, base);
  const sizes = [
    [1280, 720],
    [960, 540],
    [390, 844],
    [844, 390],
    [320, 568],
  ];
  const examples = [
    ["datepicker", "Single date", "Close picker"],
    ["datepicker", "Start date", "Close picker"],
    ["datepicker", "Month", "Close picker"],
    ["timepicker", "Meeting time (09:00-17:00)", "Close picker"],
    ["datetimepicker", "Meeting date and time", "Close picker"],
    ["datetimepicker", "Start date and time", "Close picker"],
    ["inputcolor", "Accent colour", "Cancel"],
    ["dialog", "Edit project", "Close Edit project"],
  ];
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      ({ width }) => {
        localStorage.setItem(
          "meridian-catalogue",
          JSON.stringify({
            theme: width < 500 ? "dark" : "light",
            direction: width < 500 ? "rtl" : "ltr",
          }),
        );
      },
      { width },
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      for (const [id, label, close] of examples) {
        await page.goto(`${base}#/components/${id}`);
        await expect(page.locator(`iframe[data-ready="${id}"]`)).toBeVisible();
        const frame = await (
          await page.locator("iframe").elementHandle()
        ).contentFrame();
        const originalHeight = await page
          .locator("iframe")
          .evaluate((frame) => frame.getBoundingClientRect().height);
        if (id === "dialog")
          await frame.getByRole("button", { name: label, exact: true }).click();
        else await frame.getByLabel(label, { exact: true }).click();
        const popup = frame.locator("dialog[open]");
        await expect(popup).toBeVisible();
        await expect(page.locator("iframe")).toHaveAttribute(
          "data-overlay-open",
          "true",
        );
        await expect
          .poll(
            async () => {
              const box = await popup.boundingBox();
              const header = await page.locator(".docs-header").boundingBox();
              return (
                box &&
                box.x >= -1 &&
                box.x + box.width <= width + 1 &&
                box.y >= header.y + header.height &&
                box.y + box.height <= height + 1 &&
                box.height >= Math.min(180, height - header.height - 40)
              );
            },
            {
              message: `${name} ${width}x${height} ${label}: usable popup inside the visible browser area`,
            },
          )
          .toBeTruthy();
        const action = popup.getByRole("button", { name: close, exact: true });
        await expect(action).toBeInViewport({ ratio: 1 });
        if (id === "inputcolor") {
          const apply = popup.getByRole("button", {
            name: "Apply",
            exact: true,
          });
          await expect(apply).toBeInViewport({ ratio: 1 });
          await expect(
            popup.getByRole("textbox", { name: "Hex colour", exact: true }),
          ).toBeInViewport({ ratio: 1 });
          await popup.locator(".meridian-colour-content").evaluate((node) => {
            node.scrollTop = node.scrollHeight;
          });
          await expect(apply).toBeInViewport({ ratio: 1 });
          await expect(action).toBeInViewport({ ratio: 1 });
        }
        if (
          (width === 960 && id === "datetimepicker") ||
          (width === 390 && id === "inputcolor") ||
          (width === 844 && id === "dialog")
        )
          await page.screenshot({
            path: `test-results/viewport-${name}-${width}-${id}-${label.startsWith("Start") ? "range" : "single"}.png`,
          });
        await action.click();
        await expect(popup).toHaveCount(0);
        await expect(page.locator("iframe")).toHaveAttribute(
          "data-overlay-open",
          "false",
        );
        await expect
          .poll(() =>
            page
              .locator("iframe")
              .evaluate((frame) => frame.getBoundingClientRect().height),
          )
          .toBeCloseTo(originalHeight, 0);
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  console.log(
    `${name}: ${sizes.length * examples.length} popup viewport checks PASS`,
  );
}

async function layoutChecks(browser, name, base) {
  for (const width of [1440, 684, 560, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    try {
      await page.goto(`${base}#/components/treetable`);
      await expect(
        page.locator('iframe[data-ready="treetable"]'),
      ).toBeVisible();
      for (const zoom of [1, 1.75, 2]) {
        await page.locator("html").evaluate((node, zoom) => {
          node.style.zoom = String(zoom);
        }, zoom);
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          )
          .toBeTruthy();
        const layout = await page.evaluate(() => {
          const header = document
            .querySelector(".docs-header")
            .getBoundingClientRect();
          const main = document
            .querySelector(".docs-main")
            .getBoundingClientRect();
          const panel = document
            .querySelector(".docs-example")
            .getBoundingClientRect();
          return {
            symmetrical:
              Math.abs(panel.left - main.left - (main.right - panel.right)) <=
              1,
            tools: [...document.querySelectorAll(".docs-tools > *")]
              .filter((node) => node.getClientRects().length)
              .every((node) => {
                const rect = node.getBoundingClientRect();
                return (
                  rect.left >= header.left &&
                  rect.right <= header.right &&
                  rect.bottom <= header.bottom
                );
              }),
          };
        });
        assert.ok(
          layout.symmetrical,
          `${name} ${width}px ${zoom}x: equal page insets`,
        );
        assert.ok(
          layout.tools,
          `${name} ${width}px ${zoom}x: header controls remain reachable`,
        );
        await page.locator("#palette").click();
        const palette = page.getByRole("dialog", {
          name: "Appearance",
          exact: true,
        });
        await expect(
          palette,
          `${name} ${width}px ${zoom}x: palette stays inside the viewport`,
        ).toBeInViewport({ ratio: 1 });
        assert.ok(
          await palette
            .locator(".docs-colour-control")
            .evaluateAll((controls) =>
              controls.every((control) => {
                const range = document.createRange();
                range.selectNodeContents(control.querySelector("code"));
                return (
                  range.getClientRects().length === 1 &&
                  control.scrollWidth <= control.clientWidth + 1
                );
              }),
            ),
          `${name} ${width}px ${zoom}x: readable palette hex values`,
        );
        await palette.press("Escape");
        await expect(palette).toBeHidden();
        if (width === 390 && zoom === 1.75)
          await page.screenshot({
            path: `test-results/responsive-${name}-${width}-${zoom}.png`,
          });
      }
    } finally {
      await page.close();
    }
  }
  console.log(`${name}: 15 responsive width/zoom layouts PASS`);
}
