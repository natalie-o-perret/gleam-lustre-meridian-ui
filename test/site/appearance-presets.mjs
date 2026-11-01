import { expect } from "playwright/test";
import { appearancePersistence } from "./appearance-persistence.mjs";

export async function appearancePresets(page, open) {
  const frame = await open("codeblock");
  const trigger = page.locator("#palette");
  await trigger.click();
  for (const [id, count] of [
    ["primary-presets", 18],
    ["surface-presets", 9],
    ["style", 4],
  ])
    await expect(page.locator(`#${id} input[type="radio"]`)).toHaveCount(count);
  await page
    .locator('#primary-presets label:has(input[value="#10b981"])')
    .click();
  await expect(page.locator("#primary-presets .docs-swatch-name")).toHaveText(
    "Emerald",
  );
  await page
    .locator('#primary-presets label:has(input[value="#3b82f6"])')
    .click();
  await expect(page.locator("#primary-presets .docs-swatch-name")).toHaveText(
    "Blue",
  );
  await page
    .locator('#primary-presets label:has(input[value="#10b981"])')
    .click();
  await page
    .locator('#surface-presets label:has(input[value="#64748b"])')
    .click();
  await page.locator('#style label:has(input[value="fantasy"])').click();
  await page.getByRole("switch", { name: "Ripple", exact: true }).uncheck();
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-style",
    "fantasy",
  );
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-meridian-ripples",
    "false",
  );
  for (const name of [
    "--bg",
    "--panel",
    "--sidebar",
    "--ink",
    "--muted",
    "--border",
    "--track",
    "--accent",
    "--on-accent",
  ])
    await expect
      .poll(() =>
        frame
          .locator("#demo-root")
          .evaluate((node, name) => node.style.getPropertyValue(name), name),
      )
      .toBe(
        await page
          .locator("body")
          .evaluate((node, name) => node.style.getPropertyValue(name), name),
      );
  await appearancePersistence(page);
  await page.locator('#primary-presets label:has(input[value="mono"])').click();
  await expect(
    page.locator('#primary-presets input[value="mono"]'),
  ).toBeChecked();
  await page.locator('#primary-presets input[value="mono"]').press("ArrowDown");
  await expect(page.locator('#primary-presets input[value=""]')).toBeChecked();
  await page.locator(".docs-appearance-custom > summary").click();
  await page.locator("#reset-colours").click();
  await page.locator('#style label:has(input[value="rounded"])').click();
  await page.getByRole("switch", { name: "Ripple", exact: true }).uncheck();
  await trigger.click();
}
