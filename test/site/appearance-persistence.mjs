import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function appearancePersistence(page) {
  const catalogue = page.url();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("meridian-catalogue")),
  );
  assert.deepEqual(
    [saved.primary, saved.surface, saved.style, saved.ripple],
    ["#10b981", "#64748b", "fantasy", false],
  );
  const colours = await page
    .locator("body")
    .evaluate((node) =>
      Object.fromEntries(
        ["--panel", "--accent", "--on-accent"].map((name) => [
          name,
          node.style.getPropertyValue(name),
        ]),
      ),
    );
  const standalone = await page
    .locator("#standalone-preview")
    .getAttribute("href");
  const url = new URL(standalone, catalogue);
  for (const [key, value] of [
    ["primary", "#10b981"],
    ["surface", "#64748b"],
    ["ripple", "false"],
  ])
    assert.equal(url.searchParams.get(key), value);
  await page.goto(url.href);
  await expect(page.locator('html[data-ready="codeblock"]')).toBeVisible();
  await expect(page.locator("#demo-root")).toHaveAttribute(
    "data-meridian-ripples",
    "false",
  );
  await expect(page.locator("#demo-root")).toHaveAttribute(
    "data-style",
    "fantasy",
  );
  for (const [name, colour] of Object.entries(colours))
    assert.equal(
      await page
        .locator("#demo-root")
        .evaluate((node, name) => node.style.getPropertyValue(name), name),
      colour,
    );
  await page.goto(catalogue);
  await expect(page.locator('iframe[data-ready="codeblock"]')).toBeVisible();
  await page.locator("#palette").click();
  await expect(
    page.locator('#surface-presets input[value="#64748b"]'),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Ripple", exact: true }),
  ).not.toBeChecked();
}
