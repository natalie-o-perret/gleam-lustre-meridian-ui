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
  const branch = team.locator(':scope > [role="group"]');
  await branch.evaluate((branch) => {
    window.treeAnimations = [];
    window.treeObserver = new MutationObserver(() =>
      window.treeAnimations.push(branch.getAnimations().length),
    );
    window.treeObserver.observe(branch, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
  });
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
  const rows = await branch
    .locator(":scope > li > .meridian-tree-row")
    .evaluateAll((rows) =>
      rows.map((row) => ({
        top: row.getBoundingClientRect().top,
        bottom: row.getBoundingClientRect().bottom,
      })),
    );
  assert.ok(rows[1].top - rows[0].bottom >= 4, "Tree siblings need a gap");
  await team.focus();
  await team.press(scenario.direction === "rtl" ? "ArrowRight" : "ArrowLeft");
  await expect(team).toHaveAttribute("aria-expanded", "false");
  await expect(branch).toBeHidden();
  const animations = await page.evaluate(() => {
    window.treeObserver.disconnect();
    return window.treeAnimations;
  });
  assert.ok(animations.length >= 2);
  assert.ok(
    animations.every((count) =>
      scenario.motion === "reduce" ? count === 0 : count > 0,
    ),
    "Tree expansion and collapse must animate unless motion is reduced",
  );
  const editing = page.getByRole("region", {
    name: "Editable owners",
    exact: true,
  });
  const files = page.getByRole("tree", { name: "Project files", exact: true });
  const folder = files.getByRole("treeitem", { name: "src", exact: true });
  await folder.focus();
  await folder.press(scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight");
  await expect(folder).toHaveAttribute("aria-expanded", "true");
  await expect(folder).toHaveAccessibleName("src");
  await folder.press("ArrowDown");
  const app = files.getByRole("treeitem", { name: "app.gleam", exact: true });
  await expect(app).toBeFocused();
  await app.press("Space");
  await expect(app).toHaveAttribute("aria-selected", "true");
  await app.press("ArrowDown");
  const empty = files.getByRole("treeitem", {
    name: "Empty folder",
    exact: true,
  });
  await expect(empty).toBeFocused();
  await empty.press("Space");
  await expect(empty).toHaveAttribute("aria-selected", "true");
  await expect(app).toHaveAttribute("aria-selected", "false");
  await expect(files.locator('[aria-selected="true"]')).toHaveCount(1);
  await expect(
    files.getByRole("treeitem", { name: "Locked file", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
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
  const pageNumber = owners.getByRole("combobox", {
    name: "Go to page",
    exact: true,
  });
  assert.equal(
    await pageNumber.evaluate((input) =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
    true,
    "Composing Enter keeps its native behaviour",
  );
  await pageNumber.fill("");
  await expect(pageNumber).toHaveValue("");
  await pageNumber.press("Enter");
  await expect(owners.getByRole("status")).toHaveText("Page 1 of 3");
  await expect(pageNumber).toHaveValue("");
  await pageNumber.pressSequentially("2");
  await expect(pageNumber).toHaveValue("2");
  await pageNumber.press("Enter");
  await expect(owners.getByRole("status")).toHaveText("Page 2 of 3");
  await expect(pageNumber).toHaveValue("2");
  await pageNumber.press("Tab");
  await expect(
    owners.getByRole("button", { name: "Next page", exact: true }),
  ).toBeFocused();
  await owners.getByRole("button", { name: "First page", exact: true }).click();
  await expect(owners.getByRole("status")).toHaveText("Page 1 of 3");
  await expect(pageNumber).toHaveValue("1");
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
  await priority.evaluate((group) => {
    window.orderPreviews = [];
    group.closest(".meridian-ui").addEventListener("dragover", (event) => {
      if (event.target.closest("[data-meridian-order]") !== group) return;
      const items = [...group.querySelectorAll(":scope > [data-order-id]")];
      window.orderPreviews.push({
        dom: items.map((item) => item.dataset.orderId),
        visual: items
          .slice()
          .sort(
            (a, b) =>
              a.getBoundingClientRect().top - b.getBoundingClientRect().top,
          )
          .map((item) => item.dataset.orderId),
      });
    });
  });
  const destination = priority.locator('[data-order-id="one"]');
  await priority.scrollIntoViewIfNeeded();
  const source = await priority.locator('[data-order-id="two"]').boundingBox();
  const target = await destination.boundingBox();
  await page.mouse.move(source.x + 5, source.y + 5);
  await page.mouse.down();
  await page.mouse.move(source.x + 5, source.y + 15, { steps: 3 });
  await page.mouse.move(target.x + 5, target.y + target.height - 2, {
    steps: 5,
  });
  await page.mouse.up();
  assert.ok(
    await page.evaluate(() =>
      window.orderPreviews.some(
        ({ dom, visual }) => dom[0] === "two" && visual[0] === "one",
      ),
    ),
    "The new order must be visible before drop commits it",
  );
  await expect(priority.locator("[data-order-id]").first()).toHaveAttribute(
    "data-order-id",
    "one",
  );
  assert.ok(
    await priority
      .locator("[data-order-id]")
      .evaluateAll((items) =>
        items.every((item) => !item.style.order && !item.dataset.dragging),
      ),
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
  await expect(
    page.locator(".meridian-order-preview, [data-dragging]"),
  ).toHaveCount(0);
  const virtual = page.getByRole("region", { name: "Large list", exact: true });
  assert.ok((await virtual.locator("li").count()) < 30);
  await virtual.evaluate((el) => (el.scrollTop = 20000));
  await expect(virtual).toContainText("Row 500");
  assert.ok((await virtual.locator("li").count()) < 30);
  await virtual.evaluate((el) => (el.scrollTop = 0));
  await expect(virtual).toContainText("Row 0");
}
