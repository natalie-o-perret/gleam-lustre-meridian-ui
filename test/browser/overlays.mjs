import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function overlays(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const root = page.locator("#primary-controls");
  const opener = root.getByRole("button", { name: "Open modal", exact: true });
  const modal = root.getByRole("dialog", { name: "Edit project", exact: true });
  await opener.click();
  await expect(modal).toBeVisible();
  assert.equal(await modal.evaluate((el) => el.matches(":modal")), true);
  const input = modal.getByRole("textbox", {
    name: "Project name",
    exact: true,
  });
  await expect(input).toBeFocused();
  await input.fill("Retained é <项目>");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await modal.evaluate((el) => el.contains(document.activeElement)),
    true,
  );
  await modal
    .getByRole("button", { name: "Open nested dialog", exact: true })
    .click();
  const nested = modal.getByRole("dialog", {
    name: "Nested project dialog",
    exact: true,
  });
  await expect(nested).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nested).toBeHidden();
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Open nested dialog", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(input).toHaveValue("Retained é <项目>");
  await modal
    .getByRole("button", { name: "Close Edit project", exact: true })
    .click();
  await expect(modal).toBeHidden();

  await root
    .getByRole("button", { name: "Open non-modal", exact: true })
    .click();
  const nonmodal = root.getByRole("dialog", {
    name: "Project notes",
    exact: true,
  });
  await expect(nonmodal).toBeVisible();
  assert.equal(await nonmodal.evaluate((el) => el.matches(":modal")), false);
  const outside = root.getByRole("textbox", {
    name: "Outside note",
    exact: true,
  });
  await outside.fill("Outside remains editable");
  await expect(outside).toBeFocused();
  await nonmodal.evaluate((el) => el.close());
  await expect(nonmodal).toBeHidden();
  await expect(outside).toBeFocused();

  await root
    .getByRole("button", { name: "Ask for confirmation", exact: true })
    .click();
  const confirm = root.getByRole("alertdialog", {
    name: "Delete project?",
    exact: true,
  });
  await expect(confirm).toBeVisible();
  await expect(
    confirm.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(root.locator("#primary-approvals")).toHaveText("Approvals: 0");
  await root
    .getByRole("button", { name: "Ask for confirmation", exact: true })
    .click();
  await confirm.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(root.locator("#primary-approvals")).toHaveText("Approvals: 1");

  for (const side of ["start", "end", "top", "bottom"]) {
    await root.getByLabel("Drawer side", { exact: true }).selectOption(side);
    await root
      .getByRole("button", { name: "Open drawer", exact: true })
      .click();
    const drawer = root.getByRole("dialog", {
      name: "Project navigation",
      exact: true,
    });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-side", side);
    const box = await drawer.boundingBox();
    const viewport = await page.evaluate(() => {
      const bounds = document.documentElement.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, height: innerHeight };
    });
    if (side === "start")
      assert.ok(
        scenario.direction === "rtl"
          ? Math.abs(box.x + box.width - viewport.right) < 2
          : Math.abs(box.x - viewport.left) < 2,
      );
    if (side === "end")
      assert.ok(
        scenario.direction === "rtl"
          ? Math.abs(box.x - viewport.left) < 2
          : Math.abs(box.x + box.width - viewport.right) < 2,
      );
    if (side === "top") assert.ok(box.y < 2);
    if (side === "bottom")
      assert.ok(Math.abs(box.y + box.height - viewport.height) < 2);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  }

  const popupOpener = root.getByRole("button", {
    name: "Open details popup",
    exact: true,
  });
  await popupOpener.click();
  const popup = root.getByRole("dialog", {
    name: "Project details popup",
    exact: true,
  });
  await expect(popup).toBeVisible();
  const box = await popup.boundingBox();
  assert.ok(
    box.x >= 0 &&
      box.x + box.width <= scenario.width + 1 &&
      box.y >= 0 &&
      box.y + box.height <= 1001,
  );
  const outsideAction = root.getByRole("button", {
    name: "Outside action",
    exact: true,
  });
  await outsideAction.click();
  await expect(popup).toBeHidden();
  await expect(outsideAction).toBeFocused();
  await popupOpener.click();
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(popupOpener).toBeFocused();
  await root.getByRole("button", { name: "Ask in popup", exact: true }).click();
  const confirmPopup = root.getByRole("alertdialog", {
    name: "Archive project?",
    exact: true,
  });
  await expect(confirmPopup).toBeVisible();
  await expect(
    confirmPopup.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await confirmPopup
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(confirmPopup).toBeHidden();
  await expect(root.locator("#primary-approvals")).toHaveText("Approvals: 2");
  await expect(page.locator("#secondary-approvals")).toHaveText("Approvals: 0");
}
