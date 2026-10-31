import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function appearanceMobileChecks(browser, name, base) {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: name !== "firefox",
      reducedMotion: "reduce",
    });
    try {
      await context.addInitScript(
        (width) =>
          localStorage.setItem(
            "meridian-catalogue",
            JSON.stringify({
              theme: width === 320 ? "dark" : "light",
              direction: width === 320 ? "rtl" : "ltr",
            }),
          ),
        width,
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}#/components/codeblock`);
      await expect(
        page.locator('iframe[data-ready="codeblock"]'),
      ).toBeVisible();
      assert.ok(
        await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
      );
      for (const id of ["theme", "palette", "open-navigation"])
        await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 1 });
      const button = page.locator("#palette");
      const original = await page
        .locator("#primary-colour-value")
        .textContent();
      const popup = page.getByRole("dialog", {
        name: "Appearance",
        exact: true,
      });
      await button.tap();
      await expect(popup).toBeInViewport({ ratio: 1 });
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await page.locator("#primary-colour").tap();
      const picker = page.locator(".meridian-colour-popup");
      const hex = picker.getByRole("textbox", {
        name: "Hex colour",
        exact: true,
      });
      await hex.tap();
      await hex.fill("#228b22");
      const apply = picker.getByRole("button", { name: "Apply", exact: true });
      await expect(apply).toBeInViewport({ ratio: 1 });
      await apply.tap();
      await expect(popup).toBeVisible();
      await expect(page.locator("#primary-colour-value")).toHaveText("#228b22");
      await page.setViewportSize({ width: height, height: width });
      await expect(popup).toBeInViewport({ ratio: 1 });
      await page.locator("#reset-colours").tap();
      await expect(page.locator("#primary-colour-value")).toHaveText(original);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await button.tap();
      await expect(popup).toBeHidden();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await button.tap();
      const viewport = page.viewportSize();
      await page.touchscreen.tap(viewport.width / 2, viewport.height - 1);
      await expect(popup).toBeHidden();
      assert.deepEqual(errors, []);
      console.log(
        `${name} ${width}x${height}: palette touch, nested editing and rotation PASS (${name === "firefox" ? "touch-only, mobile mode unsupported" : "mobile emulation"})`,
      );
    } finally {
      await context.close();
    }
  }
}
