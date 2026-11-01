import { expect } from "playwright/test";

export async function groupShapes(page) {
  const root = page.locator("#forms-demo");
  const group = root.locator(".meridian-input-group").first();
  const input = group.locator("input");
  const initial = await input.inputValue();
  for (const style of ["rounded", "square", "playful", "fantasy"]) {
    await root.evaluate((root, style) => (root.dataset.style = style), style);
    for (const [child, edge] of [
      [":first-child", "start"],
      [":last-child", "end"],
    ]) {
      for (const block of ["start", "end"]) {
        const property = `border-${block}-${edge}-radius`;
        await expect(group.locator(`:scope > ${child}`)).toHaveCSS(
          property,
          await group.evaluate(
            (node, property) =>
              getComputedStyle(node).getPropertyValue(property),
            property,
          ),
        );
      }
    }
    await expect(input).toHaveCSS("border-radius", "0px");
    await expect(input).toHaveValue(initial);
    await expect(page.locator("#other-instance")).not.toHaveAttribute(
      "data-style",
      style,
    );
  }
  await root.evaluate((root) =>
    root.style.setProperty("--radius", "16px 3px 9px 5px"),
  );
  const rtl = await group.evaluate((node) => node.matches(":dir(rtl)"));
  await expect(
    group.locator(`:scope > :${rtl ? "first" : "last"}-child`),
  ).toHaveCSS("border-top-right-radius", "3px");
  await expect(
    group.locator(`:scope > :${rtl ? "last" : "first"}-child`),
  ).toHaveCSS("border-bottom-left-radius", "5px");
  await root.evaluate((root) => {
    delete root.dataset.style;
    root.style.removeProperty("--radius");
  });
}
