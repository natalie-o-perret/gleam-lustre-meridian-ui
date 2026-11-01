import { expect } from "playwright/test";

export async function appearanceLayout(page, label) {
  await page.locator("#palette").click();
  const palette = page.getByRole("dialog", {
    name: "Appearance",
    exact: true,
  });
  await expect(
    palette,
    `${label}: palette stays inside the viewport`,
  ).toBeInViewport({ ratio: 1 });
  const custom = palette.locator(".docs-appearance-custom");
  if ((await custom.getAttribute("open")) === null)
    await custom.locator("summary").click();
  await expect(custom).toHaveAttribute("open", "");
  const controls = custom.locator(".docs-colour-control");
  await expect(controls).toHaveCount(2);
  for (const code of await controls.locator("code").all())
    await expect(code).toBeVisible();
  await expect
    .poll(
      () =>
        controls.evaluateAll((controls) =>
          controls.every((control) => {
            const range = document.createRange();
            range.selectNodeContents(control.querySelector("code"));
            return (
              range.getClientRects().length === 1 &&
              control.scrollWidth <= control.clientWidth + 1
            );
          }),
        ),
      { message: `${label}: readable palette hex values` },
    )
    .toBeTruthy();
  await palette.press("Escape");
  await expect(palette).toBeHidden();
}
