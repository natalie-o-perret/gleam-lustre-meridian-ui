import { expect } from "playwright/test";

export async function editorChecks(page, open) {
  const frame = await open("texteditor");
  const json = frame.locator("#document-json");
  await expect(json.locator('code[data-language="json"]')).toHaveCount(1);
  await expect(json.locator("[data-code-number]")).not.toHaveCount(0);
  await expect(json.locator(".meridian-code-string")).not.toHaveCount(0);
  await frame
    .locator("summary")
    .filter({ hasText: /^Markdown$/ })
    .click();
  const source = frame.getByRole("textbox", {
    name: "Markdown source",
    exact: true,
  });
  const markdownPanel = frame.locator("details").filter({ has: source });
  await source.fill(
    "# A Markdown note\n\nWrite **bold** text.\n\n- One\n- Two\n",
  );
  await frame
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click();
  const editor = frame.getByRole("textbox", {
    name: "Project notes",
    exact: true,
  });
  await expect(editor.locator("h1")).toHaveText("A Markdown note");
  await expect(editor.locator("strong")).toHaveText("bold");
  await expect(editor.locator("li")).toHaveText(["One", "Two"]);
  const exportMarkdown = frame.getByRole("button", {
    name: "Export Markdown",
    exact: true,
  });
  await exportMarkdown.click();
  await expect(source).toHaveValue(/\*\*bold\*\*/);
  await editor.click();
  await editor.press("ControlOrMeta+a");
  await frame.getByLabel("Text colour", { exact: true }).click();
  const picker = frame.getByRole("dialog", {
    name: "Text colour picker",
    exact: true,
  });
  await picker
    .getByRole("textbox", { name: "Hex colour", exact: true })
    .fill("#225588");
  await picker.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(editor).toBeFocused();
  await expect(frame.getByLabel("Text colour", { exact: true })).toHaveValue(
    "#225588",
  );
  await expect(editor.locator("[data-text-colour]").first()).toHaveCSS(
    "color",
    "rgb(34, 85, 136)",
  );
  await expect(frame.locator("#document-json")).toContainText(
    '"colour": "#225588"',
  );
  const exported = await source.inputValue();
  await exportMarkdown.click();
  await expect(markdownPanel.getByRole("status")).toContainText(
    "Keep JSON for text colours",
  );
  await expect(source).toHaveValue(exported);
  await frame
    .getByRole("switch", { name: "Read-only editor", exact: true })
    .check();
  await expect(frame.getByLabel("Text colour", { exact: true })).toBeDisabled();
  await expect(
    frame.getByRole("button", { name: "Import Markdown", exact: true }),
  ).toBeDisabled();
  await frame
    .getByRole("switch", { name: "Read-only editor", exact: true })
    .uncheck();
  await frame
    .getByRole("button", { name: "Default text colour", exact: true })
    .click();
  await expect(editor.locator("[data-text-colour]")).toHaveCount(0);
  await exportMarkdown.click();
  await expect(markdownPanel.getByRole("status")).toHaveText(
    "Markdown exported.",
  );
}
