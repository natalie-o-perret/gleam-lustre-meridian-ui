import assert from "node:assert/strict";
import { expect } from "playwright/test";

export async function polishChecks(page, open) {
  let frame = await open("keyfilter");
  const alignment = await page
    .locator(".docs-properties-bar")
    .evaluate((bar) => {
      const select = bar.querySelector("select").getBoundingClientRect();
      const reset = bar.querySelector("button").getBoundingClientRect();
      return Math.abs(select.bottom - reset.bottom);
    });
  assert.ok(alignment <= 1, "Reset must align with the example picker");
  assert.ok(
    await frame.locator("form").evaluate((form) => {
      const [field, button] = [...form.children].map((node) =>
        node.getBoundingClientRect(),
      );
      return button.top - field.bottom >= 16;
    }),
    "Form controls and actions need a visible gap",
  );

  frame = await open("organizationchart");
  const chart = frame.locator(".meridian-org-chart");
  for (const node of await chart.locator(".meridian-org-node").all()) {
    await node.evaluate((node) =>
      node.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "instant",
      }),
    );
    const box = await node.boundingBox();
    const bounds = await chart.boundingBox();
    assert.ok(
      box.x + box.width / 2 >= bounds.x &&
        box.x + box.width / 2 <= bounds.x + bounds.width,
      "Every org chart node must be reachable by scrolling",
    );
  }
  await chart.focus();
  await expect(chart).toHaveCSS("outline-style", "none");

  frame = await open("splitter");
  const handle = frame.getByRole("separator");
  await expect(handle).toHaveCSS("width", "8px");
  await page.mouse.move(0, 0);
  const idleLine = await handle.evaluate(
    (node) => getComputedStyle(node, "::after").backgroundColor,
  );
  await handle.hover();
  await expect
    .poll(() =>
      handle.evaluate(
        (node) => getComputedStyle(node, "::after").backgroundColor,
      ),
    )
    .not.toBe(idleLine);
  assert.ok(
    await handle.evaluate((node) => {
      const hit = getComputedStyle(node, "::before");
      const line = getComputedStyle(node, "::after");
      const style = getComputedStyle(node);
      return (
        node.getBoundingClientRect().width -
          parseFloat(hit.left) -
          parseFloat(hit.right) >=
          24 &&
        line.backgroundColor !== "rgba(0, 0, 0, 0)" &&
        style.outlineStyle === "none"
      );
    }),
    "Splitters need a thin visible line and a usable drag target",
  );

  frame = await open("paginator");
  const pages = frame.getByRole("navigation", {
    name: "Project pages",
    exact: true,
  });
  const jump = pages.getByRole("combobox", { name: "Go to page", exact: true });
  await jump.fill("3");
  await jump.press("Enter");
  await expect(pages.getByRole("status")).toHaveText("Page 3 of 3");
  await expect(
    pages.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled();
  await expect(
    pages
      .getByRole("button", { name: "First page", exact: true })
      .locator("svg"),
  ).toBeVisible();
  await pages
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await expect(pages.getByRole("status")).toHaveText("Page 2 of 3");
  await frame
    .getByRole("combobox", { name: "Rows per page", exact: true })
    .selectOption("5");
  await expect(pages.getByRole("status")).toHaveText("Page 1 of 2");
  await jump.fill("999");
  await jump.press("Enter");
  await expect(jump).toHaveAttribute("aria-invalid", "true");
  await expect(pages.getByRole("status")).toHaveText("Page 1 of 2");

  frame = await open("table");
  const header = frame.getByRole("columnheader", {
    name: "Project",
    exact: true,
  });
  const sorted = await header.getAttribute("aria-sort");
  const sort = header.getByRole("button", { name: "Project", exact: true });
  await expect(sort.locator("svg")).toBeVisible();
  await sort.click();
  await expect(header).toHaveAttribute(
    "aria-sort",
    sorted === "ascending" ? "descending" : "ascending",
  );
  if ((await header.getAttribute("aria-sort")) === "ascending")
    await sort.click();
  await sort.click();
  await expect(header).not.toHaveAttribute("aria-sort");
  await expect(frame.locator("tbody tr").first()).toContainText("Atlas");
  const contentHeight = await page
    .locator("iframe")
    .evaluate((frame) => frame.getBoundingClientRect().height);
  await frame.getByRole("checkbox").first().hover();
  await expect(frame.getByRole("tooltip")).toContainText("Select ");
  assert.equal(
    await page
      .locator("iframe")
      .evaluate((frame) => frame.getBoundingClientRect().height),
    contentHeight,
    "Tooltips must not resize the preview",
  );

  frame = await open("animateonscroll");
  const reveal = frame.locator("#reveal-card");
  const viewport = frame.getByRole("region", {
    name: "Animation viewport",
    exact: true,
  });
  const reduced = await frame.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  await expect(reveal).toHaveCSS("opacity", reduced ? "1" : "0");
  await reveal.evaluate((card) => {
    window.revealAnimations = [];
    window.revealObserver = new MutationObserver(() => {
      if (card.dataset.meridianEntered === "true")
        window.revealAnimations.push(card.getAnimations().length);
    });
    window.revealObserver.observe(card, {
      attributes: true,
      attributeFilter: ["data-meridian-entered"],
    });
  });
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(reveal).toHaveAttribute("data-meridian-entered", "true");
  await expect(reveal).toHaveCSS("opacity", "1");
  await viewport.evaluate((node) => {
    node.scrollTop = 0;
  });
  await expect(reveal).not.toHaveAttribute("data-meridian-entered");
  await frame
    .getByRole("button", { name: "Replay animation", exact: true })
    .click();
  await expect(reveal).toHaveAttribute("data-meridian-entered", "true");
  const reveals = await frame.evaluate(() => {
    window.revealObserver.disconnect();
    return window.revealAnimations;
  });
  assert.ok(reveals.length >= 2, "Scroll reveal must be replayable");
  assert.ok(
    reveals.every((count) => (reduced ? count === 0 : count > 0)),
    "Scroll reveal must actually animate unless motion is reduced",
  );

  frame = await open("icons");
  await expect(frame.locator(".demo-icon-grid svg")).toHaveCount(128);
  assert.deepEqual(
    await frame.locator(".demo-icon-grid path").evaluateAll((paths) =>
      paths.flatMap((path) => {
        const box = path.getBBox();
        const view = path.ownerSVGElement.viewBox.baseVal;
        return path.getTotalLength() > 0 &&
          box.x >= view.x - 0.001 &&
          box.y >= view.y - 0.001 &&
          box.x + box.width <= view.x + view.width + 0.001 &&
          box.y + box.height <= view.y + view.height + 0.001
          ? []
          : [
              {
                icon: path.closest(".demo-icon-grid > div").textContent,
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
              },
            ];
      }),
    ),
    [],
    "Icons must have visible paths within their viewboxes",
  );
  frame = await open("dock");
  await expect(frame.locator(".meridian-dock svg")).toHaveCount(3);

  const theme = page.locator("#theme");
  const original = await theme.getAttribute("data-preference");
  await theme.evaluate((button) => {
    window.themeAnimations = [];
    window.themeObserver = new MutationObserver((records) => {
      if (
        records.some((record) =>
          [...record.addedNodes].some((node) => node.localName === "svg"),
        )
      )
        window.themeAnimations.push(
          button.querySelector("svg").getAnimations({ subtree: true }).length,
        );
    });
    window.themeObserver.observe(button, { childList: true });
  });
  for (let index = 0; index < 3; index++) await theme.click();
  await expect(theme).toHaveAttribute("data-preference", original);
  const transition = await page.evaluate(() => {
    window.themeObserver.disconnect();
    return {
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      counts: window.themeAnimations,
    };
  });
  assert.equal(transition.counts.length, 3);
  assert.ok(
    transition.counts.every((count) =>
      transition.reduced ? count === 0 : count > 0,
    ),
    "Theme changes need a snappy icon transition unless motion is reduced",
  );

  if (page.viewportSize().width > 900) {
    await expect(page.locator(".docs-nav-heading").first()).toHaveCSS(
      "margin-top",
      "12px",
    );
    await expect(page.locator(".docs-nav-heading").first()).toHaveCSS(
      "margin-bottom",
      "2px",
    );
  }
  if (page.viewportSize().width <= 560) {
    frame = await open("confirmdialog");
    const preview = page.locator("iframe");
    const rootHeight = await frame
      .locator("#demo-root")
      .evaluate((root) => root.getBoundingClientRect().height);
    await expect
      .poll(() =>
        preview.evaluate((frame) => frame.getBoundingClientRect().height),
      )
      .toBeCloseTo(Math.ceil(rootHeight), 0);
    assert.ok(
      rootHeight < 200,
      "Short mobile previews must not reserve an empty 300px area",
    );
    const box = await preview.boundingBox();
    assert.ok(
      box.y < 360,
      "Mobile headings must leave room for the live example",
    );
    assert.ok(
      (await page.locator(".docs-header").boundingBox()).height <= 72,
      "The mobile header must stay compact",
    );
  }
}
