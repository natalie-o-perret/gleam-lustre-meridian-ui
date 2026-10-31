import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function datePickers(page, scenario) {
  const form = page.locator("#primary-form");
  const date = form.getByLabel("Appointment date", { exact: true });
  const popup = page.locator("#forms-demo .meridian-picker-popup");
  const forward = scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  await date.evaluate((input) => {
    window.pickerInput = input;
    window.pickerEvents = [];
    for (const name of ["input", "change"])
      input.addEventListener(name, () =>
        window.pickerEvents.push([name, input.value]),
      );
  });
  await date.click();
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-date="2024-02-28"]')).toBeFocused();
  await page.keyboard.press(forward);
  await expect(popup.locator('[data-date="2024-02-29"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(date).toHaveValue("2024-02-29");
  await expect(date).toBeFocused();
  assert.deepEqual(await page.evaluate(() => window.pickerEvents), [
    ["input", "2024-02-29"],
    ["change", "2024-02-29"],
  ]);
  assert.equal(
    await date.evaluate((input) => input === window.pickerInput),
    true,
  );
  await date.press("Alt+ArrowDown");
  await expect(popup).toBeVisible();
  await popup.locator('[data-date="2024-02-26"]').focus();
  await page.keyboard.press("Enter");
  await expect(date).toHaveValue("2024-02-29");
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(popup.locator(".meridian-picker-title")).toHaveText(
    "March 2024",
  );
  await popup
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await popup.locator('[data-date="2024-02-29"]').focus();
  await page.keyboard.press("PageDown");
  await expect(popup.locator('[data-date="2024-03-29"]')).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(popup.locator('[data-date="2024-02-29"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(date).toBeFocused();

  const month = form.getByLabel("Appointment month", { exact: true });
  await month.click();
  await expect(popup.locator('[data-month="2024-03"]')).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.keyboard.press(forward);
  await expect(popup.locator('[data-month="2024-03"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(month).toHaveValue("2024-02");
  await page.keyboard.press(forward);
  await page.keyboard.press("Enter");
  await expect(month).toHaveValue("2024-04");
  await expect(month).toBeFocused();

  const time = form.getByLabel("Appointment time", { exact: true });
  await time.click();
  const hours = popup.getByRole("spinbutton", { name: "Hours", exact: true });
  const minutes = popup.getByRole("spinbutton", {
    name: "Minutes",
    exact: true,
  });
  const apply = popup.getByRole("button", { name: "Apply", exact: true });
  await expect(hours).toBeFocused();
  await hours.fill("08");
  await expect(apply).toBeDisabled();
  await hours.fill("11");
  await minutes.fill("16");
  await expect(apply).toBeDisabled();
  await minutes.fill("30");
  await expect(apply).toBeEnabled();
  await minutes.press("Enter");
  await expect(time).toHaveValue("11:30");
  await expect(time).toBeFocused();
  await time.evaluate((input) => {
    input.min = "22:00";
    input.max = "02:00";
    input.step = "0.5";
  });
  await time.click();
  await hours.fill("23");
  await minutes.fill("45");
  const seconds = popup.getByRole("spinbutton", {
    name: "Seconds",
    exact: true,
  });
  await seconds.fill("30.25");
  await expect(apply).toBeDisabled();
  await seconds.fill("30.5");
  await apply.click();
  await expect(time).toHaveValue(/^23:45:30\.50{0,2}$/);

  const datetime = form.getByLabel("Appointment date and time", {
    exact: true,
  });
  await datetime.click();
  await popup.locator('[data-date="2024-03-01"]').click();
  await hours.fill("12");
  await minutes.fill("30");
  await apply.click();
  await expect(datetime).toHaveValue("2024-03-01T12:30");
  const data = await form.evaluate((form) =>
    Object.fromEntries(new FormData(form)),
  );
  assert.equal(data.date, "2024-02-29");
  assert.equal(data.month, "2024-04");
  assert.match(data.time, /^23:45:30\.50{0,2}$/);
  assert.equal(data["date-time"], "2024-03-01T12:30");

  await date.click();
  const bounds = await popup.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= scenario.width + 1);
  await page.mouse.click(1, 1);
  await expect(popup).toHaveCount(0);
  await expect(date).toBeFocused();
  await date.evaluate((input) => (input.readOnly = true));
  await date.click();
  await expect(popup).toHaveCount(0);
  await date.evaluate((input) => (input.readOnly = false));
  await date.click();
  await date.evaluate((input) => (input.disabled = true));
  await expect(popup).toHaveCount(0);
  await date.evaluate((input) => (input.disabled = false));
  await date.click();
  await date.evaluate((input) => (input.min = "2024-03-01"));
  await expect(popup.locator('[data-date="2024-02-29"]')).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await popup.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(date).toHaveValue("");
  assert.equal(
    await date.evaluate((input) => input.validity.valueMissing),
    true,
  );
  await date.click();
  await page.evaluate(() => window.disposeMeridian[0]());
  await expect(popup).toHaveCount(0);
  await expect(date).not.toHaveAttribute("data-meridian-picker-ready");
  await expect(date).not.toHaveAttribute("aria-controls");
  await date.evaluate((input) => {
    input.min = "2024-02-27";
    input.value = "2024-02-28";
  });
}
