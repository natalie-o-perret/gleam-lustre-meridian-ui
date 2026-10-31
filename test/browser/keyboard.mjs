import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function keyboard(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const form = page.locator("#primary-form");
  const faq = form.getByRole("group", {
    name: "Project questions",
    exact: true,
  });
  const first = faq.getByRole("button", {
    name: "First question",
    exact: true,
  });
  const second = faq.getByRole("button", {
    name: "Second question",
    exact: true,
  });
  await first.focus();
  await first.press("ArrowDown");
  await expect(second).toBeFocused();
  await second.press("Space");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await second.press("End");
  await expect(
    faq.getByRole("button", { name: "Third question", exact: true }),
  ).toBeFocused();
  await second.press("Home");
  await expect(first).toBeFocused();
  await form
    .getByRole("switch", { name: "Multiple accordion panels", exact: true })
    .check();
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#secondary-faq-one-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator("#secondary-faq-two-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  const tablist = form.getByRole("tablist", {
    name: "Project views",
    exact: true,
  });
  const overview = tablist.getByRole("tab", { name: "Overview", exact: true });
  const activity = tablist.getByRole("tab", { name: "Activity", exact: true });
  const retained = form.locator("input[id='primary-retained']");
  await retained.fill("Retained é <项目>");
  await retained.evaluate((el) => {
    window.retainedTabNode = el;
  });
  await overview.focus();
  await overview.press(
    scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight",
  );
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute("aria-selected", "true");
  await expect(retained).toBeHidden();
  await activity.press("Home");
  await expect(overview).toHaveAttribute("aria-selected", "true");
  await expect(retained).toHaveValue("Retained é <项目>");
  assert.equal(
    await retained.evaluate((el) => el === window.retainedTabNode),
    true,
  );
  await form
    .getByRole("switch", { name: "Manual tab activation", exact: true })
    .check();
  await expect(tablist).toHaveAttribute("data-activation", "manual");
  await overview.focus();
  await overview.press(
    scenario.direction === "rtl" ? "ArrowLeft" : "ArrowRight",
  );
  await expect(activity).toBeFocused();
  await expect(overview).toHaveAttribute("aria-selected", "true");
  await activity.press("Enter");
  await expect(activity).toHaveAttribute("aria-selected", "true");
  await form
    .getByRole("switch", { name: "Vertical tabs and toolbar", exact: true })
    .check();
  await expect(tablist).toHaveAttribute("aria-orientation", "vertical");
  await activity.focus();
  await activity.press("Home");
  await expect(overview).toBeFocused();
  await overview.press("ArrowDown");
  await expect(activity).toBeFocused();

  const bar = form.getByRole("toolbar", {
    name: "Project actions",
    exact: true,
  });
  const firstAction = bar.getByRole("button", {
    name: "First action",
    exact: true,
  });
  const lastAction = bar.getByRole("button", {
    name: "Last action",
    exact: true,
  });
  await firstAction.focus();
  await firstAction.press("ArrowDown");
  await expect(lastAction).toBeFocused();
  await lastAction.press("Space");
  await expect(page.locator("#primary-actions")).toHaveText("Actions: 1");
  await lastAction.press("ArrowDown");
  const filter = bar.getByRole("textbox", {
    name: "Toolbar filter",
    exact: true,
  });
  await expect(filter).toBeFocused();
  await filter.press("Home");
  await expect(filter).toBeFocused();
  await filter.press("x");
  await expect(filter).toHaveValue("xeditable");
  assert.equal(
    await bar.locator('[data-meridian-item][tabindex="0"]').count(),
    1,
  );

  const steps = form.getByRole("tablist", {
    name: "Project setup",
    exact: true,
  });
  await expect(
    steps.getByRole("tab", { name: "2. Review", exact: true }),
  ).toBeDisabled();
  await form
    .getByRole("button", { name: "Complete account", exact: true })
    .click();
  const review = steps.getByRole("tab", { name: "2. Review", exact: true });
  await expect(review).toBeEnabled();
  await review.click();
  await expect(
    form.getByRole("tabpanel", { name: "2. Review", exact: true }),
  ).toBeVisible();

  for (const name of ["Resize workspace", "Resize stacked workspace"]) {
    const handle = form.getByRole("separator", { name, exact: true });
    await handle.focus();
    await handle.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "10");
    await handle.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "90");
    const key = name.includes("stacked")
      ? "ArrowUp"
      : scenario.direction === "rtl"
        ? "ArrowRight"
        : "ArrowLeft";
    await handle.press("Shift+" + key);
    await expect(handle).toHaveAttribute("aria-valuenow", "80");
    await handle.scrollIntoViewIfNeeded();
    const container = await handle.locator("..").boundingBox();
    const grip = await handle.boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      container.x + container.width / 2,
      container.y + container.height / 2,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect
      .poll(async () =>
        Math.abs(Number(await handle.getAttribute("aria-valuenow")) - 50),
      )
      .toBeLessThanOrEqual(2);
  }
  await expect(
    page.locator("#secondary-split [role='separator']"),
  ).toHaveAttribute("aria-valuenow", "35");
  await expect(page.locator("#primary-submitted")).toHaveText("Submissions: 0");
  await form.getByRole("button", { name: "Submit form", exact: true }).click();
  await expect(page.locator("#primary-submitted")).toHaveText("Submissions: 1");
}
