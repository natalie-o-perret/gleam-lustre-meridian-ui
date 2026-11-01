import { expect } from "playwright/test";

export async function appearanceShapes(page, open) {
  for (const [style, radius, small] of [
    ["rounded", "12px", "8px"],
    ["square", "2px", "2px"],
    ["playful", "22px", "10px"],
    ["fantasy", "18px 4px", "10px 2px"],
  ]) {
    const frame = await open("button");
    await page.locator("#palette").click();
    const input = page.locator(`#style input[value="${style}"]`);
    await input.locator("..").click();
    await expect(input).toBeChecked();
    await expect(page.locator("body")).toHaveAttribute("data-style", style);
    await expect(
      page.locator("#style .meridian-select-button-options"),
    ).toHaveCSS("border-radius", radius);
    for (const face of await page.locator("#style label > span").all())
      await expect(face).toHaveCSS("border-radius", small);
    await expect(
      page.locator("#primary-presets label > span").first(),
    ).toHaveCSS("border-radius", "50%");
    await input.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(input).toBeFocused();
    await expect(input.locator("+ span")).toHaveCSS("outline-style", "solid");
    await page.locator("#palette").click();
    await expect(frame.locator("#demo-root")).toHaveAttribute(
      "data-style",
      style,
    );
    for (const button of await frame.locator("#demo-root button").all())
      await expect(button).toHaveCSS("border-radius", radius);
    const choices = await open("selectbutton");
    for (const face of await choices
      .locator(".meridian-select-choice > span")
      .all())
      await expect(face).toHaveCSS("border-radius", radius);
    const chips = await open("chip");
    await expect(
      chips.getByRole("button", { name: "Remove Design", exact: true }),
    ).toHaveCSS("border-radius", small);
  }
  await page.locator("#palette").click();
  await page.locator('#style label:has(input[value="rounded"])').click();
  await page.locator("#palette").click();
}
