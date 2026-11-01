import { expect } from "playwright/test";

export async function autocompleteLayout(page, open) {
  const frame = await open("autocomplete");
  const input = frame.getByRole("combobox", {
    name: "Choose a language",
    exact: true,
  });
  const popup = frame.getByRole("listbox", {
    name: "Suggestions",
    exact: true,
  });
  await input.focus();
  await expect(popup).toHaveCount(0);
  await input.click();
  await expect(popup).toHaveCount(0);
  await input.fill("typed");
  await expect(popup.getByRole("option")).toHaveCount(2);
  await input.fill("");
  await expect(popup).toHaveCount(0);
  const viewport = page.viewportSize();
  try {
    await page.setViewportSize({ ...viewport, height: 480 });
    await input.scrollIntoViewIfNeeded();
    await input.press("ArrowDown");
    await expect(popup.getByRole("option")).toHaveCount(20);
    await expect
      .poll(
        async () => {
          const [field, list] = await Promise.all([
            input.boundingBox(),
            popup.boundingBox(),
          ]);
          return (
            field &&
            list &&
            (list.y >= field.y + field.height ||
              list.y + list.height <= field.y)
          );
        },
        { message: "Suggestions leave the input visible in a short viewport" },
      )
      .toBeTruthy();
    await input.press("End");
    await expect(popup.getByRole("option").last()).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await input.press("Enter");
    await expect(input).toHaveValue("Zig");
    await expect(popup).toHaveCount(0);
  } finally {
    await page.setViewportSize(viewport);
  }
}
