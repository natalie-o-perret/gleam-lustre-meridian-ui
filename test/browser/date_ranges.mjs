import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function dateRanges(page) {
  const form = page.locator("#primary-form");
  const start = form.getByLabel("Start date", { exact: true });
  const end = form.getByLabel("End date", { exact: true });
  const popup = page.locator("#forms-demo .meridian-picker-popup");
  await start.evaluate((input) => {
    window.rangeStart = input;
  });
  await start.click();
  await expect(popup.getByRole("grid")).toHaveAttribute(
    "aria-multiselectable",
    "true",
  );
  await expect(popup).toHaveCount(1);
  await popup.getByRole("button", { name: "Next month", exact: true }).click();
  await popup.locator('[data-date="2024-03-03"]').click();
  await expect(
    popup.getByRole("button", { name: "End date", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    popup.getByRole("button", { name: "Apply", exact: true }),
  ).toBeDisabled();
  await expect(start).toHaveValue("2024-02-28");
  await expect(end).toHaveValue("2024-03-02");
  await expect(popup.locator('[data-date="2024-03-02"]')).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await popup.locator('[data-date="2024-03-06"]').click();
  await expect(popup.locator('[data-range="inside"]')).toHaveCount(2);
  await popup.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(start).toHaveValue("2024-03-03");
  await expect(end).toHaveValue("2024-03-06");
  await expect(start).toHaveAttribute("max", "2024-03-06");
  await expect(end).toHaveAttribute("min", "2024-03-03");
  await expect(start).toBeFocused();
  assert.equal(
    await start.evaluate((input) => input === window.rangeStart),
    true,
  );
  await end.click();
  await popup.locator('[data-date="2024-03-08"]').click();
  await page.keyboard.press("Escape");
  await expect(end).toHaveValue("2024-03-06");
  await expect(end).toBeFocused();

  const dateStart = form.getByLabel("Start date and time", { exact: true });
  const dateEnd = form.getByLabel("End date and time", { exact: true });
  await dateStart.click();
  await popup.locator('[data-date="2024-02-29"]').click();
  await popup.locator('[data-date="2024-02-29"]').click();
  const hours = popup.getByRole("listbox", { name: "Hours", exact: true });
  const minutes = popup.getByRole("listbox", { name: "Minutes", exact: true });
  const seconds = popup.getByRole("listbox", { name: "Seconds", exact: true });
  await hours.selectOption("09");
  await expect(
    popup.getByRole("button", { name: "Apply", exact: true }),
  ).toBeDisabled();
  await hours.selectOption("11");
  await minutes.selectOption("20");
  await seconds.selectOption("45");
  await popup
    .getByRole("button", { name: "Start date and time", exact: true })
    .click();
  await seconds.selectOption("15");
  await popup.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dateStart).toHaveValue("2024-02-29T10:15:15");
  await expect(dateEnd).toHaveValue("2024-02-29T11:20:45");
  const values = await form.evaluate((form) =>
    Object.fromEntries(new FormData(form)),
  );
  assert.equal(values["stay-start"], "2024-03-03");
  assert.equal(values["stay-end"], "2024-03-06");
  assert.equal(values["event-start"], "2024-02-29T10:15:15");
  assert.equal(values["event-end"], "2024-02-29T11:20:45");
  await start.click();
  await end.evaluate((input) => (input.disabled = true));
  await expect(popup).toHaveCount(0);
  await end.evaluate((input) => (input.disabled = false));
  await start.click();
  await popup.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(start).toHaveValue("");
  await expect(end).toHaveValue("");
  assert.equal(
    await start.evaluate((input) => input.validity.valueMissing),
    true,
  );
  assert.equal(
    await end.evaluate((input) => input.validity.valueMissing),
    true,
  );
}
