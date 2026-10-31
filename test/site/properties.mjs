import assert from "node:assert/strict";
import { expect } from "playwright/test";

async function rendered(page, frame) {
  await page.locator("iframe").scrollIntoViewIfNeeded();
  let deadline;
  try {
    await Promise.race([
      frame.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      ),
      new Promise((_, reject) => {
        deadline = setTimeout(
          () =>
            reject(new Error("Preview paint did not settle within 10 seconds")),
          10000,
        );
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
  return frame.locator("#demo-root").evaluate((root) =>
    JSON.stringify({
      markup: root.innerHTML,
      controls: [...root.querySelectorAll("input, select, textarea")].map(
        (control) => [control.value, control.checked, control.disabled],
      ),
    }),
  );
}

export async function propertyChecks(page, frame, entry) {
  const select = page.locator(".docs-example-selector select");
  for (let index = 1; index < entry.examples.length; index++) {
    await select.selectOption("0");
    if (entry.id === "accordion") {
      await rendered(page, frame);
      const toggle = frame.getByRole("button", {
        name: "Who owns the state?",
        exact: true,
      });
      if ((await toggle.getAttribute("aria-expanded")) === "false")
        await toggle.click();
    }
    const before = await rendered(page, frame);
    await select.selectOption(String(index));
    const after = await rendered(page, frame);
    assert.notEqual(
      after,
      before,
      `${entry.id}: ${entry.examples[index].name} must change the actual component`,
    );
  }
  await select.selectOption("0");
  await rendered(page, frame);
}

export async function propertyInteractions(page, open) {
  let frame = await open("button");
  let form = page.getByRole("form", {
    name: "Button preview properties",
    exact: true,
  });
  const label = form.getByLabel("Primary label", { exact: true });
  await label.fill("<em>Save changes</em>");
  await label.press("Tab");
  await page.locator("iframe").scrollIntoViewIfNeeded();
  const button = frame.getByRole("button", {
    name: "<em>Save changes</em>",
    exact: true,
  });
  await expect(button).toBeVisible();
  await expect(frame.locator("em")).toHaveCount(0);
  await form.getByLabel("Disabled", { exact: true }).check();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(button).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset example", exact: true })
    .click();
  await expect(page.locator('iframe[data-ready="button"]')).toBeVisible();
  frame = await (await page.locator("iframe").elementHandle()).contentFrame();
  await expect(
    frame.getByRole("button", { name: "Create project", exact: true }),
  ).toBeEnabled();

  frame = await open("select");
  form = page.getByRole("form", {
    name: "Select preview properties",
    exact: true,
  });
  await form
    .getByRole("combobox", { name: "Item content", exact: true })
    .selectOption("plain");
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(
    frame.locator(".meridian-search-select option .badge"),
  ).toHaveCount(0);
  await form
    .getByRole("combobox", { name: "Item content", exact: true })
    .selectOption("tags");
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(
    frame.locator(".meridian-search-select option .badge"),
  ).toHaveCount(3);
  const select = frame.getByRole("combobox", { name: "Team", exact: true });
  await select.selectOption("engineering");
  await form.getByLabel("Disabled", { exact: true }).check();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(select).toBeDisabled();
  await expect(select).toHaveValue("engineering");

  frame = await open("filetree");
  form = page.getByRole("form", {
    name: "FileTree preview properties",
    exact: true,
  });
  const files = frame.getByRole("tree", { name: "Project files", exact: true });
  const app = files.getByRole("treeitem", { name: "app.gleam", exact: true });
  await app.focus();
  await app.press("Space");
  await form.getByLabel("Multiple selection", { exact: true }).check();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(files).toHaveAttribute("aria-multiselectable", "true");
  const manifest = files.getByRole("treeitem", {
    name: "gleam.toml",
    exact: true,
  });
  await manifest.focus();
  await manifest.press("Space");
  await expect(files.locator('[aria-selected="true"]')).toHaveCount(2);
  await form.getByLabel("Multiple selection", { exact: true }).uncheck();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(files.locator('[aria-selected="true"]')).toHaveCount(1);

  frame = await open("menu");
  form = page.getByRole("form", {
    name: "Menu preview properties",
    exact: true,
  });
  await form.getByLabel("Nested export actions", { exact: true }).uncheck();
  await expect(
    frame.getByRole("menuitem", { name: "Export projects", exact: true }),
  ).toBeVisible();
  await form.getByLabel("Disable delete action", { exact: true }).uncheck();
  await form.getByLabel("Group separator", { exact: true }).uncheck();
  await expect(frame.getByRole("separator")).toHaveCount(0);
  await frame.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Actions: 1");

  frame = await open("sidebar");
  await frame
    .getByRole("searchbox", { name: "Filter workspace links", exact: true })
    .fill("project");
  await expect(
    frame
      .getByRole("navigation", { name: "Workspace links", exact: true })
      .getByRole("link"),
  ).toHaveText(["Projects"]);

  frame = await open("accordion");
  form = page.getByRole("form", {
    name: "Accordion preview properties",
    exact: true,
  });
  await form
    .getByRole("combobox", { name: "Expanded panels", exact: true })
    .selectOption("both");
  await expect(frame.locator('button[aria-expanded="true"]')).toHaveCount(2);
  await form.getByLabel("Multiple panels", { exact: true }).uncheck();
  await expect(frame.locator('button[aria-expanded="true"]')).toHaveCount(1);
  await form.getByLabel("Disable state panel", { exact: true }).check();
  await expect(
    frame.getByRole("button", { name: "Who owns the state?", exact: true }),
  ).toBeDisabled();

  frame = await open("tabs");
  form = page.getByRole("form", {
    name: "Tabs preview properties",
    exact: true,
  });
  await form
    .getByRole("combobox", { name: "Keyboard activation", exact: true })
    .selectOption("manual");
  await expect(frame.locator('[role="tablist"]')).toHaveAttribute(
    "data-activation",
    "manual",
  );
  const overview = frame.getByRole("tab", { name: "Overview", exact: true });
  const activity = frame.getByRole("tab", { name: "Activity", exact: true });
  await overview.focus();
  await overview.press(
    (await frame.locator("html").getAttribute("dir")) === "rtl"
      ? "ArrowLeft"
      : "ArrowRight",
  );
  await expect(activity).toBeFocused();
  await expect(overview).toHaveAttribute("aria-selected", "true");
  await activity.press("Enter");
  await expect(activity).toHaveAttribute("aria-selected", "true");

  frame = await open("tree");
  form = page.getByRole("form", {
    name: "Tree preview properties",
    exact: true,
  });
  await form.getByLabel("Expanded groups", { exact: true }).check();
  await form
    .getByRole("combobox", { name: "Node content", exact: true })
    .selectOption("tags");
  await expect(
    frame.getByRole("treeitem", { name: "Tokens Team", exact: true }),
  ).toBeVisible();
  await form.getByLabel("Disable Engineering", { exact: true }).check();
  await expect(frame.locator('[data-tree-id="engineering"]')).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  frame = await open("taskboard");
  form = page.getByRole("form", {
    name: "Task Board preview properties",
    exact: true,
  });
  await frame.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(frame.locator('[data-order-id="task-1"]')).toBeVisible();
  await form.getByLabel("Read-only board", { exact: true }).check();
  await expect(
    frame.getByRole("button", { name: "Add task", exact: true }),
  ).toBeDisabled();
  await expect(frame.locator('[data-order-id="task-1"] select')).toBeDisabled();
  await form.getByLabel("Read-only board", { exact: true }).uncheck();
  await frame.locator('[data-order-id="task-1"] select').selectOption("done");
  await expect(
    frame.locator('[data-board-column="done"] [data-order-id="task-1"]'),
  ).toBeVisible();

  frame = await open("filterservice");
  form = page.getByRole("form", {
    name: "FilterService preview properties",
    exact: true,
  });
  await frame.getByRole("searchbox").fill("a");
  await form
    .getByRole("combobox", { name: "Text match", exact: true })
    .selectOption("starts");
  await expect(frame.locator("#demo-root li")).toHaveText(["Atlas"]);

  frame = await open("texteditor");
  const editor = frame.getByRole("textbox", {
    name: "Project notes",
    exact: true,
  });
  await editor.click();
  await editor.press("ControlOrMeta+End");
  await editor.pressSequentially(" Keep this note");
  form = page.getByRole("form", {
    name: "Text Editor preview properties",
    exact: true,
  });
  await form.getByLabel("Read-only", { exact: true }).check();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(editor).toContainText("Keep this note");
  await form.getByLabel("Read-only", { exact: true }).uncheck();
  await form
    .getByRole("combobox", { name: "Sample document", exact: true })
    .selectOption("plan");
  await expect(
    editor.getByRole("heading", { name: "Project plan", exact: true }),
  ).toBeVisible();
  await form
    .getByRole("combobox", { name: "Sample document", exact: true })
    .selectOption("list");
  await expect(editor.getByRole("listitem")).toHaveText([
    "Review the design",
    "Write a focused test",
  ]);
}
