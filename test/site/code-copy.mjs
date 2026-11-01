import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function codeCopyFeedback(page, open) {
  const frame = await open("codeblock");
  const viewer = frame.locator(".meridian-code-viewer");
  const copy = viewer.getByRole("button", { name: "Copy code", exact: true });
  await viewer.scrollIntoViewIfNeeded();
  await page.locator("#main").focus();
  await page.mouse.move(0, 0);
  const hover = await frame.evaluate(
    () => matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  await expect(copy).toHaveCSS("opacity", hover ? "0" : "1");
  if (hover) {
    await viewer.hover();
    await expect(copy).toHaveCSS("opacity", "1");
    await page.mouse.move(0, 0);
  }
  await viewer.locator("summary").focus();
  await viewer.locator("summary").press("Tab");
  await expect(copy).toBeFocused();
  await expect(copy).toHaveCSS("opacity", "1");
  await frame.evaluate(() => {
    window.codeCopyOriginal = navigator.clipboard.writeText;
    navigator.clipboard.writeText = async (text) => {
      window.codeCopyValue = text;
    };
  });
  try {
    if (hover) await copy.press("Enter");
    else await copy.tap();
    await expect(copy).toHaveText("Copied");
    await expect(copy).toHaveClass(/primary-button/);
    await expect(viewer.getByRole("status")).toHaveText("Copied.");
    assert.equal(
      await frame.evaluate(() => window.codeCopyValue),
      await viewer.getAttribute("data-code-source"),
    );
    await expect
      .poll(
        () =>
          copy.evaluate((node) => {
            const probe = document.createElement("span");
            probe.style.cssText =
              "color:var(--on-accent);background:var(--accent)";
            if (node.matches(":hover"))
              probe.style.background =
                "color-mix(in srgb, var(--accent) 88%, var(--ink))";
            node.append(probe);
            const actual = getComputedStyle(node),
              expected = getComputedStyle(probe);
            const matches =
              actual.color === expected.color &&
              actual.backgroundColor === expected.backgroundColor;
            probe.remove();
            return matches;
          }),
        { message: "Copied uses the primary and on-primary tokens" },
      )
      .toBe(true);
    await page.locator("#main").focus();
    await page.mouse.move(0, 0);
    await expect(copy).toHaveCSS("opacity", "1");
  } finally {
    await frame.evaluate(() => {
      navigator.clipboard.writeText = window.codeCopyOriginal;
    });
  }
}
