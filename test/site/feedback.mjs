import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function feedbackChecks(page, open) {
  let frame = await open("codeblock");
  await expect(page.locator(".docs-source .meridian-code-viewer")).toHaveCount(
    1,
  );
  await page.getByRole("tab", { name: "Full module", exact: true }).click();
  await expect(page.locator("#module-code")).toContainText(
    "pub fn code_block_example",
  );
  await expect(page.locator(".docs-source .meridian-code-viewer")).toHaveCount(
    2,
  );
  await page.getByRole("tab", { name: "Helpers", exact: true }).click();
  await expect(page.locator("#helpers-code")).toContainText("pub fn start(");
  await expect(page.locator(".docs-source .meridian-code-viewer")).toHaveCount(
    3,
  );
  await page.getByRole("tab", { name: "Example", exact: true }).click();
  const viewer = frame.locator(".meridian-code-viewer");
  const source = await viewer.getAttribute("data-code-source");
  await expect(viewer.locator("[data-code-fold]")).not.toHaveCount(0);
  await viewer
    .getByRole("button", { name: "Collapse all code blocks", exact: true })
    .click();
  await expect(
    viewer.locator('[data-code-fold][aria-expanded="false"]'),
  ).not.toHaveCount(0);
  await expect(viewer.locator("pre code")).toHaveText(source);
  await frame.evaluate(() => {
    window.copiedCode = null;
    window.originalCopy = navigator.clipboard.writeText;
    navigator.clipboard.writeText = async (text) => {
      window.copiedCode = text;
    };
  });
  await viewer.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect.poll(() => frame.evaluate(() => window.copiedCode)).toBe(source);
  await frame.evaluate(() => {
    navigator.clipboard.writeText = window.originalCopy;
  });
  await viewer
    .getByRole("button", { name: "Expand all code blocks", exact: true })
    .click();
  await expect(viewer.locator("[data-code-line][hidden]")).toHaveCount(0);
  await viewer.locator("[data-code-fold]").first().click();
  await expect(viewer.locator("[data-code-line][hidden]")).not.toHaveCount(0);
  const codeControls = page.getByRole("form", {
    name: "CodeBlock preview properties",
    exact: true,
  });
  const language = codeControls.getByRole("combobox", {
    name: "Source language",
    exact: true,
  });
  await language.selectOption("json");
  await expect(viewer.locator("[data-code-line][hidden]")).toHaveCount(0);
  await expect(viewer.locator("[data-code-fold]")).toHaveCount(0);
  await language.selectOption("gleam");
  await expect(viewer.locator("[data-code-fold]")).not.toHaveCount(0);
  await codeControls.getByLabel("Source", { exact: true }).click();
  await codeControls
    .getByLabel("Source", { exact: true })
    .fill("pub fn different() {\n  Nil\n}\n");
  await codeControls.getByLabel("Source", { exact: true }).press("Tab");
  await expect(viewer.locator("[data-code-line][hidden]")).toHaveCount(0);
  await expect(
    viewer.getByRole("button", { name: "Collapse fn different", exact: true }),
  ).toBeVisible();

  frame = await open("icons");
  for (const [style, radius, cap] of [
    ["square", "2px", "square"],
    ["rounded", "12px", "round"],
    ["playful", "22px", "round"],
    ["fantasy", "18px 4px", "round"],
  ]) {
    if (page.viewportSize().width <= 900)
      await page.locator("#open-navigation").click();
    await page
      .getByRole("combobox", { name: "Library style", exact: true })
      .selectOption(style);
    if (page.viewportSize().width <= 900)
      await page.locator("#close-navigation").click();
    await expect(page.locator("body")).toHaveAttribute("data-style", style);
    await expect(frame.locator("#demo-root")).toHaveAttribute(
      "data-style",
      style,
    );
    await expect(page.locator(".docs-properties")).toHaveCSS(
      "border-radius",
      radius,
    );
    await expect(frame.locator(".demo-icon-grid svg").first()).toHaveCSS(
      "stroke-linecap",
      cap,
    );
    await expect(frame.locator('[data-icon-brand="github"]')).toHaveCSS(
      "fill",
      await frame
        .locator('[data-icon-brand="github"]')
        .evaluate((node) => getComputedStyle(node).color),
    );
  }
  if (page.viewportSize().width <= 900)
    await page.locator("#open-navigation").click();
  await page
    .getByRole("combobox", { name: "Library style", exact: true })
    .selectOption("rounded");
  if (page.viewportSize().width <= 900)
    await page.locator("#close-navigation").click();

  frame = await open("listbox");
  for (const selector of [
    ".docs-example .docs-toggle",
    ".docs-properties .docs-toggle",
    ".docs-api > header .docs-toggle",
  ]) {
    const toggle = page.locator(selector);
    assert.ok(
      await toggle.evaluate((button) => {
        const box = button.getBoundingClientRect();
        const heading = button.parentElement.getBoundingClientRect();
        const icon = button
          .querySelector(".meridian-disclosure-icon")
          .getBoundingClientRect();
        return (
          Math.abs(box.left - heading.left) <= 1 &&
          Math.abs(box.width - heading.width) <= 1 &&
          icon.left - box.left >= 8 &&
          box.right - icon.right >= 8
        );
      }),
      "Inset the chevron inside the existing full-width toggle, not the container",
    );
  }
  const list = frame.getByRole("listbox", { name: "Teams", exact: true });
  await list.selectOption("engineering");
  await list.focus();
  await expect(list).toBeFocused();
  const selection = await list.locator("option:checked").evaluate((option) => {
    const style = getComputedStyle(option);
    const sample = document.createElement("span");
    sample.style.backgroundImage =
      "linear-gradient(var(--accent), var(--accent))";
    sample.style.color = "var(--on-accent)";
    option.parentElement.after(sample);
    const expected = getComputedStyle(sample);
    const colours = {
      actual: [style.backgroundImage, style.webkitTextFillColor || style.color],
      expected: [expected.backgroundImage, expected.color],
    };
    sample.remove();
    return colours;
  });
  assert.deepEqual(
    selection.actual,
    selection.expected,
    "Focused native selections must use the theme accent, not OS blue",
  );

  frame = await open("metergroup");
  const legend = frame.locator(".meridian-meter-group > ul");
  await expect(legend).toHaveCSS("list-style-type", "none");
  await expect(legend).toHaveAttribute("role", "list");
  await expect(legend.locator(".badge")).toHaveCount(3);

  frame = await open("skeleton");
  const card = frame.getByRole("region", {
    name: "Matching loading and loaded card",
    exact: true,
  });
  const unloaded = await card.boundingBox();
  await page
    .getByRole("form", { name: "Skeleton preview properties", exact: true })
    .getByLabel("Loaded content", { exact: true })
    .check();
  await expect(card).toHaveAttribute("aria-busy", "false");
  const loaded = await card.boundingBox();
  assert.ok(
    Math.abs(loaded.width - unloaded.width) <= 1 &&
      Math.abs(loaded.height - unloaded.height) <= 1,
    "The loading card must match its loaded counterpart's dimensions",
  );
  await expect(
    card.getByRole("img", {
      name: "A mountain landscape at sunrise",
      exact: true,
    }),
  ).toBeVisible();

  frame = await open("terminal");
  const command = frame.getByRole("textbox", { name: "Command", exact: true });
  const output = frame.getByRole("log");
  await command.fill("help");
  await command.press("Enter");
  await expect(output).toContainText("Show available commands");
  await expect(output.locator(".meridian-terminal-command")).toHaveCount(1);
  await command.press("ArrowUp");
  await expect(command).toHaveValue("help");
  await command.fill("echo <script>not executable</script>");
  await command.press("Enter");
  await expect(output).toContainText("<script>not executable</script>");
  await expect(output.locator("script")).toHaveCount(0);
  const terminalControls = page.getByRole("form", {
    name: "Terminal preview properties",
    exact: true,
  });
  await terminalControls.getByLabel("Read-only", { exact: true }).check();
  await expect(command).toHaveAttribute("readonly");
  await expect(
    frame.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await terminalControls.getByLabel("Read-only", { exact: true }).uncheck();
  await command.fill("clear");
  await command.press("Enter");
  await expect(output).toHaveText("");

  frame = await open("table");
  const tableControls = page.getByRole("form", {
    name: "Table preview properties",
    exact: true,
  });
  const delay = tableControls.getByRole("spinbutton", {
    name: "Server delay (ms)",
    exact: true,
  });
  await delay.fill("50");
  await delay.press("Tab");
  await tableControls
    .getByRole("combobox", { name: "Data source", exact: true })
    .selectOption("server");
  const remote = frame.getByRole("region", { name: "Projects", exact: true });
  await expect(remote.locator('[aria-busy="false"]')).toBeVisible();
  await expect(remote.locator("tbody tr")).toHaveCount(3);
  const request = frame.locator("#server-request");
  const initialRequest = await request.textContent();
  await remote.getByRole("checkbox").first().check();
  await expect(request).toHaveText(initialRequest);
  await remote.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(request).toContainText("offset: 3");
  await expect(remote.locator("tbody tr").first()).toContainText("Drift");
  const sort = remote.getByRole("button", { name: "Project", exact: true });
  await sort.click();
  await expect(request).toContainText("sort: name ascending");
  await expect(request).toContainText("offset: 0");
  await expect(remote.locator("tbody tr").first()).toContainText("Atlas");
  await sort.click();
  await expect(remote.locator("tbody tr").first()).toContainText("Éire");
  await sort.click();
  await expect(request).toContainText("sort: original order");
  await expect(remote.locator("tbody tr").first()).toContainText("Atlas");
  const query = remote.getByRole("searchbox", {
    name: "Search Projects",
    exact: true,
  });
  await query.fill("eire");
  await expect(remote.locator("tbody tr")).toHaveCount(1);
  await expect(remote.locator("tbody")).toContainText("Éire");
  await expect(remote.getByRole("status")).toHaveText("Page 1 of 1");
  await delay.fill("300");
  await delay.press("Tab");
  await query.fill("atlas");
  await delay.fill("50");
  await delay.press("Tab");
  await query.fill("beacon");
  await expect(remote.locator("tbody tr")).toHaveCount(1);
  await expect(remote.locator("tbody")).toContainText("Beacon");
  await page.waitForTimeout(350);
  await expect(remote.locator("tbody")).toContainText("Beacon");
  await tableControls
    .getByLabel("Simulate server failure", { exact: true })
    .check();
  await expect(remote.getByRole("alert")).toContainText("request failed");
  await frame
    .getByRole("button", { name: "Retry request", exact: true })
    .click();
  await expect(remote.getByRole("alert")).toContainText("request failed");
  await tableControls
    .getByLabel("Simulate server failure", { exact: true })
    .uncheck();
  await expect(remote.getByRole("alert")).toHaveCount(0);
  await expect(remote.locator('[aria-busy="false"]')).toBeVisible();
  await remote
    .getByRole("combobox", { name: "Rows per page", exact: true })
    .selectOption("10");
  await expect(request).toContainText("limit: 10");

  frame = await open("toast");
  const controls = page.getByRole("form", {
    name: "Toast preview properties",
    exact: true,
  });
  const position = controls.getByRole("combobox", {
    name: "Position",
    exact: true,
  });
  const timeout = controls.getByRole("spinbutton", {
    name: "Timeout (ms, 0 persists)",
    exact: true,
  });
  await timeout.fill("0");
  await timeout.press("Tab");
  const stack = page.locator(".docs-preview-toasts .meridian-toasts");
  for (const placement of [
    "top-right",
    "top-left",
    "top-centre",
    "centre",
    "bottom-right",
    "bottom-left",
    "bottom-centre",
  ]) {
    await position.selectOption(placement);
    await expect(stack).toHaveAttribute("data-toast-position", placement);
    await expect(stack.locator("[data-meridian-toast]")).toHaveCount(1);
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect
      .poll(
        () =>
          stack.evaluate((node, placement) => {
            const probe = document.createElement("div");
            Object.assign(probe.style, {
              position: "fixed",
              inset: "0",
              pointerEvents: "none",
            });
            document.body.append(probe);
            const viewport = probe.getBoundingClientRect();
            const box = node.getBoundingClientRect();
            probe.remove();
            const horizontal = placement.endsWith("-left")
              ? box.left - viewport.left - 16
              : placement.endsWith("-right")
                ? viewport.right - box.right - 16
                : box.left + box.width / 2 - viewport.left - viewport.width / 2;
            const vertical = placement.startsWith("top-")
              ? box.top - 16
              : placement.startsWith("bottom-")
                ? viewport.height - box.bottom - 16
                : box.top + box.height / 2 - viewport.height / 2;
            return Math.max(
              Math.abs(horizontal),
              Math.abs(vertical),
              box.width - viewport.width + 32,
            );
          }, placement),
        {
          message: `${placement}: toasts must fit and align with the visible browser page`,
        },
      )
      .toBeLessThanOrEqual(1);
  }
  await position.selectOption("top-right");
  await expect(stack).toHaveAttribute("data-toast-position", "top-right");
  await timeout.fill("800");
  await timeout.press("Tab");
  await expect(frame.locator("[data-meridian-toast]")).toHaveAttribute(
    "data-timeout",
    "800",
  );
  const notice = stack.locator("[data-meridian-toast]");
  await expect(notice).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await notice.hover();
  await expect
    .poll(() => notice.evaluate((node) => node.matches(":hover")))
    .toBe(true);
  await page.waitForTimeout(900);
  await expect(notice).toHaveCount(1);
  const dismiss = notice.getByRole("button", {
    name: "Dismiss message",
    exact: true,
  });
  await dismiss.focus();
  await expect(dismiss).toBeFocused();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(900);
  await expect(notice).toHaveCount(1);
  await page.locator("#theme").focus();
  await expect(notice).toHaveCount(0, { timeout: 2500 });
  await timeout.fill("0");
  await timeout.press("Tab");
  await expect(notice).toHaveCount(1);
  await stack
    .getByRole("button", { name: "Dismiss message", exact: true })
    .click();
  await expect(stack.locator("[data-meridian-toast]")).toHaveCount(0);
  await expect(frame.locator("[data-meridian-toast]")).toHaveCount(0);
  await position.selectOption("top-right");
  await frame
    .getByRole("button", { name: "Save project", exact: true })
    .click();
  await expect(stack.locator("[data-meridian-toast]")).toHaveCount(1);
  await position.selectOption("inline");
  await expect(stack).toHaveCount(0);
  await expect(
    frame.getByRole("region", { name: "Project notifications", exact: true }),
  ).toBeVisible();
  await position.selectOption("top-right");
  await page
    .getByRole("button", { name: "Reset example", exact: true })
    .click();
  await expect(page.locator('iframe[data-ready="toast"]')).toBeVisible();
  await expect(stack).toHaveCount(0);
  await open("button");
  await expect(page.locator(".docs-preview-toasts")).toHaveCount(0);
  await expect(page.locator(".docs-api-function table")).toHaveCount(0);
  await page
    .getByRole("button", { name: "API reference", exact: true })
    .click();
  await page
    .getByRole("button", { name: "button.primary", exact: true })
    .click();
  await expect(
    page.locator("#docs-function-primary-content table"),
  ).toHaveCount(1);
}
