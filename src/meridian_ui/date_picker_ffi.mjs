import { positionOverlay } from "./overlays_ffi.mjs";

function civil(year, month, day) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function iso(date) {
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1) return "";
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function parse(value) {
  const match = /^(\d{4,})-(\d{2})(?:-(\d{2}))?(?:T|$)/.exec(value);
  if (!match) return null;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3] || 1),
  ];
  const date = civil(year, month, day);
  return iso(date) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
    ? date
    : null;
}

function shiftMonth(date, amount) {
  const next = civil(date.getUTCFullYear(), date.getUTCMonth() + amount + 1, 1);
  next.setUTCDate(
    Math.min(
      date.getUTCDate(),
      civil(next.getUTCFullYear(), next.getUTCMonth() + 2, 0).getUTCDate(),
    ),
  );
  return next;
}

export function calendarDates(year, month, firstDay = 0) {
  if (
    ![year, month, firstDay].every(Number.isInteger) ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    firstDay < 0 ||
    firstDay > 6
  )
    return [];
  const first = civil(year, month, 1);
  if (!iso(first)) return [];
  first.setUTCDate(1 - ((first.getUTCDay() - firstDay + 7) % 7));
  return Array.from({ length: 42 }, (_, index) =>
    iso(
      civil(
        first.getUTCFullYear(),
        first.getUTCMonth() + 1,
        first.getUTCDate() + index,
      ),
    ),
  );
}

function valid(input, value, dateOnly = false) {
  if (!value) return false;
  const kind = input.getAttribute("type");
  const probe = input.cloneNode(false);
  if (dateOnly) {
    probe.type = "date";
    probe.min = input.min.split("T")[0];
    probe.max = input.max.split("T")[0];
    probe.step = "1";
  }
  // Firefox's month input is text, so validate its month choices here too.
  if (kind === "month" && probe.type !== "month") {
    const index = (text) => {
      const date = parse(text);
      return date ? date.getUTCFullYear() * 12 + date.getUTCMonth() : NaN;
    };
    const number = index(value);
    const low = index(input.min);
    const high = index(input.max);
    const step =
      input.step === "any"
        ? 0
        : Number(input.step) > 0
          ? Number(input.step)
          : 1;
    const base = Number.isFinite(low)
      ? low
      : Number.isFinite(index(input.getAttribute("value") || ""))
        ? index(input.getAttribute("value"))
        : 1970 * 12;
    return (
      Number.isFinite(number) &&
      !(number < low || number > high) &&
      (!step ||
        Math.abs((number - base) / step - Math.round((number - base) / step)) <
          1e-7)
    );
  }
  probe.value = value;
  return probe.value !== "" && probe.validity.valid;
}

