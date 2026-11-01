import { expect } from "playwright/test";
import {
  pointerRipple,
  keyboardRipple,
  touchRipple,
} from "./ripple-feedback.mjs";

export async function rippleChoices(page, open) {
  await page.locator("#palette").click();
  for (const selector of [
    '#primary-presets label:has(input[value="#ec4899"])',
    '#surface-presets label:has(input[value="#64748b"])',
    '#style label:has(input[value="fantasy"])',
  ]) {
    const choice = page.locator(selector);
    const face = choice.locator(":scope > span");
    await pointerRipple(page, choice, face);
    if (await page.evaluate(() => navigator.maxTouchPoints > 0))
      await touchRipple(choice, face);
    await choice.click();
    await expect(choice.locator("input")).toBeChecked();
    await keyboardRipple(page, choice.locator("input"), face);
    await expect(face).toHaveCSS("overflow", "visible");
  }
  await page.locator("#palette").click();
  for (const [id, selector, face] of [
    ["selectbutton", ".meridian-select-choice", ":scope > span"],
    ["checkbox", ".selection-checkbox", ".checkbox-mark"],
    ["radiobutton", ".meridian-radio-field", null],
    ["toggleswitch", ".meridian-switch", ".meridian-switch-track"],
    ["rating", ".meridian-rating-choice", null],
    ["tree", '[role="treeitem"]', ":scope > .meridian-tree-row"],
  ]) {
    const frame = await open(id);
    const control = frame.locator(selector).first();
    const host = face ? control.locator(face) : control;
    await pointerRipple(page, id === "tree" ? host : control, host);
    if (id !== "tree")
      await keyboardRipple(page, control.locator("input"), host);
  }
  const frame = await open("checkbox");
  const disabled = frame.locator(".selection-checkbox").last();
  await pointerRipple(
    page,
    disabled,
    disabled.locator(".checkbox-mark"),
    false,
  );
  const input = frame.locator(".selection-checkbox input").first();
  await input.uncheck();
  await keyboardRipple(
    page,
    input,
    input.locator("..").locator(".checkbox-mark"),
  );
  await expect(input).toBeChecked();
  await input.evaluate((node) =>
    node.setAttribute("data-meridian-ripple", "true"),
  );
  await keyboardRipple(
    page,
    input,
    input.locator("..").locator(".checkbox-mark"),
  );
  await expect(input).not.toBeChecked();
}
