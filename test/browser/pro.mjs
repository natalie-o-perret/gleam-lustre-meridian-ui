import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { expect } from "playwright/test";

const require = createRequire(import.meta.url);

async function checkCalendar(page) {
  const violations = await page.evaluate(async () => {
    const result = await axe.run(document.querySelector("#calendar"), {
      rules: {
        "color-contrast": {
          enabled: !matchMedia("(forced-colors: active)").matches,
        },
      },
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((node) => ({
        html: node.html,
        summary: node.failureSummary,
      })),
    }));
  });
  assert.deepEqual(violations, []);
}

export async function pro(page, scenario) {
  await page.waitForFunction(() => window.meridianReady);
  const chart = page.locator("#requests-chart");
  await expect(chart.locator("svg")).toBeVisible();
  await page.getByRole("button", { name: "Change chart", exact: true }).click();
  await expect(chart).toHaveAttribute("data-chart", /"type":"line"/);
  await expect(chart.locator("svg")).toBeVisible();
  await page.getByText("Chart data", { exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "[3,2,5]", exact: true }),
  ).toBeVisible();
  const point = page.getByRole("button", {
    name: "Select Count Tue",
    exact: true,
  });
  await point.focus();
  await point.press("Enter");
  await expect(page.locator("#selected-event")).toHaveText(
    "Selected: Count: Tue",
  );
  for (const kind of [
    "area",
    "scatter",
    "pie",
    "doughnut",
    "radar",
    "gauge",
    "heatmap",
    "treemap",
    "sunburst",
    "funnel",
    "boxplot",
    "candlestick",
    "line",
  ]) {
    const previous = await chart.getAttribute("data-chart");
    await page
      .getByRole("combobox", { name: "Chart kind", exact: true })
      .selectOption(kind);
    await expect
      .poll(() => chart.getAttribute("data-chart"))
      .not.toBe(previous);
    await expect(chart.locator("svg")).toBeVisible();
    if (["treemap", "sunburst"].includes(kind)) {
      await page
        .getByRole("button", { name: "Select Count Two", exact: true })
        .click();
      await expect(page.locator("#selected-event")).toHaveText(
        "Selected: Count: Two",
      );
    }
  }
  const calendar = page.locator("#calendar");
  await expect(calendar.locator(".fc-toolbar-title")).toContainText(
    "October 2026",
  );
  await expect(calendar.locator('[data-calendar-event="weekly"]')).toHaveCount(
    5,
  );
  const review = calendar.locator('[data-calendar-event="review"]');
  await review.focus();
  await review.press("Enter");
  await expect(page.locator("#selected-event")).toHaveText("Selected: review");
  await page.evaluate(async () => {
    const { Calendar } =
      await import("/build/dev/javascript/meridian_ui/meridian_ui/internal/vendor/calendar.mjs");
    const add = Calendar.prototype.addEventSource;
    Calendar.prototype.addEventSource = function (...args) {
      const result = add.apply(this, args);
      window.calendarSourceCount = this.getEventSources().length;
      return result;
    };
  });
  await page
    .getByLabel("Review start", { exact: true })
    .fill("2026-10-12T09:30");
  await expect(calendar).toHaveAttribute("data-scheduler", /09:30/);
  await expect(review).toHaveAttribute("aria-label", /09:30/);
  assert.equal(await page.evaluate(() => window.calendarSourceCount), 1);
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  await checkCalendar(page);
  for (const kind of [
    "timeGridWeek",
    "timeGridDay",
    "listWeek",
    "dayGridMonth",
  ]) {
    await calendar.locator(`.fc-${kind}-button`).click();
    await expect(calendar.locator(`.fc-${kind}-view`)).toBeVisible();
    await checkCalendar(page);
  }
  if (scenario.width >= 640) {
    await review.dragTo(
      calendar.locator('.fc-daygrid-day[data-date="2026-10-13"]'),
      { targetPosition: { x: 50, y: 40 } },
    );
    await expect(calendar).toHaveAttribute(
      "data-scheduler",
      /2026-10-13T09:30/,
    );
    await calendar.locator(".fc-timeGridWeek-button").click();
    await review.hover();
    const grip = await review.locator(".fc-event-resizer-end").boundingBox();
    const slot = await calendar
      .locator('.fc-timegrid-slot[data-time="10:00:00"]')
      .first()
      .boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      grip.x + grip.width / 2,
      grip.y + grip.height / 2 + slot.height * 2,
      { steps: 10 },
    );
    await page.mouse.up();
    await expect(calendar).toHaveAttribute(
      "data-scheduler",
      /2026-10-13T12:00/,
    );
    await calendar.locator(".fc-dayGridMonth-button").click();
  }
  const todo = page.getByRole("region", { name: "Todo", exact: true });
  const done = page.getByRole("region", { name: "Done", exact: true });
  await todo
    .getByRole("combobox", { name: "Move First task to", exact: true })
    .selectOption("done");
  await expect(done.getByText("First task", { exact: true })).toBeVisible();
  await expect(todo.getByText("First task", { exact: true })).toHaveCount(0);
  await done.getByText("Edit First task", { exact: true }).click();
  await done.getByLabel("Title", { exact: true }).fill("Updated task");
  await expect(done.getByText("Updated task", { exact: true })).toBeVisible();
  await expect(
    done.getByRole("textbox", { name: "Description", exact: true }),
  ).toHaveValue("Retain this description");
  if (scenario.width < 640) {
    await todo
      .getByRole("combobox", { name: "Move Second task to", exact: true })
      .selectOption("done");
  } else {
    await todo.locator('[data-order-id="two"]').dragTo(done, {
      sourcePosition: { x: 5, y: 5 },
      targetPosition: { x: 10, y: 15 },
    });
  }
  await expect(done.locator("[data-order-id]")).toHaveCount(2);
  const editor = page.getByRole("textbox", { name: "Notes", exact: true });
  await editor.click();
  await editor.press("ControlOrMeta+End");
  await editor.pressSequentially(" world");
  await expect(page.locator("#document-json")).toContainText("Hello world");
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(page.locator("#document-html")).toContainText(
    "<strong>Hello world</strong>",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).toHaveText("Hello world");
  await expect(page.locator("#document-html")).not.toContainText("<strong>");
  await editor.press("ControlOrMeta+a");
  await page.evaluate(() =>
    document.addEventListener(
      "copy",
      (event) => {
        event.clipboardData.setData(
          "text/html",
          '<p>Safe <strong>paste</strong><a href="javascript:alert(1)">bad</a><img src="javascript:alert(2)" onerror="alert(3)"><script>alert(4)</script></p>',
        );
        event.preventDefault();
      },
      { once: true, capture: true },
    ),
  );
  await editor.press("ControlOrMeta+c");
  await page.evaluate(() => {
    window.editorSelectionChanged = false;
    const changed = () => {
      const selection = getSelection();
      if (
        selection.isCollapsed &&
        document.querySelector("#notes").contains(selection.anchorNode)
      ) {
        window.editorSelectionChanged = true;
        document.removeEventListener("selectionchange", changed);
      }
    };
    document.addEventListener("selectionchange", changed);
  });
  await editor.press("ControlOrMeta+End");
  await page.waitForFunction(() => window.editorSelectionChanged);
  await editor.press("ControlOrMeta+v");
  await expect(editor).toContainText("Safe pastebad");
  await expect(editor).toContainText("Hello world");
  const html = await page.locator("#document-html").textContent();
  assert.ok(
    !html.includes("javascript:") &&
      !html.includes("<script") &&
      !html.includes("onerror"),
  );
  await page
    .getByRole("switch", { name: "Read-only editor", exact: true })
    .check();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await expect(
    page.getByRole("button", { name: "Bold", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("switch", { name: "Read-only editor", exact: true })
    .uncheck();
  await expect(editor).toHaveAttribute("contenteditable", "true");
  await editor.focus();
  await editor.press("ControlOrMeta+End");
  await page.getByRole("button", { name: "Insert table", exact: true }).click();
  await expect(editor.locator("table")).toHaveCount(1);
  const lifecycle = await page.evaluate(async () => {
    const { mount: chart } =
      await import("/build/dev/javascript/meridian_ui/meridian_ui/charts_ffi.mjs");
    const { mount: calendar } =
      await import("/build/dev/javascript/meridian_ui/meridian_ui/scheduler_ffi.mjs");
    const { mount: editor } =
      await import("/build/dev/javascript/meridian_ui/meridian_ui/editor_ffi.mjs");
    for (const dispose of window.disposeEngines) {
      dispose();
      dispose();
    }
    const disposed = [
      document.querySelectorAll("#requests-chart svg").length,
      document.querySelectorAll("#calendar .fc-view").length,
      document.querySelectorAll("#notes .meridian-rich-text").length,
    ];
    window.disposeEngines = [
      chart("requests-chart"),
      calendar("calendar"),
      editor("notes"),
    ];
    return disposed;
  });
  assert.deepEqual(lifecycle, [0, 0, 0]);
  await expect(chart.locator("svg")).toHaveCount(1);
  await expect(calendar.locator(".fc-view")).toHaveCount(1);
  await expect(page.locator("#notes .meridian-rich-text")).toHaveCount(1);
  await expect(page.locator("#notes table")).toHaveCount(1);
}
