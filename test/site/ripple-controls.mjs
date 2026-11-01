import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { pointerRipple, keyboardRipple } from "./ripple-feedback.mjs";
import { rippleChoices } from "./ripple-choices.mjs";

export async function rippleChecks(browser, name, base) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      hasTouch: width < 900,
      isMobile: width < 900 && name !== "firefox",
      reducedMotion: "no-preference",
    });
    try {
      await page.addInitScript(
        (width) =>
          localStorage.setItem(
            "meridian-catalogue",
            JSON.stringify({
              ripple: true,
              theme: width < 900 ? "dark" : "light",
              direction: width < 900 ? "rtl" : "ltr",
            }),
          ),
        width,
      );
      await page.goto(`${base}#/components/button`);
      const open = async (id) => {
        await page.evaluate((id) => (location.hash = `#/components/${id}`), id);
        await expect(page.locator(`iframe[data-ready="${id}"]`)).toBeVisible();
        return (await page.locator("iframe").elementHandle()).contentFrame();
      };
      await open("button");
      if (width < 900) await page.locator("#open-navigation").click();
      const link = page.locator('.docs-nav-link[data-component="checkbox"]');
      await pointerRipple(page, link);
      await keyboardRipple(page, link, link, "Space", false);
      const original = await link.elementHandle();
      await link.click();
      await expect(page.locator('iframe[data-ready="checkbox"]')).toBeVisible();
      assert.equal(
        await link.evaluate((node, original) => node === original, original),
        true,
        "Navigation retains mounted links and their pending feedback",
      );
      let frame = await open("menu");
      await pointerRipple(page, frame.getByRole("menuitem").first());
      await pointerRipple(
        page,
        page.locator(".meridian-code-viewer > summary").first(),
      );
      await rippleChoices(page, open);
      frame = await open("autocomplete");
      await frame
        .getByRole("combobox", { name: "Choose a language", exact: true })
        .fill("typed");
      await pointerRipple(page, frame.getByRole("option").first());
      frame = await open("button");
      const action = frame.getByRole("button", {
        name: "Create project",
        exact: true,
      });
      await pointerRipple(page, action);
      await keyboardRipple(page, action, action, "Enter");
      await page.locator("html").evaluate((node) => (node.style.zoom = "1.75"));
      await pointerRipple(page, page.locator("#palette"));
      await page.locator("html").evaluate((node) => (node.style.zoom = ""));
      for (const setting of [
        { reducedMotion: "reduce" },
        { forcedColors: "active", reducedMotion: "no-preference" },
      ]) {
        await page.emulateMedia(setting);
        await pointerRipple(page, action, action, false);
      }
      await page.emulateMedia({
        forcedColors: "none",
        reducedMotion: "no-preference",
      });
      await page.locator("#palette").click();
      await page.getByRole("switch", { name: "Ripple", exact: true }).uncheck();
      await page.locator("#palette").click();
      await expect(frame.locator("#demo-root")).toHaveAttribute(
        "data-meridian-ripples",
        "false",
      );
      await pointerRipple(page, action, action, false);
      await expect(frame.locator(".meridian-ripple-clip")).toHaveCount(0);
      console.log(
        `${name} ${width}px: ripple targets, navigation, native choices, keyboard, zoom and suppression PASS`,
      );
    } finally {
      await page.close();
    }
  }
}
