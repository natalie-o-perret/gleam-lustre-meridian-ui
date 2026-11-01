import { expect } from "playwright/test";

export async function tooltipLayout(page, open) {
  const frame = await open("checkbox");
  const checkbox = frame.getByRole("checkbox", {
    name: "Send project updates",
    exact: true,
  });
  const preview = page.locator("iframe");
  await preview.scrollIntoViewIfNeeded();
  const height = await preview.evaluate(
    (node) => node.getBoundingClientRect().height,
  );
  await checkbox.hover();
  const tip = frame.getByRole("tooltip");
  await expect(tip).toHaveText("Choose whether to receive updates");
  await expect
    .poll(
      async () => {
        const [row, hint] = await Promise.all([
          frame.locator(".demo-row").boundingBox(),
          tip.boundingBox(),
        ]);
        return (
          row &&
          hint &&
          (hint.y >= row.y + row.height || hint.y + hint.height <= row.y)
        );
      },
      { message: "The tooltip leaves the checkbox row readable and clickable" },
    )
    .toBeTruthy();
  await expect(preview).toHaveJSProperty("offsetHeight", Math.round(height));
  await tip.hover();
  await expect(tip).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(tip).toBeHidden();
  await page.locator("#main").focus();
  await checkbox.focus();
  await expect(tip).toBeVisible();
  await expect(checkbox).toHaveAttribute("aria-describedby", /tooltip/);
  await checkbox.press("Escape");
  await expect(tip).toBeHidden();
}
