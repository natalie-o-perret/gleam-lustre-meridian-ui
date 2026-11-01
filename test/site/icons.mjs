import { expect } from "playwright/test";

export async function infrastructureIcons(page, frame) {
  const form = page.getByRole("form", {
    name: "Icons preview properties",
    exact: true,
  });
  const category = form.getByRole("combobox", {
    name: "Category",
    exact: true,
  });
  for (const name of [
    "cloud",
    "compute",
    "storage",
    "networking",
    "containers",
    "operations",
  ]) {
    await category.selectOption(name);
    await expect(frame.locator(".demo-icon-grid svg")).toHaveCount(9);
    await expect(frame.getByRole("status")).toHaveText("9 of 200 icons");
  }
  await category.selectOption("storage");
  await form
    .getByRole("textbox", { name: "Search icons", exact: true })
    .fill("s3");
  await form
    .getByRole("textbox", { name: "Search icons", exact: true })
    .press("Tab");
  await expect(frame.locator(".demo-icon-grid svg")).toHaveCount(1);
  await expect(frame.locator(".demo-icon-grid")).toHaveText(
    "S3 object storage",
  );
  await form
    .getByRole("combobox", { name: "Icon treatment", exact: true })
    .selectOption("duotone");
  await expect(frame.locator(".demo-icon-grid svg")).toHaveAttribute(
    "data-icon-style",
    "duotone",
  );
}
