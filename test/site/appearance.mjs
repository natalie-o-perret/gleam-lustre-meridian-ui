import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { expect } from "playwright/test";
import { appearanceColours } from "./appearance-colours.mjs";

const require = createRequire(import.meta.url);

export async function appearanceChecks(page, open) {
  const frame = await open("codeblock");
  const button = page.getByRole("button", {
    name: "Customise appearance",
    exact: true,
  });
  const popup = page.getByRole("dialog", { name: "Appearance", exact: true });
  await expect(page.locator("#theme + #palette-tools #palette")).toHaveCount(1);
  await expect(popup).toBeHidden();
  await button.focus();
  await button.press("Enter");
  await expect(popup).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#style")).toBeFocused();
  await popup.press("Escape");
  await expect(popup).toBeHidden();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-expanded", "false");

  await button.click();
  await expect(popup).toBeInViewport({ ratio: 1 });
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await popup.evaluate(async (node) =>
    (
      await axe.run(node, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((node) => node.failureSummary),
    })),
  );
  assert.deepEqual(violations, []);
  await page.mouse.click(
    page.viewportSize().width / 2,
    page.viewportSize().height - 1,
  );
  await expect(popup).toBeHidden();
  await expect(button).toHaveAttribute("aria-expanded", "false");

  await frame.locator(".meridian-code-block").first().focus();
  await appearanceColours(page, frame);
}
