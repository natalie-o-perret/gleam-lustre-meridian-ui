import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { treeAppearance } from "./tree-appearance.mjs";
import { editorChecks } from "./editor.mjs";

export async function refinements(page, open) {
  await editorChecks(page, open);
  const iconFrame = await open("iconfield");
  const iconChoice = page
    .getByRole("form", { name: "IconField preview properties", exact: true })
    .locator('select[name="icon"]');
  for (const name of ["search", "mail", "user"]) {
    await expect(iconChoice.locator(`option[value="${name}"] svg`)).toHaveCount(
      1,
    );
    await iconChoice.selectOption(name);
    const path = await iconChoice
      .locator(`option[value="${name}"] svg path`)
      .getAttribute("d");
    await expect(
      iconFrame.locator(".meridian-field-icon svg path"),
    ).toHaveAttribute("d", path);
    if (await page.evaluate(() => CSS.supports("appearance", "base-select")))
      await expect(iconChoice.locator("selectedcontent svg")).toBeVisible();
  }
  let frame = await open("autocomplete");
  const input = frame.getByRole("combobox", {
    name: "Choose a language",
    exact: true,
  });
  await input.click();
  const suggestions = frame.getByRole("listbox", {
    name: "Suggestions",
    exact: true,
  });
  await expect(suggestions.getByRole("option")).toHaveCount(20);
  await input.press("ArrowDown");
  await input.press("End");
  await expect(input).toBeFocused();
  await expect(suggestions.getByRole("option").last()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  assert.ok(
    await suggestions.evaluate(
      (node) => node.scrollTop > 0 && node.clientHeight <= 320,
    ),
    "20 suggestions must scroll within a bounded popup",
  );
  await input.press("Enter");
  await expect(input).toHaveValue("Zig");
  await expect(suggestions).toHaveCount(0);
  await input.fill("typed");
  await expect(suggestions.locator(".meridian-autocomplete-value")).toHaveText([
    "Gleam",
    "TypeScript",
  ]);
  await input.press("Escape");
  await expect(input).toHaveValue("typed");
  await input.fill("<script>");
  await expect(suggestions).toHaveText("No matching suggestions");
  await expect(suggestions.locator("script")).toHaveCount(0);
  await input.evaluate((node) => {
    node.value = "New";
    node.dispatchEvent(new Event("input", { bubbles: true }));
    const option = document.createElement("option");
    option.value = "New language";
    option.textContent = "Asynchronous result";
    document.getElementById(node.dataset.meridianAutocomplete).append(option);
  });
  await expect(suggestions.getByRole("option")).toContainText(
    "Asynchronous result",
  );
  await suggestions.getByRole("option").click();
  await expect(input).toHaveValue("New language");
  await input.fill("");
  await expect(suggestions).toBeVisible();
  await page.locator(".docs-component-heading h1").click();
  await expect(suggestions).toHaveCount(0);
  await input.click();
  await expect(suggestions).toBeVisible();
  await page.locator(".docs-source").scrollIntoViewIfNeeded();
  await expect(suggestions).toHaveCount(0);
  await input.evaluate((node) => {
    window.nativeAutocomplete = node;
    node.closest(".meridian-ui").remove();
  });
  await expect
    .poll(() =>
      frame.evaluate(() => window.nativeAutocomplete.getAttribute("list")),
    )
    .toBe("languages-suggestions");

  await treeAppearance(page, open);
  frame = await open("paginator");
  const pageNumber = frame.getByRole("combobox", {
    name: "Go to page",
    exact: true,
  });
  await pageNumber.click();
  await expect(
    frame.getByRole("listbox", { name: "Suggestions", exact: true }),
  ).toHaveCount(0);
  await pageNumber.fill("");
  await expect(
    frame.getByRole("listbox", { name: "Suggestions", exact: true }),
  ).toBeVisible();
  await page.locator(".docs-component-heading h1").click();
  await expect(
    frame.getByRole("listbox", { name: "Suggestions", exact: true }),
  ).toHaveCount(0);
  await pageNumber.click();
  await pageNumber.fill("");
  await pageNumber.pressSequentially("2");
  await expect(pageNumber).toHaveValue("2");
  await pageNumber.press("Enter");
  await expect(frame.getByRole("status")).toHaveText("Page 2 of 3");
  frame = await open("formvalidation");
  const submit = frame.getByRole("button", {
    name: "Validate form",
    exact: true,
  });
  await submit.click();
  await expect(frame.locator('[aria-invalid="true"]')).toHaveCount(3);
  for (const name of ["Email", "Password", "Confirm password"]) {
    const field = frame.getByLabel(name, { exact: true });
    const description = await field.getAttribute("aria-describedby");
    await expect(frame.locator(`#${description}`)).toBeVisible();
  }
  await frame.getByLabel("Email", { exact: true }).fill("person@example.com");
  await frame.getByLabel("Password", { exact: true }).fill("dummy-password");
  await frame
    .getByLabel("Confirm password", { exact: true })
    .fill("different-password");
  await submit.click();
  await expect(frame.getByRole("alert")).toHaveText(
    "The passwords must match.",
  );
  await frame
    .getByLabel("Confirm password", { exact: true })
    .fill("dummy-password");
  await submit.click();
  await expect(frame.getByRole("alert")).toHaveCount(0);
  await expect(frame.getByRole("status")).toHaveText(
    "This example is valid. Nothing was sent.",
  );

  for (const [id, label] of [
    ["confirmdialog", "Archive project"],
    ["dialog", "Edit project"],
    ["dynamicdialog", "Open dynamic content"],
  ]) {
    frame = await open(id);
    const opener = frame.getByRole("button", { name: label, exact: true });
    await opener.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await opener.click();
    const modal = frame.locator("dialog[open]");
    await expect(modal).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
    await modal.press("Escape");
    await expect(modal).toHaveCount(0);
    await expect(opener).toBeFocused();
    assert.equal(
      await page.evaluate(() => scrollY),
      before,
      `${id}: no page jump on close`,
    );
  }

  frame = await open("scheduler");
  for (const label of ["Choose calendar date", "Review start", "Review end"]) {
    const control = frame.getByLabel(label, { exact: true });
    await control.click();
    const popup = frame.locator(".meridian-picker-popup");
    await expect(popup).toBeVisible();
    await expect(control).toHaveAttribute("data-meridian-picker");
    await popup.press("Escape");
  }

  frame = await open("drawer");
  const drawerProperties = page.getByRole("form", {
    name: "Drawer preview properties",
    exact: true,
  });
  for (const side of ["left", "right"]) {
    await drawerProperties
      .getByRole("combobox", { name: "Side", exact: true })
      .selectOption(side);
    await frame
      .getByRole("button", { name: "Open drawer", exact: true })
      .click();
    const drawer = frame.locator(".meridian-drawer[open]");
    await expect(drawer).toHaveAttribute("data-side", side);
    await expect
      .poll(() =>
        drawer.evaluate(
          (node, side) =>
            Math.abs(
              node.getBoundingClientRect()[side] -
                (side === "left" ? 0 : innerWidth),
            ),
          side,
        ),
      )
      .toBeLessThan(10);
    await drawer.press("Escape");
  }

  frame = await open("compare");
  const compareProperties = page.getByRole("form", {
    name: "Compare preview properties",
    exact: true,
  });
  const control = frame.getByRole("slider", {
    name: "Compare colour palettes",
    exact: true,
  });
  for (const vertical of [false, true]) {
    await compareProperties
      .getByLabel("Vertical layout", { exact: true })
      .setChecked(vertical);
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    const point = (fraction) => ({
      x: box.x + box.width * (vertical ? 0.5 : fraction),
      y: box.y + box.height * (vertical ? fraction : 0.5),
    });
    let start = point(0.5),
      end = point(0.75);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 10 });
    await page.mouse.up();
    await expect
      .poll(async () => Math.abs(Number(await control.inputValue()) - 75))
      .toBeLessThan(3);
    await control.focus();
    const before = Number(await control.inputValue());
    await control.press("ArrowRight");
    assert.notEqual(
      Number(await control.inputValue()),
      before,
      "The drag handle remains keyboard operable",
    );
  }
  await compareProperties
    .getByLabel("On-image drag handle", { exact: true })
    .uncheck();
  await expect(frame.locator(".meridian-compare-divider")).toHaveCount(0);
  await expect(control).toBeVisible();

  frame = await open("codeblock");
  const navigation = async (action) => {
    const mobile = page.viewportSize().width <= 900;
    if (mobile) await page.locator("#open-navigation").click();
    await action();
    if (mobile) await page.locator("#close-navigation").click();
  };
  await navigation(async () => {
    await page.locator("#style").selectOption("square");
  });
  await expect(page.locator(".docs-source .meridian-tab").first()).toHaveCSS(
    "border-top-left-radius",
    "2px",
  );
  await navigation(async () => {
    await page.locator("#primary-colour").click();
    const popup = page.locator(".meridian-colour-popup");
    await popup
      .getByRole("textbox", { name: "Hex colour", exact: true })
      .fill("#228b22");
    await popup.getByRole("button", { name: "Apply", exact: true }).click();
    await page.locator("#secondary-colour").click();
    await popup
      .getByRole("textbox", { name: "Hex colour", exact: true })
      .fill("#663399");
    await popup.getByRole("button", { name: "Apply", exact: true }).click();
  });
  await expect(page.locator("#primary-colour-value")).toHaveText("#228b22");
  await expect(page.locator("#secondary-colour-value")).toHaveText("#663399");
  for (const token of [
    "--accent",
    "--accent-soft",
    "--on-accent",
    "--secondary",
    "--secondary-soft",
  ])
    await expect
      .poll(() =>
        frame
          .locator("#demo-root")
          .evaluate((node, token) => node.style.getPropertyValue(token), token),
      )
      .toBe(
        await page
          .locator("body")
          .evaluate((node, token) => node.style.getPropertyValue(token), token),
      );
  await page.reload();
  await expect(page.locator('iframe[data-ready="codeblock"]')).toBeVisible();
  assert.deepEqual(
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("meridian-catalogue"));
      return [saved.primary, saved.secondary];
    }),
    ["#228b22", "#663399"],
  );
  await navigation(async () => {
    await page.locator("#reset-colours").click();
    await page.locator("#style").selectOption("rounded");
  });
  frame = await open("button");
  const buttonProperties = page.getByRole("form", {
    name: "Button preview properties",
    exact: true,
  });
  await buttonProperties
    .getByRole("combobox", { name: "Button icon", exact: true })
    .selectOption("download");
  for (const position of ["leading", "trailing"]) {
    await buttonProperties
      .getByRole("combobox", { name: "Icon position", exact: true })
      .selectOption(position);
    const button = frame.getByRole("button", {
      name: "Create project",
      exact: true,
    });
    await expect(button.locator("svg")).toHaveCount(1);
    await expect
      .poll(() => button.evaluate((node) => node.firstChild.nodeName))
      .toBe(position === "leading" ? "svg" : "#text");
  }
  await expect(page.locator("#component-status")).toHaveCount(0);
  for (const selector of [".docs-properties", ".docs-api", ".docs-source"]) {
    const difference = await page
      .locator(`${selector} > .meridian-panel-header`)
      .evaluate((node) => {
        const heading = node.querySelector("h2").getBoundingClientRect();
        const rect = node.getBoundingClientRect();
        return Math.abs(
          heading.left - rect.left - (rect.right - heading.right),
        );
      });
    assert.ok(difference <= 1, `${selector}: equal header insets`);
  }
}
