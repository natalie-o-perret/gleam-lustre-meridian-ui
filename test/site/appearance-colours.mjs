import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function appearanceColours(page, frame) {
  const button = page.getByRole("button", {
    name: "Customise appearance",
    exact: true,
  });
  const popup = page.getByRole("dialog", { name: "Appearance", exact: true });
  await page
    .getByRole("combobox", { name: "Source language", exact: true })
    .focus();
  await button.click();
  await page.locator("#style").selectOption("square");
  await expect(page.locator(".docs-source .meridian-tab").first()).toHaveCSS(
    "border-top-left-radius",
    "2px",
  );
  for (const [id, colour] of [
    ["primary-colour", "#228b22"],
    ["secondary-colour", "#663399"],
  ]) {
    await page.locator(`#${id}`).click();
    const picker = page.locator(".meridian-colour-popup");
    await picker
      .getByRole("textbox", { name: "Hex colour", exact: true })
      .fill(colour);
    await picker.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(popup).toBeVisible();
    await expect(page.locator(`#${id}-value`)).toHaveText(colour);
  }
  for (const token of [
    "--accent",
    "--accent-soft",
    "--on-accent",
    "--secondary",
    "--secondary-soft",
  ])
    await expect
      .poll(() =>
        frame
          .locator("#demo-root")
          .evaluate((node, token) => node.style.getPropertyValue(token), token),
      )
      .toBe(
        await page
          .locator("body")
          .evaluate((node, token) => node.style.getPropertyValue(token), token),
      );
  await popup.press("Escape");
  await expect(button).toBeFocused();
  await page.reload();
  await expect(page.locator('iframe[data-ready="codeblock"]')).toBeVisible();
  await expect(popup).toBeHidden();
  assert.deepEqual(
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("meridian-catalogue"));
      return [saved.primary, saved.secondary];
    }),
    ["#228b22", "#663399"],
  );
  await button.click();
  await page.locator("#reset-colours").click();
  await page.locator("#style").selectOption("rounded");
  await button.click();
  await expect(popup).toBeHidden();
}
