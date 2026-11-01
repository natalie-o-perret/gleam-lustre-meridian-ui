import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function codeCopyLayout(page, viewer, copy) {
  await viewer.scrollIntoViewIfNeeded();
  await page.locator("#main").focus();
  await page.mouse.move(0, 0);
  const hover = await viewer.evaluate(
    (node) =>
      node.ownerDocument.defaultView.matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches,
  );
  await expect(copy).toHaveCSS("position", "absolute");
  await expect(
    viewer.locator(".meridian-code-tools .meridian-code-copy"),
  ).toHaveCount(0);
  const [code, control] = await Promise.all([
    viewer.locator("pre").boundingBox(),
    copy.boundingBox(),
  ]);
  assert.ok(code && control);
  assert.ok(
    Math.abs(control.x + control.width - code.x - code.width + 10) <= 1,
    "Copy overlays the code's right edge",
  );
  assert.ok(
    Math.abs(control.y - code.y - 10) <= 1,
    "Copy overlays the code's top edge",
  );
  await expect(copy).toHaveCSS("opacity", hover ? "0" : "0.75");
  if (hover) {
    await viewer.hover();
    await expect(copy).toHaveCSS("opacity", "0.75");
    await copy.hover();
    await expect(copy).toHaveCSS("opacity", "1");
    await page.mouse.move(0, 0);
  }
  await viewer.locator("summary").focus();
  const headerActions = await viewer
    .locator(".meridian-code-tools button")
    .count();
  for (let index = 0; index <= headerActions; index++)
    await page.keyboard.press("Tab");
  await expect(copy).toBeFocused();
  await expect(copy).toHaveCSS("opacity", "1");
  return hover;
}
