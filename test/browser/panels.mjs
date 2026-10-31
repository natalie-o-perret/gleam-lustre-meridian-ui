import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function panels(page, scenario) {
  const form = page.locator("#primary-form");
  const note = form.getByRole("textbox", { name: "Project note", exact: true });
  const toggle = form.getByRole("button", {
    name: "Project details",
    exact: true,
  });
  await note.fill("Retained é <项目>");
  await note.evaluate((el) => (window.noteNode = el));
  await toggle.focus();
  await toggle.press("Space");
  await expect(note).toBeHidden();
  assert.equal(
    await form.evaluate((el) => new FormData(el).get("note")),
    "Retained é <项目>",
  );
  await form
    .getByRole("button", { name: "Header action", exact: true })
    .click();
  await expect(page.locator("#primary-actions")).toHaveText("Actions: 1");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(note).toHaveValue("Retained é <项目>");
  assert.equal(await note.evaluate((el) => el === window.noteNode), true);
  await form
    .getByRole("button", { name: "Disable fieldsets", exact: true })
    .click();
  const advanced = form.getByRole("button", {
    name: "Advanced settings",
    exact: true,
  });
  await expect(advanced).toBeEnabled();
  await advanced.click();
  await expect(form.locator("#primary-advanced-note")).toBeDisabled();
  const events = form.getByRole("region", {
    name: "Recent events",
    exact: true,
  });
  await events.focus();
  await events.press("End");
  await expect
    .poll(() => events.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  const matrix = form.getByRole("region", {
    name: "Component matrix",
    exact: true,
  });
  await matrix.focus();
  await matrix.press(scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  await expect
    .poll(() => matrix.evaluate((el) => Math.abs(el.scrollLeft)))
    .toBeGreaterThan(0);
  await form
    .getByRole("button", { name: "Enable fieldsets", exact: true })
    .click();
  await form.getByRole("button", { name: "Submit form", exact: true }).click();
  await expect(page.locator("#primary-submissions")).toHaveText(
    "Submissions: 1",
  );
  await expect(page.locator("#secondary-actions")).toHaveText("Actions: 0");
}
