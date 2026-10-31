import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function treeAppearance(page, open) {
  for (const [id, name] of [
    ["tree", "Tree"],
    ["treeselect", "TreeSelect"],
    ["filetree", "FileTree"],
    ["treetable", "TreeTable"],
  ]) {
    const frame = await open(id);
    const properties = page.getByRole("form", {
      name: `${name} preview properties`,
      exact: true,
    });
    const table = id === "treetable";
    const tree = frame.locator(
      table
        ? ".meridian-table-scroll"
        : id === "treeselect"
          ? ".meridian-tree-select"
          : ".meridian-tree",
    );
    const toggle = frame
      .locator(table ? "[data-tree-table-toggle]" : "[data-tree-expand]")
      .first();
    const expanded = table
      ? toggle
      : frame.locator('[role="treeitem"][aria-expanded]').first();
    const branch = frame.locator(table ? "tbody" : '[role="group"]').first();
    await branch.evaluate((node) => {
      window.treeMotion = [];
      window.treeMotionObserver = new MutationObserver(() => {
        window.treeMotion.push(
          node
            .getAnimations({ subtree: true })
            .filter((animation) => !("transitionProperty" in animation)).length,
        );
      });
      window.treeMotionObserver.observe(node, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    });
    for (const [label, attribute] of [
      ["Dashed tree lines", "data-tree-lines"],
      ["Boxed +/- toggles", "data-tree-boxes"],
    ]) {
      await properties.getByLabel(label, { exact: true }).uncheck();
      await expect(tree).toHaveAttribute(attribute, "false");
      await properties.getByLabel(label, { exact: true }).check();
      await expect(tree).toHaveAttribute(attribute, "true");
    }
    await toggle.scrollIntoViewIfNeeded();
    const initial = await expanded.getAttribute("aria-expanded");
    await toggle.click();
    await expect(expanded).toHaveAttribute(
      "aria-expanded",
      initial === "true" ? "false" : "true",
    );
    await expect
      .poll(() =>
        branch.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => !("transitionProperty" in animation))
              .length,
        ),
      )
      .toBe(0);
    await toggle.click();
    await expect(expanded).toHaveAttribute("aria-expanded", initial);
    await expect
      .poll(() =>
        branch.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => !("transitionProperty" in animation))
              .length,
        ),
      )
      .toBe(0);
    const motion = await frame.evaluate(() => {
      window.treeMotionObserver.disconnect();
      return {
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        samples: window.treeMotion,
      };
    });
    assert.ok(
      motion.reduced
        ? motion.samples.every((count) => count === 0)
        : motion.samples.some((count) => count > 0),
      `${name}: expansion/collapse honours reduced motion`,
    );
    await properties
      .getByLabel("Expand/collapse animation", { exact: true })
      .uncheck();
    await expect(tree).toHaveAttribute("data-tree-animate", "false");
    await toggle.click();
    assert.equal(
      await branch.evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((animation) => !("transitionProperty" in animation)).length,
      ),
      0,
      `${name}: explicit animation opt-out`,
    );
    await toggle.click();
    await properties
      .getByLabel("Expand/collapse animation", { exact: true })
      .check();
    for (let index = 0; index < 4; index++) await toggle.click({ delay: 5 });
    await expect(expanded).toHaveAttribute("aria-expanded", initial);
    await expect
      .poll(() =>
        branch.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => !("transitionProperty" in animation))
              .length,
        ),
      )
      .toBe(0);
    if (table) {
      assert.equal(
        await frame
          .locator("thead th")
          .first()
          .evaluate((node) => getComputedStyle(node, "::before").content),
        "none",
        "Tree lines belong to body rows, not table headings",
      );
      await expect(frame.locator('tbody tr[aria-hidden="true"]')).toHaveCount(
        0,
      );
      await toggle.focus();
      assert.ok(
        await toggle.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          const scroll = node
            .closest(".meridian-table-scroll")
            .getBoundingClientRect();
          return bounds.left >= scroll.left && bounds.right <= scroll.right;
        }),
        "TreeTable focus stays inside its scroll region",
      );
    }
  }
}
