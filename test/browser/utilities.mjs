import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function utilities(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const start = page.getByRole("button", {
    name: "Begin blocked work",
    exact: true,
  });
  await start.click();
  const blocked = page
    .getByRole("status")
    .filter({ hasText: "Saving project" });
  await expect(blocked).toBeFocused();
  assert.equal(
    await start.evaluate((el) => Boolean(el.closest("[inert]"))),
    true,
  );
  await page
    .getByRole("button", { name: "Finish blocked work", exact: true })
    .click();
  await expect(blocked).toBeHidden();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  const editor = page.getByRole("textbox", {
    name: "Project editor",
    exact: true,
  });
  await expect(editor).toBeFocused();
  await editor.fill("New project");
  await editor.press("Escape");
  await expect(
    page.getByRole("button", { name: "Edit project", exact: true }),
  ).toBeFocused();
  await expect(page.locator("#saved-name")).toHaveText("Project");
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await editor.fill("Saved project");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator("#saved-name")).toHaveText("Saved project");
  await page
    .getByRole("button", { name: "Activate focus trap", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "First trapped action", exact: true }),
  ).toBeFocused();
  const release = page.getByRole("button", {
    name: "Release focus trap",
    exact: true,
  });
  await release.focus();
  await release.press("Tab");
  await expect(
    page.getByRole("button", { name: "First trapped action", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Activate nested trap", exact: true })
    .click();
  const nested = page.getByRole("button", {
    name: "Release nested trap",
    exact: true,
  });
  await expect(nested).toBeFocused();
  await nested.press("Tab");
  await expect(nested).toBeFocused();
  await nested.click();
  await release.click();
  await page.getByRole("button", { name: "Notify", exact: true }).click();
  const notice = page.locator("[data-meridian-toast]");
  await expect(notice).toBeVisible();
  await notice
    .getByRole("button", { name: "Dismiss message", exact: true })
    .focus();
  await page.waitForTimeout(1700);
  await expect(notice).toBeVisible();
  await page
    .getByRole("button", { name: "Outside trap action", exact: true })
    .focus();
  await page.mouse.move(0, 0);
  await expect(notice).toHaveCount(0, { timeout: 3000 });
  const ripple = page.getByRole("button", {
    name: "Ripple action",
    exact: true,
  });
  await ripple.click();
  if (scenario.motion === "reduce")
    await expect(page.locator(".meridian-ripple-effect")).toHaveCount(0);
  else await expect(page.locator(".meridian-ripple-effect")).toHaveCount(1);
  const terminal = page.getByRole("textbox", { name: "Command", exact: true });
  await terminal.pressSequentially("<script>literal</script>");
  await terminal.press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Received: <script>literal</script>",
  );
  await terminal.press("ArrowUp");
  await expect(terminal).toHaveValue("<script>literal</script>");
  await terminal.fill("Composing text");
  assert.equal(
    await terminal.evaluate((input) =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowUp",
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
    true,
  );
  await expect(terminal).toHaveValue("Composing text");
  const carousel = page.getByRole("region", {
    name: "Highlights",
    exact: true,
  });
  await carousel
    .getByRole("button", { name: "Next slide", exact: true })
    .click();
  await expect(
    carousel.getByText("Second highlight", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open full-size preview", exact: true })
    .click();
  const preview = page.getByRole("dialog", {
    name: "Team gallery preview",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();
  const comparison = page.getByRole("slider", { name: /Image comparison/ });
  await comparison.focus();
  await comparison.press("End");
  await expect(comparison).toHaveValue("100");
  const files = page.getByLabel("Attachments", { exact: true });
  await files.setInputFiles([
    { name: "small.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    { name: "wrong.png", mimeType: "image/png", buffer: Buffer.from("x") },
    { name: "large.txt", mimeType: "text/plain", buffer: Buffer.alloc(65) },
  ]);
  await expect(page.locator("#selected-files")).toHaveText("small.txt: 5");
  await expect(page.locator("#file-errors")).toContainText(
    "wrong.png: unsupported file type",
  );
  await expect(page.locator("#file-errors")).toContainText(
    "large.txt: file is too large",
  );
  const transfer = await page.evaluate(async () => {
    const { upload } =
      await import("/build/dev/javascript/meridian_ui/meridian_ui/upload_ffi.mjs");
    const files = [
      { 0: new File(["hello"], "small.txt", { type: "text/plain" }) },
    ];
    const progress = [];
    const result = await new Promise((resolve) =>
      upload(
        "/test/upload",
        files,
        (loaded, total) => progress.push([loaded, total]),
        (status, text) => resolve({ status, text }),
      ),
    );
    const cancelled = await new Promise((resolve) => {
      const cancel = upload(
        "/test/upload-slow",
        files,
        () => {},
        (status, text) => resolve({ status, text }),
      );
      cancel();
    });
    return { result, cancelled, progress };
  });
  assert.equal(transfer.result.status, 200);
  assert.match(transfer.result.text, /name="files"; filename="small.txt"/);
  assert.match(transfer.result.text, /hello/);
  assert.ok(
    transfer.progress.some(([loaded, total]) => loaded > 0 && total >= loaded),
  );
  assert.deepEqual(transfer.cancelled, { status: 0, text: "Cancelled" });
  const scroll = page.locator("#example-scroll");
  await scroll.evaluate((el) => (el.scrollTop = 9999));
  await scroll
    .getByRole("button", { name: "Back to container top", exact: true })
    .click();
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(scroll).toBeFocused();
  await page
    .getByRole("button", { name: "Back to page top", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Utilities and media", exact: true }),
  ).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const trapOpener = page.getByRole("button", {
    name: "Activate focus trap",
    exact: true,
  });
  await trapOpener.click();
  await page
    .getByRole("button", { name: "Activate nested trap", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Release nested trap", exact: true }),
  ).toBeFocused();
  await page.evaluate(() => {
    window.disposeMeridian[0]();
    window.disposeMeridian[0]();
  });
  await expect(trapOpener).toBeFocused();
}
