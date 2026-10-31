import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function colourPickers(page) {
  const form = page.locator("#primary-form");
  const colour = form.getByLabel("Theme colour", { exact: true });
  const popup = page.locator("#forms-demo .meridian-colour-popup");
  await colour.evaluate((input) => {
    window.colourInput = input;
  });
  await colour.focus();
  await colour.press("Enter");
  await expect(popup).toBeVisible();
  const hex = popup.getByRole("textbox", { name: "Hex colour", exact: true });
  await expect(hex).toBeFocused();
  await hex.fill("#wrong");
  await expect(
    popup.getByRole("button", { name: "Apply", exact: true }),
  ).toBeDisabled();
  await hex.fill("#00ff00");
  await popup.getByRole("slider", { name: "Hue", exact: true }).press("Home");
  await expect(hex).toHaveValue("#ff0000");
  await page.keyboard.press("Escape");
  await expect(colour).toHaveValue("#b41472");
  await expect(colour).toBeFocused();
  await colour.click();
  await hex.fill("#316a91");
  await hex.press("Enter");
  await expect(colour).toHaveValue("#316a91");
  assert.equal(
    await colour.evaluate((input) => input === window.colourInput),
    true,
  );
  assert.equal(
    await form.evaluate((form) => new FormData(form).get("colour")),
    "#316a91",
  );
  await colour.click();
  const plane = popup.locator(".meridian-colour-plane");
  const box = await plane.boundingBox();
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, {
    steps: 3,
  });
  await page.mouse.up();
  assert.match(await hex.inputValue(), /^#[0-9a-f]{6}$/);
  await popup
    .getByRole("button", { name: "Cancel", exact: true })
    .press("Enter");
  await expect(colour).toHaveValue("#316a91");
  await colour.click();
  await colour.evaluate((input) => (input.disabled = true));
  await expect(popup).toHaveCount(0);
  await colour.evaluate((input) => (input.disabled = false));
}
