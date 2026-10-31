import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { expect } from "playwright/test";
import { serve } from "../test/browser/server.mjs";

assert.ok(
  process.env.CONSUMER,
  "Set CONSUMER to a built dashboard dist directory",
);
const root = resolve(process.env.CONSUMER);
const prefix = "/spa-dashboards/gleam-lustre/";
const server = await serve(root, prefix);
const code = await readFile(resolve(root, "meridian.js"), "utf8");
assert.ok(
  !/ProseMirror|dayGridMonth|\[ECharts\]/.test(code),
  "Unused advanced engines entered the dashboard bundle",
);
assert.equal(
  await readFile(resolve(root, "meridian-ui.css"), "utf8"),
  await readFile(new URL("../priv/meridian-ui.css", import.meta.url), "utf8"),
);
try {
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(
            `${response.status()} ${new URL(response.url()).pathname}`,
          );
      });
      await page.goto(server.url + prefix);
      await expect(
        page.getByRole("heading", { name: "Portfolio overview", exact: true }),
      ).toBeVisible();
      const table = page.getByRole("table", { name: "Projects", exact: true });
      await expect(table.locator("tbody tr")).toHaveCount(5);
      await page.getByRole("button", { name: "Go to next page" }).click();
      await expect(table.locator("tbody tr").first()).toContainText(
        "Fieldnote analytics",
      );
      await page.getByLabel("Search projects", { exact: true }).fill("At risk");
      await expect(table.locator("tbody tr")).toHaveCount(4);
      await page.getByLabel("Select all projects on this page").check();
      await expect(page.getByRole("status")).toContainText("4 selected");
      await page
        .getByLabel("Select Beacon research hub", { exact: true })
        .uncheck();
      await expect
        .poll(() =>
          page
            .getByLabel("Select all projects on this page")
            .evaluate((el) => el.indeterminate),
        )
        .toBe(true);
      await page.getByRole("button", { name: "Clear filters" }).click();
      const sort = page.getByRole("button", {
        name: "Sort by Project",
        exact: true,
      });
      await sort.click();
      await sort.click();
      await expect(table.locator("tbody tr").first()).toContainText(
        "Relay API catalogue",
      );
      await page
        .getByLabel("Filter by status", { exact: true })
        .selectOption("Blocked");
      await expect(table.locator("tbody tr")).toHaveCount(2);
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.getByRole("button", { name: "Compact", exact: true }).click();
      await expect(table).toHaveClass("compact");
      await page
        .getByLabel("Rows per page", { exact: true })
        .selectOption("all");
      await expect(table.locator("tbody tr")).toHaveCount(18);
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export CSV" }).click();
      const download = await downloading;
      const csv = await readFile(await download.path(), "utf8");
      assert.equal(csv.charCodeAt(0), 0xfeff);
      assert.equal(csv.split("\r\n").length, 19);
      for (const width of [1440, 1024, 800, 768, 630, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
      assert.deepEqual(errors, []);
      console.log(
        `${name}: Git consumer search, sort, filtering, selection, paging, density, CSV and 7 widths PASS`,
      );
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.close();
}
