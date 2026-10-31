import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function feedback(page, scenario) {
  await expect(page.getByRole("progressbar")).toHaveCount(4);
  const value = page.getByRole("slider", {
    name: "Progress value",
    exact: true,
  });
  for (const [input, expected] of [
    [-50, 0],
    [0, 0],
    [75, 75],
    [100, 100],
    [150, 100],
  ]) {
    await value.evaluate((el, value) => {
      el.value = String(value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, input);
    await expect(
      page.getByRole("progressbar", { name: "Upload", exact: true }),
    ).toHaveJSProperty("value", expected);
    await expect(
      page.getByRole("progressbar", { name: "Processing", exact: true }),
    ).toHaveAttribute("aria-valuenow", String(expected));
  }
  assert.ok(
    await page
      .locator("img")
      .evaluate((el) => el.complete && el.naturalWidth > 0),
  );
  const remove = page.getByRole("button", {
    name: "Remove Design",
    exact: true,
  });
  await remove.focus();
  await remove.press("Space");
  await expect(remove).toHaveCount(0);
  await expect(page.locator("#people-region")).toBeFocused();
  const dismiss = page.getByRole("button", {
    name: "Dismiss message",
    exact: true,
  });
  await dismiss.focus();
  await dismiss.press("Enter");
  await expect(dismiss).toHaveCount(0);
  await expect(page.locator("#messages-region")).toBeFocused();
  await page
    .getByRole("button", { name: "Finish loading", exact: true })
    .click();
  await expect(page.locator("#loading-region")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator(".meridian-skeleton")).toHaveCount(0);
}
