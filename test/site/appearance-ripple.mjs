import { expect } from "playwright/test";

export async function appearanceRipple(page, open) {
  const motion = await page.evaluate(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduce"
      : "no-preference",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const frame = await open("button");
  await page.locator("#palette").click();
  await page.getByRole("switch", { name: "Ripple", exact: true }).check();
  await page.locator("#palette").click();
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-meridian-ripples",
    "true",
  );
  const action = frame.getByRole("button", {
    name: "Create project",
    exact: true,
  });
  await action.click();
  await expect(action).toHaveCSS("position", "relative");
  await expect(action).toHaveCSS("overflow", "hidden");
  await expect(action.locator(".meridian-ripple-effect")).toHaveCount(1);
  await expect(action.locator(".meridian-ripple-effect")).toHaveCount(0);
  await page.locator("#palette").click();
  await page.getByRole("switch", { name: "Ripple", exact: true }).uncheck();
  await expect(frame.locator("#demo-root")).toHaveAttribute(
    "data-meridian-ripples",
    "false",
  );
  await page.locator("#palette").click();
  await action.click();
  await expect(action.locator(".meridian-ripple-effect")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: motion });
}