export function setupDatePickers(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (typeof view.HTMLDialogElement?.prototype.showModal !== "function")
    return () => {};
  const ready = new Map();
  let current;
  let locale;
  try {
    locale = new Intl.DateTimeFormat(
      doc.documentElement.lang || view.navigator.language,
    ).resolvedOptions().locale;
  } catch {
    locale = "en";
  }
  const language = new Intl.Locale(locale);
  const firstDay =
    ((language.getWeekInfo?.() ?? language.weekInfo)?.firstDay ?? 7) % 7;
  const format = (date, options) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
      date,
    );
  const owned = (input) => input?.closest?.(".meridian-ui") === root;
  const supported = (input) =>
    ["date", "month", "time", "datetime-local"].includes(
      input?.getAttribute("type"),
    );
  const signature = (input) =>
    JSON.stringify([input.value, input.min, input.max, input.step]);
  const today = () => {
    const now = new Date();
    return civil(now.getFullYear(), now.getMonth() + 1, now.getDate());
  };
  const element = (tag, className = "", text = "") => {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const button = (text, label, action, className = "") => {
    const node = element("button", `button ${className}`, text);
    node.type = "button";
    node.setAttribute("aria-label", label);
    node.addEventListener("click", action);
    return node;
  };
  const close = (restore = true) => {
    if (!current) return;
    const state = current;
    current = undefined;
    if (state.popup.open) state.popup.close();
    state.popup.remove();
    if (state.input.getAttribute("aria-controls") === state.popup.id) {
      if (state.controls === null) state.input.removeAttribute("aria-controls");
      else state.input.setAttribute("aria-controls", state.controls);
    }
    if (
      restore &&
      state.input.isConnected &&
      !state.input.matches(":disabled") &&
      !state.input.closest("[hidden], [inert]")
    )
      state.input.focus({ preventScroll: true });
  };
  const commit = (state, value) => {
    if (
      current !== state ||
      !state.input.isConnected ||
      state.input.matches(":disabled, [readonly]")
    )
      return;
    if (value && !valid(state.input, value)) return;
    state.input.value = value;
    state.input.dispatchEvent(new view.Event("input", { bubbles: true }));
    state.input.dispatchEvent(new view.Event("change", { bubbles: true }));
    close();
  };
  const timeValue = (state) => {
    if (
      !state.fields.every((input) => input.value !== "" && input.validity.valid)
    )
      return "";
    return state.fields
      .map((input) => {
        const [whole, fraction] = String(Number(input.value)).split(".");
        return whole.padStart(2, "0") + (fraction ? `.${fraction}` : "");
      })
      .join(":");
  };
  const candidate = (state) => {
    const time = timeValue(state);
    return time ? (state.kind === "time" ? time : `${state.date}T${time}`) : "";
  };
  const updateTime = (state) => {
    const value = candidate(state);
    state.apply.disabled = !valid(state.input, value);
    state.status.textContent = state.apply.disabled
      ? "Choose a time within the field's bounds and step."
      : "";
  };
  const focusDate = (state) => {
    const target = state.body.querySelector(
      state.mode === "month"
        ? `[data-month="${iso(state.cursor).slice(0, -3)}"]`
        : `[data-date="${iso(state.cursor)}"]`,
    );
    target?.focus({ preventScroll: true });
  };
  const render = (state, focus = false) => {
    if (current !== state || state.kind === "time") return;
    const year = state.cursor.getUTCFullYear();
    const month = state.cursor.getUTCMonth() + 1;
    const months = state.mode === "month";
    state.title.textContent = months
      ? String(year)
      : format(state.cursor, { month: "long", year: "numeric" });
    if (state.title.localName === "button")
      state.title.setAttribute(
        "aria-label",
        `${state.title.textContent}. Choose month and year`,
      );
    state.previous.setAttribute(
      "aria-label",
      months ? "Previous year" : "Previous month",
    );
    state.next.setAttribute("aria-label", months ? "Next year" : "Next month");
    state.previous.disabled = !iso(shiftMonth(state.cursor, months ? -12 : -1));
    state.next.disabled = !iso(shiftMonth(state.cursor, months ? 12 : 1));
    state.body.replaceChildren();
    if (months) {
      const grid = element("div", "meridian-picker-months");
      for (let index = 1; index <= 12; index++) {
        const date = civil(year, index, 1);
        const value = iso(date).slice(0, -3);
        const choice = button(
          format(date, { month: "short" }),
          format(date, { month: "long", year: "numeric" }),
          () => {
            if (state.kind === "month") commit(state, value);
            else {
              state.cursor = shiftMonth(state.cursor, index - month);
              state.mode = "day";
              render(state, true);
            }
          },
        );
        choice.dataset.month = value;
        choice.tabIndex = index === month ? 0 : -1;
        choice.setAttribute(
          "aria-pressed",
          String(state.date.startsWith(value)),
        );
        choice.setAttribute(
          "aria-disabled",
          String(
            !value || (state.kind === "month" && !valid(state.input, value)),
          ),
        );
        grid.append(choice);
      }
      state.body.append(grid);
    } else {
      const table = element("table", "meridian-picker-calendar");
      table.setAttribute("role", "grid");
      table.setAttribute("aria-label", state.title.textContent);
      const head = element("thead");
      const labels = element("tr");
      for (let index = 0; index < 7; index++) {
        const weekday = civil(2023, 1, 1 + ((firstDay + index) % 7));
        const cell = element("th", "", format(weekday, { weekday: "narrow" }));
        cell.scope = "col";
        cell.setAttribute("aria-label", format(weekday, { weekday: "long" }));
        labels.append(cell);
      }
      head.append(labels);
      const body = element("tbody");
      const dates = calendarDates(year, month, firstDay);
      for (let row = 0; row < dates.length; row += 7) {
        const cells = element("tr");
        for (const value of dates.slice(row, row + 7)) {
          const cell = element("td");
          cell.setAttribute("role", "gridcell");
          cell.setAttribute("aria-selected", String(value === state.date));
          if (value) {
            const date = parse(value);
            const choice = button(
              String(date.getUTCDate()),
              format(date, { dateStyle: "full" }),
              () => {
                if (!valid(state.input, value, state.kind === "datetime-local"))
                  return;
                if (state.kind === "date") commit(state, value);
                else {
                  state.date = value;
                  state.cursor = date;
                  render(state, true);
                  updateTime(state);
                }
              },
            );
            choice.dataset.date = value;
            choice.dataset.outside = String(date.getUTCMonth() + 1 !== month);
            choice.tabIndex = value === iso(state.cursor) ? 0 : -1;
            choice.setAttribute(
              "aria-disabled",
              String(
                !valid(state.input, value, state.kind === "datetime-local"),
              ),
            );
            if (value === iso(today()))
              choice.setAttribute("aria-current", "date");
            cell.append(choice);
          }
          cells.append(cell);
        }
        body.append(cells);
      }
      table.append(head, body);
      state.body.append(table);
    }
    positionOverlay(state.popup, state.input, view);
    if (focus) focusDate(state);
  };
  const open = (input) => {
    if (current?.input === input) return;
    close(false);
    input.focus({ preventScroll: true });
    const kind = input.getAttribute("type");
    let cursor = parse(input.value) ?? today();
    const minimum = parse(input.min);
    const maximum = parse(input.max);
    if (minimum && cursor < minimum) cursor = minimum;
    if (maximum && cursor > maximum) cursor = maximum;
    const popup = element("dialog", "meridian-popover meridian-picker-popup");
    popup.dir = view.getComputedStyle(input.parentElement).direction;
    popup.id = `${root.id}-date-picker`;
    popup.setAttribute(
      "aria-label",
      `${input.getAttribute("aria-label") || input.labels?.[0]?.textContent.trim() || "Date and time"} picker`,
    );
    const state = {
      input,
      popup,
      kind,
      cursor,
      mode: kind === "month" ? "month" : "day",
      date: input.value.split("T")[0],
      controls: input.getAttribute("aria-controls"),
      signature: signature(input),
      fields: [],
    };
    current = state;
    const header = element("div", "meridian-picker-header");
    state.previous = button("‹", "Previous month", () => {
      state.cursor = shiftMonth(
        state.cursor,
        state.mode === "month" ? -12 : -1,
      );
      render(state);
    });
    state.title =
      kind === "month" || kind === "time"
        ? element("span", "meridian-picker-title", "Time")
        : button(
            "",
            "Choose month and year",
            () => {
              state.mode = state.mode === "month" ? "day" : "month";
              render(state, true);
            },
            "meridian-picker-title",
          );
    state.title.setAttribute("aria-live", "polite");
    state.next = button("›", "Next month", () => {
      state.cursor = shiftMonth(state.cursor, state.mode === "month" ? 12 : 1);
      render(state);
    });
    if (kind === "time") header.append(state.title);
    else header.append(state.previous, state.title, state.next);
    state.body = element("div");
    popup.append(header, state.body);
    const actions = element("div", "meridian-picker-actions");
    actions.append(
      button("Clear", "Clear", () => commit(state, ""), "text-button"),
    );
    if (kind === "date" || kind === "month") {
      const value = kind === "month" ? iso(today()).slice(0, -3) : iso(today());
      const now = button(
        "Today",
        "Today",
        () => commit(state, value),
        "text-button",
      );
      now.disabled = !valid(input, value);
      actions.append(now);
    }
    actions.append(button("Close", "Close picker", () => close()));
    if (kind === "time" || kind === "datetime-local") {
      const clock = element(
        "fieldset",
        "meridian-fieldset meridian-picker-time",
      );
      clock.append(element("legend", "", "Time"));
      const parts = (
        kind === "time" ? input.value : input.value.split("T")[1] || ""
      ).split(":");
      const seconds =
        parts.length > 2 ||
        input.step === "any" ||
        (Number(input.step) > 0 && Number(input.step) % 60 !== 0);
      for (const [index, label] of [
        "Hours",
        "Minutes",
        ...(seconds ? ["Seconds"] : []),
      ].entries()) {
        const field = element("label");
        const control = element("input", "input");
        control.type = "number";
        control.min = "0";
        control.max = index === 0 ? "23" : index === 1 ? "59" : "59.999";
        control.step = index < 2 ? "1" : "any";
        control.value = parts[index] || "00";
        control.required = true;
        control.addEventListener("input", () => updateTime(state));
        field.append(element("span", "", label), control);
        clock.append(field);
        state.fields.push(control);
      }
      state.status = element("p", "meridian-picker-status");
      state.status.setAttribute("role", "status");
      state.apply = button(
        "Apply",
        "Apply",
        () => commit(state, candidate(state)),
        "primary-button",
      );
      actions.append(state.apply);
      popup.append(clock, state.status);
      if (!state.date || kind === "time") state.date = iso(cursor);
      updateTime(state);
    }
    popup.append(actions);
    popup.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (current === state) close();
    });
    popup.addEventListener("close", () => {
      if (current === state) close();
    });
    popup.addEventListener("click", (event) => {
      const bounds = popup.getBoundingClientRect();
      if (
        event.target === popup &&
        (event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom)
      )
        close();
    });
    popup.addEventListener("keydown", (event) => {
      if (event.isComposing || event.altKey || event.metaKey || event.ctrlKey)
        return;
      if (state.fields.includes(event.target) && event.key === "Enter") {
        event.preventDefault();
        if (!state.apply.disabled) commit(state, candidate(state));
        return;
      }
      if (!event.target.dataset.date && !event.target.dataset.month) return;
      state.cursor =
        parse(event.target.dataset.date || event.target.dataset.month) ??
        state.cursor;
      const rtl = view.getComputedStyle(popup).direction === "rtl";
      const months = state.mode === "month";
      const move = {
        ArrowLeft: rtl ? 1 : -1,
        ArrowRight: rtl ? -1 : 1,
        ArrowUp: months ? -3 : -7,
        ArrowDown: months ? 3 : 7,
      }[event.key];
      let next;
      if (move) {
        next = months
          ? shiftMonth(state.cursor, move)
          : civil(
              state.cursor.getUTCFullYear(),
              state.cursor.getUTCMonth() + 1,
              state.cursor.getUTCDate() + move,
            );
      } else if (event.key === "PageUp" || event.key === "PageDown") {
        next = shiftMonth(
          state.cursor,
          (months || event.shiftKey ? 12 : 1) *
            (event.key === "PageUp" ? -1 : 1),
        );
      } else if (event.key === "Home" || event.key === "End") {
        const offset = months
          ? state.cursor.getUTCMonth()
          : (state.cursor.getUTCDay() - firstDay + 7) % 7;
        next = months
          ? shiftMonth(state.cursor, (event.key === "Home" ? 0 : 11) - offset)
          : civil(
              state.cursor.getUTCFullYear(),
              state.cursor.getUTCMonth() + 1,
              state.cursor.getUTCDate() +
                (event.key === "Home" ? -offset : 6 - offset),
            );
      } else return;
      event.preventDefault();
      event.stopPropagation();
      if (iso(next)) {
        state.cursor = next;
        render(state, true);
      }
    });
    input.setAttribute("aria-controls", popup.id);
    (input.closest("dialog") ?? root).append(popup);
    render(state);
    popup.showModal();
    positionOverlay(popup, input, view);
    if (kind === "time") state.fields[0].focus({ preventScroll: true });
    else focusDate(state);
  };
  const target = (event) => {
    const input = event.target.closest?.("input[data-meridian-picker]");
    return owned(input) &&
      supported(input) &&
      !input.matches(":disabled, [readonly]")
      ? input
      : null;
  };
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (target(event) && event.button === 0) event.preventDefault();
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "click",
    (event) => {
      const input = target(event);
      if (input) {
        event.preventDefault();
        open(input);
      }
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const input = target(event);
      if (
        input &&
        !event.isComposing &&
        (event.key === "F4" || (event.altKey && event.key === "ArrowDown"))
      ) {
        event.preventDefault();
        open(input);
      }
    },
    { signal },
  );
  root.addEventListener("reset", () => close(false), { signal });
  const position = () => {
    if (current) positionOverlay(current.popup, current.input, view);
  };
  view.addEventListener("resize", position, { signal });
  doc.addEventListener("scroll", position, {
    signal,
    capture: true,
    passive: true,
  });
  signal.addEventListener(
    "abort",
    () => {
      close(false);
      for (const [input, added] of ready) {
        delete input.dataset.meridianPickerReady;
        if (added && input.getAttribute("aria-haspopup") === "dialog")
          input.removeAttribute("aria-haspopup");
      }
      ready.clear();
    },
    { once: true },
  );
  return () => {
    for (const input of root.querySelectorAll("input[data-meridian-picker]")) {
      if (!owned(input) || !supported(input) || ready.has(input)) continue;
      const added = !input.hasAttribute("aria-haspopup");
      if (added) input.setAttribute("aria-haspopup", "dialog");
      input.dataset.meridianPickerReady = "true";
      ready.set(input, added);
    }
    for (const [input, added] of ready) {
      if (
        input.isConnected &&
        owned(input) &&
        supported(input) &&
        input.hasAttribute("data-meridian-picker")
      )
        continue;
      delete input.dataset.meridianPickerReady;
      if (added && input.getAttribute("aria-haspopup") === "dialog")
        input.removeAttribute("aria-haspopup");
      ready.delete(input);
    }
    if (current) {
      const { input } = current;
      if (
        !input.isConnected ||
        !owned(input) ||
        !input.hasAttribute("data-meridian-picker") ||
        input.getAttribute("type") !== current.kind ||
        input.matches(":disabled, [readonly]") ||
        input.closest("[hidden], [inert], dialog:not([open])") ||
        !current.popup.isConnected
      )
        close(false);
      else if (current.signature !== signature(input)) {
        current.signature = signature(input);
        render(current);
        if (current.fields.length) updateTime(current);
      }
    }
  };
}
