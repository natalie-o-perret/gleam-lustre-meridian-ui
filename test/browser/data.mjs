import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function data(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const bar = page.getByRole("menubar", { name: "Application", exact: true });
  const first = bar.getByRole("menuitem", { name: "New project", exact: true });
  await first.focus();
  await first.press(scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  const exportButton = bar.getByRole("menuitem", {
    name: "Export",
    exact: true,
  });
  await expect(exportButton).toBeFocused();
  await exportButton.press("ArrowDown");
  const csv = bar.getByRole("menuitem", { name: "Export CSV", exact: true });
  await expect(csv).toBeFocused();
  await csv.press("Escape");
  await expect(exportButton).toBeFocused();
  await expect(csv).toBeHidden();
  const tiered = page.getByRole("menu", {
    name: "Project commands",
    exact: true,
  });
  const tieredExport = tiered.getByRole("menuitem", {
    name: "Export",
    exact: true,
  });
  await tieredExport.focus();
  await tieredExport.press(
    scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight",
  );
  const tieredCSV = tiered.getByRole("menuitem", {
    name: "Export CSV",
    exact: true,
  });
  await expect(tieredCSV).toBeFocused();
  const bounds = await tieredCSV.locator("..").locator("..").boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= scenario.width);
  await tieredCSV.press("Escape");
  await expect(tieredExport).toBeFocused();
  await page
    .getByRole("button", { name: "Quick actions", exact: true })
    .click();
  const quick = page.locator("#quick-actions-menu");
  await quick.getByRole("menuitem", { name: "Export", exact: true }).click();
  await expect(
    quick.getByRole("menuitem", { name: "Export CSV", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Navigation and data", exact: true })
    .click();
  await expect(page.locator("#quick-actions")).toBeHidden();
  await page
    .getByRole("button", { name: "More Save options", exact: true })
    .click();
  const popup = page.locator("#split-actions-menu");
  await expect(popup).toBeVisible();
  await popup
    .getByRole("menuitem", { name: "New project", exact: true })
    .click();
  await expect(page.locator("#action-count")).toHaveText("Actions: 1");
  await page
    .getByRole("button", { name: "Context target", exact: true })
    .focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.locator("#context")).toBeVisible();
  await page
    .locator("#context")
    .getByRole("menuitem", { name: "New project", exact: true })
    .click();
  await expect(page.locator("#action-count")).toHaveText("Actions: 2");
  await page
    .getByRole("button", { name: "Open command palette", exact: true })
    .click();
  const palette = page.getByRole("dialog", {
    name: "Command palette",
    exact: true,
  });
  await expect(palette).toBeVisible();
  const search = palette.getByRole("searchbox", {
    name: "Search commands",
    exact: true,
  });
  await search.fill("csv");
  await expect(
    palette.getByRole("button", { name: "Create project", exact: true }),
  ).toHaveCount(0);
  await search.press("ArrowDown");
  await expect(
    palette.getByRole("button", { name: "Export projects", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
  await expect(page.locator("#action-count")).toHaveText("Actions: 3");
  const tree = page.getByRole("tree", { name: "Project tree", exact: true });
  const team = tree.getByRole("treeitem", { name: "Team", exact: true });
  await team.focus();
  await team.press(scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  await expect(team).toHaveAttribute("aria-expanded", "true");
  await team.press("ArrowDown");
  const one = tree.getByRole("treeitem", { name: "One", exact: true });
  await expect(one).toBeFocused();
  await one.press("Space");
  await expect(one).toHaveAttribute("aria-selected", "true");
  await one.press("ArrowDown");
  await expect(
    tree.getByRole("treeitem", { name: "Two", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("Selected: One", { exact: true })).toBeVisible();
  const editing = page.getByRole("region", {
    name: "Editable owners",
    exact: true,
  });
  const retained = editing.getByRole("textbox", {
    name: "Edit Blair",
    exact: true,
  });
  await retained.fill("Draft Blair");
  await retained.evaluate((el) => (window.retainedEditor = el));
  await editing.getByRole("button", { name: "Name", exact: true }).click();
  await expect(retained).toHaveValue("Draft Blair");
  assert.equal(
    await retained.evaluate((el) => el === window.retainedEditor),
    true,
  );
  const owners = page.getByRole("region", { name: "Owners", exact: true });
  await owners.getByRole("button", { name: "Name", exact: true }).click();
  await expect(owners.locator("tbody tr").first()).toContainText("Éire");
  await owners
    .getByRole("searchbox", { name: "Search Owners", exact: true })
    .fill("eire");
  await expect(owners.locator("tbody tr")).toHaveCount(1);
  await expect(owners.locator("tbody")).toContainText("Éire");
  await owners
    .getByRole("checkbox", { name: "Select Éire", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(
    owners.getByRole("checkbox", { name: "Select Éire", exact: true }),
  ).toBeChecked();
  const selectedRow = owners.locator('tbody tr[data-selected="true"]');
  await page.mouse.move(0, 0);
  const selectedBackground = await selectedRow.evaluate(
    (row) => getComputedStyle(row).backgroundColor,
  );
  await selectedRow.hover();
  await expect(selectedRow).toHaveCSS("background-color", selectedBackground);
  const priority = page.getByRole("list", { name: "Priority", exact: true });
  await priority
    .getByRole("button", { name: "Move one down", exact: true })
    .click();
  await expect(priority.locator("[data-order-id]").first()).toHaveAttribute(
    "data-order-id",
    "two",
  );
  const available = page.getByRole("region", {
    name: "Available",
    exact: true,
  });
  const chosen = page.getByRole("region", { name: "Chosen", exact: true });
  await available.getByRole("button", { name: "Add one", exact: true }).click();
  await expect(chosen.getByText("one", { exact: true })).toBeVisible();
  await available.locator('[data-order-id="two"]').dragTo(chosen, {
    sourcePosition: { x: 5, y: 5 },
    targetPosition: { x: 10, y: 15 },
  });
  await expect(chosen.getByText("two", { exact: true })).toBeVisible();
  const virtual = page.getByRole("region", { name: "Large list", exact: true });
  assert.ok((await virtual.locator("li").count()) < 30);
  await virtual.evaluate((el) => (el.scrollTop = 20000));
  await expect(virtual).toContainText("Row 500");
  assert.ok((await virtual.locator("li").count()) < 30);
  await virtual.evaluate((el) => (el.scrollTop = 0));
  await expect(virtual).toContainText("Row 0");
}
