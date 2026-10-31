import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function selection(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const form = page.locator("#primary-form");
  await form.locator(".meridian-select-button").evaluate((group) => {
    group.querySelector('input[value="list"]').click();
    group.querySelector('input[value="grid"]').click();
  });
  await expect(
    form.getByRole("checkbox", { name: "List", exact: true }),
  ).not.toBeChecked();
  await expect(
    form.getByRole("checkbox", { name: "Grid", exact: true }),
  ).toBeChecked();
  await form.getByText("List", { exact: true }).click();
  await form
    .getByRole("listbox", { name: "Owners", exact: true })
    .selectOption(["one", "two"]);
  assert.deepEqual(
    await form.evaluate((el) => new FormData(el).getAll("owners")),
    ["one", "two"],
  );
  await expect(
    form.getByRole("checkbox", { name: "List", exact: true }),
  ).toBeChecked();
  const star = form.getByRole("radio", { name: "3 stars", exact: true });
  await star.focus();
  await star.press(scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  await expect(
    form.getByRole("radio", { name: "4 stars", exact: true }),
  ).toBeChecked();
  await page.keyboard.press(
    scenario.direction === "rtl" ? "ArrowRight" : "ArrowLeft",
  );
  await expect(star).toBeChecked();
  await star.press("End");
  await expect(
    form.getByRole("radio", { name: "5 stars", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Home");
  await expect(
    form.getByRole("radio", { name: "1 star", exact: true }),
  ).toBeChecked();
  const otp = form.getByLabel("Verification code", { exact: true });
  await otp.fill("001234");
  assert.equal(await otp.evaluate((el) => el.checkValidity()), true);
  await otp.fill("abcdef");
  assert.equal(await otp.evaluate((el) => el.checkValidity()), false);
  await otp.fill("001234");
  const tags = form.getByRole("textbox", { name: "Labels", exact: true });
  await tags.fill("é <项目>");
  await tags.press("Enter");
  await expect(
    form.getByRole("button", { name: "Remove é <项目>", exact: true }),
  ).toBeVisible();
  await tags.fill("é <项目>");
  await tags.press("Enter");
  assert.equal(
    await form
      .getByRole("button", { name: "Remove é <项目>", exact: true })
      .count(),
    1,
  );
  await tags.fill("Two");
  await tags.press("Enter");
  await tags.press("Backspace");
  await expect(
    form.getByRole("button", { name: "Remove Two", exact: true }),
  ).toHaveCount(0);
  await form
    .getByRole("button", { name: "Remove Initial", exact: true })
    .click();
  await expect(tags).toBeFocused();
  await expect(
    form.getByRole("button", { name: "Remove Initial", exact: true }),
  ).toHaveCount(0);
  await tags.fill("Uncommitted");
  assert.deepEqual(
    await form.evaluate((el) => new FormData(el).getAll("labels")),
    ["é <项目>", "Uncommitted"],
  );
  await form
    .getByRole("searchbox", { name: "Search Primary owner", exact: true })
    .fill("Blair");
  const owner = form.getByRole("combobox", {
    name: "Primary owner",
    exact: true,
  });
  await expect(owner).toHaveValue("one");
  assert.equal(
    await form.evaluate((el) => new FormData(el).get("primary-owner")),
    "one",
  );
  await owner.selectOption("two");
  await form
    .getByRole("searchbox", { name: "Search Primary owner", exact: true })
    .fill("missing");
  await expect(owner).toHaveValue("two");
  await form
    .getByLabel("Project: level 1", { exact: true })
    .selectOption("team");
  await form
    .getByLabel("Project: level 2", { exact: true })
    .selectOption("project");
  await expect
    .poll(() => form.evaluate((el) => new FormData(el).get("project")))
    .toBe("project");
  await form
    .getByLabel("Project: level 1", { exact: true })
    .selectOption("standalone");
  await expect(
    form.getByLabel("Project: level 2", { exact: true }),
  ).toHaveCount(0);
  const start = form.getByLabel("Start date", { exact: true });
  const end = form.getByLabel("End date", { exact: true });
  await start.fill("2026-11-01");
  assert.equal(await start.evaluate((el) => el.checkValidity()), false);
  await start.fill("2026-10-01");
  await end.fill("2026-10-20");
  const knob = form.getByRole("slider", { name: "Volume", exact: true });
  await knob.focus();
  await knob.press("Home");
  await expect(knob).toHaveValue("0");
  await knob.press("End");
  await expect(knob).toHaveValue("100");
  await knob.press("ArrowDown");
  await expect(knob).toHaveValue("95");
  await knob.scrollIntoViewIfNeeded();
  const box = await knob.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 2);
  await expect(knob).toHaveValue("50");
  const mask = form.getByLabel("Telephone mask", { exact: true });
  await mask.pressSequentially("ab1234567");
  await expect(mask).toHaveValue("123 456");
  const letters = form.getByLabel("Letters only", { exact: true });
  await letters.fill("Éire 中文");
  assert.equal(await letters.evaluate((el) => el.checkValidity()), true);
  await letters.fill("123");
  assert.equal(await letters.evaluate((el) => el.checkValidity()), false);
  await letters.fill("Éire");
  const lower = form.getByRole("slider", { name: "Minimum: 20", exact: true });
  await lower.focus();
  await lower.press("End");
  await expect(
    form.getByRole("slider", { name: "Minimum: 80", exact: true }),
  ).toHaveValue("80");
  assert.deepEqual(
    await form.evaluate((el) =>
      [...el.elements]
        .filter((control) => !control.checkValidity())
        .map((control) => ({
          name: control.name,
          value: control.value,
          message: control.validationMessage,
        })),
    ),
    [],
  );
  await form
    .getByRole("button", { name: "Submit selections", exact: true })
    .click();
  await expect(page.locator("#primary-submitted")).toHaveText("Submissions: 1");
  await expect(
    page
      .locator("#secondary-form")
      .getByRole("slider", { name: "Volume", exact: true }),
  ).toHaveValue("35");
  await form
    .getByRole("switch", { name: "Disable fields", exact: true })
    .check();
  await expect(knob).toBeDisabled();
  await expect(tags).toBeDisabled();
  assert.equal(
    await form.evaluate((el) => new FormData(el).has("volume")),
    false,
  );
  await form
    .getByRole("switch", { name: "Disable fields", exact: true })
    .uncheck();
}
