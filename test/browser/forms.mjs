import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { datePickers } from "./date_pickers.mjs";
import { colourPickers } from "./colour_pickers.mjs";
import { groupShapes } from "./group-shapes.mjs";

export async function forms(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  await groupShapes(page);
  const form = page.locator("#primary-form");
  const secondary = page.locator("#secondary-form");
  const initial = await secondary.evaluate((el) =>
    Object.fromEntries(new FormData(el)),
  );
  const radio = form.getByRole("radio", { name: "Basic", exact: true });
  await radio.focus();
  await radio.press("ArrowRight");
  await expect(
    form.getByRole("radio", { name: "Team", exact: true }),
  ).toBeChecked();
  const alerts = form.getByRole("switch", {
    name: "Email alerts",
    exact: true,
  });
  await alerts.focus();
  await alerts.press("Space");
  await expect(alerts).toBeChecked();
  const title = form.getByRole("textbox", {
    name: "Project title",
    exact: true,
  });
  await title.fill("Méridian <项目>");
  const email = form.getByRole("textbox", {
    name: "Contact email",
    exact: true,
  });
  await email.fill("not an email");
  assert.equal(await email.evaluate((el) => el.validity.typeMismatch), true);
  await email.fill("check@example.test");
  const amount = form.getByRole("spinbutton", {
    name: "Amount (EUR)",
    exact: true,
  });
  for (const [value, validity] of [
    ["12.25", "stepMismatch"],
    ["100.5", "rangeOverflow"],
    ["-0.5", "rangeUnderflow"],
    ["", "valueMissing"],
  ]) {
    await amount.fill(value);
    assert.equal(
      await amount.evaluate((el, key) => el.validity[key], validity),
      true,
    );
  }
  await amount.fill("12.50");
  assert.equal(
    await form.evaluate((el) => new FormData(el).get("amount")),
    "12.50",
  );
  const password = form.locator("#primary-password");
  await password.fill("é <项目>");
  await password.evaluate((el) => (window.passwordNode = el));
  await form
    .getByRole("button", { name: "Show Account password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("é <项目>");
  assert.equal(
    await password.evaluate((el) => el === window.passwordNode),
    true,
  );
  await form
    .getByRole("button", { name: "Hide Account password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "password");
  await form
    .getByRole("button", { name: "Lock password field", exact: true })
    .click();
  await expect(password).toBeDisabled();
  assert.equal(
    await form.evaluate((el) => new FormData(el).has("password")),
    false,
  );
  await form
    .getByRole("button", { name: "Unlock password field", exact: true })
    .click();
  await form.getByRole("button", { name: "Submit form", exact: true }).click();
  await expect(page.locator("#primary-submissions")).toHaveText(
    "Submissions: 1",
  );
  assert.deepEqual(
    await secondary.evaluate((el) => Object.fromEntries(new FormData(el))),
    initial,
  );
  await form.getByRole("button", { name: "Reset fields", exact: true }).click();
  await expect(title).toHaveValue("Orbit");
  await colourPickers(page);
  await datePickers(page, scenario);
}
