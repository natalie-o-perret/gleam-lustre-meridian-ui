import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { codeCopyLayout } from "./code-copy-layout.mjs";

export async function codeCopyFeedback(page, open) {
  const frame = await open("codeblock");
  const viewer = frame.locator(".meridian-code-viewer");
  const copy = viewer.getByRole("button", { name: "Copy code", exact: true });
  const status = viewer.getByRole("status");
  const hover = await codeCopyLayout(page, viewer, copy);
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
    await expect(status).toHaveText("Copied.");
    await expect(status).toHaveClass(/sr-only/);
    await expect(status).toHaveCSS("clip-path", "inset(50%)");
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
    await frame.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw new Error("Clipboard denied");
      };
    });
    if (hover) await copy.click();
    else await copy.tap();
    await expect(status).toHaveText(
      "Copy unavailable. Select and copy the code.",
    );
    await expect(status).not.toHaveClass(/sr-only/);
    await expect(status).toBeVisible();
    await expect(copy).toHaveText("Copy");
  } finally {
    await frame.evaluate(() => {
      navigator.clipboard.writeText = window.codeCopyOriginal;
    });
  }
}
