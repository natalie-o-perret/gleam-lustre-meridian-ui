import {
  positionOverlay,
  watchViewport,
  preserveScroll,
} from "./overlays_ffi.mjs";

export function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function validTimeZone(zone) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

export function timeZones() {
  return [
    ...new Set([
      localTimeZone(),
      "UTC",
      ...(Intl.supportedValuesOf?.("timeZone") ?? []),
    ]),
  ].sort();
}

export function nowValue(kind, zone, step, base = "", timestamp = Date.now()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA-u-ca-iso8601", {
      timeZone: zone || localTimeZone(),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(timestamp)
      .map((part) => [part.type, part.value]),
  );
  let value = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${String(new Date(timestamp).getUTCMilliseconds()).padStart(3, "0")}`;
  if (kind === "time") value = `1970-01-01T${value.slice(11)}`;
  let milliseconds = Date.parse(`${value}Z`);
  const interval = Number(step) * 1000;
  if (Number.isFinite(interval) && interval > 0) {
    const origin = Date.parse(
      `${kind === "time" ? `1970-01-01T${base || "00:00:00"}` : base || "1970-01-01T00:00:00"}Z`,
    );
    const offset = Number.isFinite(origin) ? origin : 0;
    milliseconds =
      offset + Math.round((milliseconds - offset) / interval) * interval;
  }
  const result = new Date(milliseconds)
    .toISOString()
    .replace(/\.000Z$/, "")
    .replace(/Z$/, "");
  return kind === "time" ? result.slice(11) : result;
}

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

function valid(input, value, dateOnly = false, bounds = {}) {
  if (!value) return false;
  const kind = input.getAttribute("type");
  const probe = input.cloneNode(false);
  Object.assign(probe, bounds);
  if (dateOnly) {
    probe.type = "date";
    probe.min = probe.min.split("T")[0];
    probe.max = probe.max.split("T")[0];
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
    JSON.stringify([
      input.value,
      input.min,
      input.max,
      input.step,
      input.dataset.meridianTimeZone,
    ]);
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
    state.inputs.forEach((input, index) => {
      if (input.getAttribute("aria-controls") !== state.popup.id) return;
      if (state.controls[index] === null)
        input.removeAttribute("aria-controls");
      else input.setAttribute("aria-controls", state.controls[index]);
    });
    if (
      restore &&
      state.input.isConnected &&
      !state.input.matches(":disabled") &&
      !state.input.closest("[hidden], [inert]")
    )
      state.input.focus({ preventScroll: true });
  };
  const validValues = (state, values) =>
    values.every((value, index) =>
      valid(
        state.inputs[index],
        value,
        false,
        state.inputs.length === 1
          ? {}
          : index === 0
            ? { max: values[1] }
            : { min: values[0] },
      ),
    );
  const commit = (state, values) => {
    if (
      current !== state ||
      state.inputs.some(
        (input) => !input.isConnected || input.matches(":disabled, [readonly]"),
      )
    )
      return;
    if (!values.every((value) => value === "") && !validValues(state, values))
      return;
    state.inputs.forEach((input, index) => (input.value = values[index]));
    if (state.inputs.length === 2) {
      state.inputs[0].max = values[1];
      state.inputs[1].min = values[0];
    }
    close();
    for (const input of state.inputs) {
      if (state.zone)
        input.dispatchEvent(
          new view.CustomEvent("meridian-time-zone", {
            bubbles: true,
            detail: state.zone,
          }),
        );
      input.dispatchEvent(new view.Event("input", { bubbles: true }));
      input.dispatchEvent(new view.Event("change", { bubbles: true }));
    }
  };
  const timeValue = (state, index = state.active) => {
    const fields = state.times[index];
    if (!fields?.every((input) => input.value !== "" && input.validity.valid))
      return "";
    const time = fields
      .slice(0, 3)
      .map((input) => input.value.padStart(2, "0"))
      .join(":");
    const fraction = Number(fields[3]?.value || 0);
    return (
      time +
      (fraction
        ? `.${String(fraction).padStart(3, "0").replace(/0+$/, "")}`
        : "")
    );
  };
  const candidate = (state, index = state.active) => {
    if (state.kind === "date" || state.kind === "month")
      return state.dates[index];
    const time = timeValue(state, index);
    return time
      ? state.kind === "time"
        ? time
        : state.dates[index]
          ? `${state.dates[index]}T${time}`
          : ""
      : "";
  };
  const updateSelection = (state) => {
    const values = state.inputs.map((_, index) => candidate(state, index));
    state.apply.disabled = !validValues(state, values);
    state.status.classList.toggle("sr-only", !state.apply.disabled);
    state.status.textContent = state.apply.disabled
      ? state.inputs.length === 2
        ? !state.dates[0]
          ? "Choose a start date."
          : !state.dates[1]
            ? "Choose an end date."
            : "Choose valid times and bounds. The end must not precede the start."
        : "Choose a time within the field's bounds and step."
      : state.inputs.length === 2
        ? "Range ready. Apply to confirm."
        : "";
    state.endpoints?.forEach((button, index) => {
      const date = parse(state.dates[index]);
      const time =
        state.kind === "datetime-local" ? timeValue(state, index) : "";
      button.textContent = `${index === 0 ? "Start" : "End"}: ${date ? format(date, { dateStyle: "medium" }) : "Choose date"}${time ? ` ${time}` : ""}`;
      button.setAttribute("aria-pressed", String(state.active === index));
    });
    state.clocks.forEach(
      (clock, index) => (clock.hidden = index !== state.active),
    );
  };
  const validDate = (state, value) =>
    valid(
      state.inputs[state.active],
      value,
      state.kind === "datetime-local",
      state.inputs.length === 1
        ? {}
        : state.active === 0
          ? { max: "" }
          : { min: state.dates[0] },
    );
  const focusDate = (state) => {
    const target = state.body.querySelector(
      state.mode === "year"
        ? `[data-year="${state.cursor.getUTCFullYear()}"]`
        : state.mode === "month"
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
    const years = state.mode === "year";
    const firstYear = Math.max(1, Math.floor(year / 10) * 10);
    const period = years ? 120 : months ? 12 : 1;
    state.title.textContent = years
      ? `${firstYear}-${Math.min(9999, firstYear + 9)}`
      : months
        ? String(year)
        : format(state.cursor, { month: "long", year: "numeric" });
    if (state.title.localName === "button") {
      state.title.disabled = years;
      state.title.setAttribute(
        "aria-label",
        `${state.title.textContent}. ${months || years ? "Choose year" : "Choose month and year"}`,
      );
    }
    state.previous.setAttribute(
      "aria-label",
      years
        ? "Previous year range"
        : months
          ? "Previous year"
          : "Previous month",
    );
    state.next.setAttribute(
      "aria-label",
      years ? "Next year range" : months ? "Next year" : "Next month",
    );
    state.previous.disabled = !iso(shiftMonth(state.cursor, -period));
    state.next.disabled = !iso(shiftMonth(state.cursor, period));
    state.body.replaceChildren();
    if (years) {
      const grid = element(
        "div",
        "meridian-picker-months meridian-picker-years",
      );
      for (
        let value = Math.max(1, firstYear - 1);
        value <= Math.min(9999, firstYear + 10);
        value++
      ) {
        const choice = button(String(value), String(value), () => {
          state.cursor = shiftMonth(state.cursor, (value - year) * 12);
          state.mode = "month";
          render(state, true);
        });
        choice.dataset.year = String(value);
        choice.tabIndex = value === year ? 0 : -1;
        choice.setAttribute(
          "aria-pressed",
          String(parse(state.dates[state.active])?.getUTCFullYear() === value),
        );
        grid.append(choice);
      }
      state.body.append(grid);
    } else if (months) {
      const grid = element("div", "meridian-picker-months");
      for (let index = 1; index <= 12; index++) {
        const date = civil(year, index, 1);
        const value = iso(date).slice(0, -3);
        const choice = button(
          format(date, { month: "short" }),
          format(date, { month: "long", year: "numeric" }),
          () => {
            if (state.kind === "month") commit(state, [value]);
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
          String(state.dates[state.active].startsWith(value)),
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
      if (state.inputs.length === 2)
        table.setAttribute("aria-multiselectable", "true");
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
      const lastDay = dates.indexOf(iso(civil(year, month + 1, 0)));
      dates.length = Math.ceil((lastDay + 1) / 7) * 7;
      const start = parse(state.dates[0]);
      const end = parse(state.dates[1] ?? "");
      for (let row = 0; row < dates.length; row += 7) {
        const cells = element("tr");
        for (const value of dates.slice(row, row + 7)) {
          const cell = element("td");
          cell.setAttribute("role", "gridcell");
          if (value) {
            const date = parse(value);
            const selected =
              state.inputs.length === 2
                ? value === state.dates[0] ||
                  value === state.dates[1] ||
                  (start && end && date >= start && date <= end)
                : value === state.dates[0];
            cell.setAttribute("aria-selected", String(Boolean(selected)));
            if (state.inputs.length === 2 && selected)
              cell.dataset.range =
                value === state.dates[0]
                  ? "start"
                  : value === state.dates[1]
                    ? "end"
                    : "inside";
            const choice = button(
              String(date.getUTCDate()),
              format(date, { dateStyle: "full" }),
              () => {
                if (!validDate(state, value)) return;
                if (state.kind === "date" && state.inputs.length === 1)
                  commit(state, [value]);
                else {
                  state.dates[state.active] = value;
                  if (state.inputs.length === 2 && state.active === 0) {
                    state.dates[1] = "";
                    state.active = 1;
                  }
                  state.cursor = date;
                  render(state, true);
                }
              },
            );
            choice.dataset.date = value;
            choice.dataset.outside = String(date.getUTCMonth() + 1 !== month);
            choice.tabIndex = value === iso(state.cursor) ? 0 : -1;
            choice.setAttribute(
              "aria-disabled",
              String(!validDate(state, value)),
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
    if (state.apply) updateSelection(state);
    if (state.popup.open) positionOverlay(state.popup, state.input, view);
    if (focus) focusDate(state);
  };
  const open = (input) => {
    if (current?.input === input) return;
    close(false);
    input.focus({ preventScroll: true });
    const kind = input.getAttribute("type");
    const group = input.closest("[data-meridian-picker-range]");
    const inputs = group
      ? ["start", "end"].map((end) =>
          group.querySelector(`input[data-meridian-range="${end}"]`),
        )
      : [input];
    if (
      !inputs.includes(input) ||
      inputs.some(
        (field) =>
          !owned(field) ||
          field.getAttribute("type") !== kind ||
          field.matches(":disabled, [readonly]"),
      )
    )
      return;
    let cursor = parse(input.value) ?? today();
    const minimum = parse(input.min);
    const maximum = parse(input.max);
    if (minimum && cursor < minimum) cursor = minimum;
    if (maximum && cursor > maximum) cursor = maximum;
    const popup = element("dialog", "meridian-popover meridian-picker-popup");
    popup.dataset.kind = kind;
    popup.dir = view.getComputedStyle(input.parentElement).direction;
    popup.id = `${root.id}-date-picker`;
    popup.setAttribute(
      "aria-label",
      `${group?.querySelector("legend")?.textContent.trim() || input.getAttribute("aria-label") || input.labels?.[0]?.textContent.trim() || "Date and time"} picker`,
    );
    const state = {
      input,
      inputs,
      group,
      active: inputs.indexOf(input),
      popup,
      kind,
      cursor,
      mode: kind === "month" ? "month" : "day",
      dates: inputs.map((field) => field.value.split("T")[0]),
      values: inputs.map((field) => field.value),
      controls: inputs.map((field) => field.getAttribute("aria-controls")),
      signature: inputs.map(signature).join("|"),
      times: [],
      clocks: [],
      zone: input.dataset.meridianTimeZone,
    };
    current = state;
    if (inputs.length === 2) {
      const endpoints = element("div", "meridian-picker-range");
      endpoints.setAttribute("role", "group");
      endpoints.setAttribute("aria-label", "Range endpoint");
      state.endpoints = inputs.map((_, index) => {
        const name = `${index === 0 ? "Start" : "End"} date${kind === "datetime-local" ? " and time" : ""}`;
        const control = button("", name, () => {
          state.active = index;
          state.cursor = parse(state.dates[index]) ?? state.cursor;
          state.mode = "day";
          render(state);
        });
        control.dataset.rangeEndpoint = index === 0 ? "start" : "end";
        endpoints.append(control);
        return control;
      });
      popup.append(endpoints);
    }
    const header = element("div", "meridian-picker-header");
    state.previous = button("‹", "Previous month", () => {
      state.cursor = shiftMonth(
        state.cursor,
        state.mode === "year" ? -120 : state.mode === "month" ? -12 : -1,
      );
      render(state);
    });
    state.title =
      kind === "time"
        ? element("span", "meridian-picker-title", "Time")
        : button(
            "",
            "Choose month and year",
            () => {
              state.mode = state.mode === "day" ? "month" : "year";
              render(state, true);
            },
            "meridian-picker-title",
          );
    state.title.setAttribute("aria-live", "polite");
    state.next = button("›", "Next month", () => {
      state.cursor = shiftMonth(
        state.cursor,
        state.mode === "year" ? 120 : state.mode === "month" ? 12 : 1,
      );
      render(state);
    });
    if (kind === "time") header.append(state.title);
    else header.append(state.previous, state.title, state.next);
    state.body = element("div");
    state.body.hidden = kind === "time";
    const content = element("div", "meridian-picker-content");
    content.append(state.body);
    popup.append(header, content);
    const actions = element("div", "meridian-picker-actions");
    actions.append(
      button(
        "Clear",
        "Clear",
        () =>
          commit(
            state,
            inputs.map(() => ""),
          ),
        "text-button",
      ),
    );
    if (inputs.length === 1 && (kind === "date" || kind === "month")) {
      const value = kind === "month" ? iso(today()).slice(0, -3) : iso(today());
      const now = button(
        "Today",
        "Today",
        () => commit(state, [value]),
        "text-button",
      );
      now.disabled = !valid(input, value);
      actions.append(now);
    }
    if (kind === "time" || kind === "datetime-local") {
      actions.append(
        button(
          "Now",
          "Now",
          () => {
            const index = state.active;
            const field = inputs[index];
            const value = nowValue(
              kind,
              state.zone,
              field.step,
              field.min || field.getAttribute("value") || "",
            );
            const parts = (kind === "time" ? value : value.split("T")[1]).split(
              ":",
            );
            state.times[index].forEach((control, part) => {
              control.value =
                part < 3
                  ? parts[part].split(".")[0]
                  : String(
                      Number((parts[2].split(".")[1] || "").padEnd(3, "0")),
                    );
            });
            if (kind === "datetime-local") {
              state.dates[index] = value.split("T")[0];
              state.cursor = parse(state.dates[index]);
            }
            render(state);
            updateSelection(state);
          },
          "text-button",
        ),
      );
      for (const [endpoint, input] of inputs.entries()) {
        const clock = element(
          "fieldset",
          "meridian-fieldset meridian-picker-time",
        );
        clock.append(
          element(
            "legend",
            "",
            inputs.length === 2
              ? `${endpoint === 0 ? "Start" : "End"} time`
              : "Time",
          ),
        );
        const fields = [];
        const parts = (
          kind === "time" ? input.value : input.value.split("T")[1] || ""
        ).split(":");
        const fractional =
          input.step === "any" ||
          parts[2]?.includes(".") ||
          (Number(input.step) > 0 && Number(input.step) % 1 !== 0);
        for (const [index, label] of [
          "Hours",
          "Minutes",
          "Seconds",
          ...(fractional ? ["Milliseconds"] : []),
        ].entries()) {
          const field = element("label");
          const control = element(
            index < 3 ? "select" : "input",
            index < 3
              ? "meridian-listbox meridian-picker-clock-column"
              : "input",
          );
          if (index < 3) {
            control.size = 5;
            for (let value = 0; value < (index === 0 ? 24 : 60); value++) {
              const text = String(value).padStart(2, "0");
              const option = element("option", "", text);
              option.value = text;
              control.append(option);
            }
            control.value = (parts[index]?.split(".")[0] || "00").padStart(
              2,
              "0",
            );
          } else {
            control.type = "number";
            control.min = "0";
            control.max = "999";
            control.step = "1";
            control.value = String(
              Number((parts[2]?.split(".")[1] || "").padEnd(3, "0")),
            );
          }
          control.required = true;
          control.addEventListener("input", () => updateSelection(state));
          control.addEventListener("change", () => {
            if (!view.matchMedia("(prefers-reduced-motion: reduce)").matches)
              control.animate(
                [{ transform: "scale(.97)" }, { transform: "scale(1)" }],
                { duration: 140, easing: "ease-out" },
              );
          });
          field.append(element("span", "", label), control);
          clock.append(field);
          fields.push(control);
        }
        state.times.push(fields);
        state.clocks.push(clock);
        content.append(clock);
        if ((!state.dates[endpoint] && inputs.length === 1) || kind === "time")
          state.dates[endpoint] = iso(cursor);
      }
      if (state.zone) {
        const label = element("label", "meridian-picker-zone");
        const select = element("select", "input");
        for (const zone of new Set([state.zone, ...timeZones()])) {
          const option = element("option", "", zone);
          option.value = zone;
          select.append(option);
        }
        select.value = state.zone;
        select.addEventListener("change", () => {
          state.zone = select.value;
        });
        label.append(element("span", "", "Time zone"), select);
        content.append(label);
      }
    }
    actions.append(button("Close", "Close picker", () => close()));
    if (inputs.length === 2 || kind === "time" || kind === "datetime-local") {
      state.status = element("p", "meridian-picker-status");
      state.status.setAttribute("role", "status");
      state.apply = button(
        "Apply",
        "Apply",
        () =>
          commit(
            state,
            inputs.map((_, index) => candidate(state, index)),
          ),
        "primary-button",
      );
      actions.append(state.apply);
      popup.append(state.status);
      updateSelection(state);
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
      if (
        state.times.some((fields) => fields.includes(event.target)) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        if (!state.apply.disabled)
          commit(
            state,
            inputs.map((_, index) => candidate(state, index)),
          );
        return;
      }
      if (
        !event.target.dataset.date &&
        !event.target.dataset.month &&
        !event.target.dataset.year
      )
        return;
      state.cursor = event.target.dataset.year
        ? shiftMonth(
            state.cursor,
            (Number(event.target.dataset.year) -
              state.cursor.getUTCFullYear()) *
              12,
          )
        : (parse(event.target.dataset.date || event.target.dataset.month) ??
          state.cursor);
      const rtl = view.getComputedStyle(popup).direction === "rtl";
      const months = state.mode === "month";
      const years = state.mode === "year";
      const move = {
        ArrowLeft: rtl ? 1 : -1,
        ArrowRight: rtl ? -1 : 1,
        ArrowUp: months || years ? -3 : -7,
        ArrowDown: months || years ? 3 : 7,
      }[event.key];
      let next;
      if (move) {
        next = years
          ? shiftMonth(state.cursor, move * 12)
          : months
            ? shiftMonth(state.cursor, move)
            : civil(
                state.cursor.getUTCFullYear(),
                state.cursor.getUTCMonth() + 1,
                state.cursor.getUTCDate() + move,
              );
      } else if (event.key === "PageUp" || event.key === "PageDown") {
        next = shiftMonth(
          state.cursor,
          (years ? 120 : months || event.shiftKey ? 12 : 1) *
            (event.key === "PageUp" ? -1 : 1),
        );
      } else if (event.key === "Home" || event.key === "End") {
        const offset = years
          ? state.cursor.getUTCFullYear() -
            Math.max(1, Math.floor(state.cursor.getUTCFullYear() / 10) * 10)
          : months
            ? state.cursor.getUTCMonth()
            : (state.cursor.getUTCDay() - firstDay + 7) % 7;
        next = years
          ? shiftMonth(
              state.cursor,
              ((event.key === "Home" ? 0 : 9) - offset) * 12,
            )
          : months
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
    for (const field of inputs) field.setAttribute("aria-controls", popup.id);
    (input.closest("dialog") ?? root).append(popup);
    render(state);
    preserveScroll(view, () => popup.showModal());
    positionOverlay(popup, input, view);
    if (kind === "time") state.times[0][0].focus({ preventScroll: true });
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
  watchViewport(view, position, signal);
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
      const { inputs, group } = current;
      if (
        inputs.some(
          (field, index) =>
            !field.isConnected ||
            !owned(field) ||
            !field.hasAttribute("data-meridian-picker") ||
            field.getAttribute("type") !== current.kind ||
            field.matches(":disabled, [readonly]") ||
            field.closest("[hidden], [inert], dialog:not([open])") ||
            (group &&
              (field.closest("[data-meridian-picker-range]") !== group ||
                field.dataset.meridianRange !== ["start", "end"][index])),
        ) ||
        !current.popup.isConnected
      )
        close(false);
      else if (current.signature !== inputs.map(signature).join("|")) {
        current.signature = inputs.map(signature).join("|");
        if (
          inputs.some((field, index) => field.value !== current.values[index])
        ) {
          current.values = inputs.map((field) => field.value);
          current.dates = inputs.map((field) => field.value.split("T")[0]);
          current.times.forEach((fields, index) => {
            const parts = (
              current.kind === "time"
                ? inputs[index].value
                : inputs[index].value.split("T")[1] || ""
            ).split(":");
            fields.forEach((field, part) => {
              field.value =
                part < 3
                  ? (parts[part]?.split(".")[0] || "00").padStart(2, "0")
                  : String(
                      Number((parts[2]?.split(".")[1] || "").padEnd(3, "0")),
                    );
            });
          });
        }
        render(current);
        if (current.apply) updateSelection(current);
      }
    }
  };
}
