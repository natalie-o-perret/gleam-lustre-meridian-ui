import {
  Calendar,
  DateTime,
  dayGrid,
  timeGrid,
  list,
  interaction,
  recurrence,
  timeZone,
} from "./internal/vendor/calendar.mjs";
import {
  Month,
  Week,
  Day,
  Agenda,
  Never,
  Daily,
  Weekly,
  Monthly,
} from "./scheduler.mjs";
import { mountEngine } from "./engine_mount_ffi.mjs";

export function error(config) {
  try {
    if (!["local", "UTC"].includes(config.time_zone))
      new Intl.DateTimeFormat("en", { timeZone: config.time_zone });
    const parse = (value) =>
      DateTime.fromISO(value, {
        zone: config.time_zone === "local" ? undefined : config.time_zone,
      });
    if (!parse(config.date).isValid) return "Invalid calendar date";
    const ids = new Set();
    for (const event of config.events) {
      if (!event.id || ids.has(event.id))
        return "Calendar events need unique non-empty IDs";
      ids.add(event.id);
      if (
        !event.title.trim() ||
        !parse(event.start).isValid ||
        (event.end &&
          (!parse(event.end).isValid ||
            parse(event.end).toMillis() <= parse(event.start).toMillis()))
      )
        return "An event needs a title and an end after its start";
      const rule = event.recurrence;
      if (
        !(rule instanceof Never) &&
        (!Number.isInteger(rule.interval) || rule.interval < 1)
      )
        return "Recurrence intervals must be positive integers";
      if (
        rule instanceof Weekly &&
        (![...rule.weekdays].length ||
          [...rule.weekdays].some((day) => day < 0 || day > 6))
      )
        return "Weekly recurrence needs weekdays from Monday 0 to Sunday 6";
    }
    return "";
  } catch {
    return "Invalid calendar time zone";
  }
}

export function encode(config) {
  const views = [
    [Month, "dayGridMonth"],
    [Week, "timeGridWeek"],
    [Day, "timeGridDay"],
    [Agenda, "listWeek"],
  ];
  if (!["local", "UTC"].includes(config.time_zone))
    new Intl.DateTimeFormat("en", { timeZone: config.time_zone });
  return JSON.stringify({
    initialView: views.find(([Kind]) => config.view instanceof Kind)[1],
    initialDate: config.date,
    timeZone: config.time_zone,
    events: [...config.events].map((event) => {
      const result = {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end || undefined,
        allDay: event.all_day,
        editable: event.editable,
        interactive: true,
      };
      if (!(event.recurrence instanceof Never)) {
        const rule = event.recurrence;
        const frequency =
          rule instanceof Daily
            ? "daily"
            : rule instanceof Weekly
              ? "weekly"
              : "monthly";
        result.rrule = {
          freq: frequency,
          interval: Math.max(1, rule.interval),
          dtstart: event.start,
          ...(rule instanceof Weekly
            ? {
                byweekday: [...rule.weekdays].filter(
                  (day) => day >= 0 && day <= 6,
                ),
              }
            : {}),
        };
        if (event.end && !event.all_day)
          result.duration =
            DateTime.fromISO(event.end, {
              zone: config.time_zone === "local" ? undefined : config.time_zone,
            }).toMillis() -
            DateTime.fromISO(event.start, {
              zone: config.time_zone === "local" ? undefined : config.time_zone,
            }).toMillis();
        delete result.start;
        delete result.end;
      }
      return result;
    }),
  });
}

export function mount(id) {
  return mountEngine(id, "data-scheduler", (element, view) => {
    const labelCells = () => {
      for (const cell of element.querySelectorAll(
        '[role="gridcell"][data-date]',
      )) {
        cell.removeAttribute("aria-labelledby");
        cell.removeAttribute("aria-label");
      }
    };
    const emit = (name, detail) =>
      element.dispatchEvent(
        new view.CustomEvent(name, { bubbles: true, detail }),
      );
    const changed = (info) => {
      const detail = {
        id: info.event.id,
        start: info.event.startStr,
        end: info.event.endStr,
        allDay: info.event.allDay,
      };
      info.revert();
      emit("meridian-calendar-change", detail);
    };
    const calendar = new Calendar(element, {
      plugins: [dayGrid, timeGrid, list, interaction, recurrence, timeZone],
      initialView: "dayGridMonth",
      height: "auto",
      buttonIcons: false,
      buttonText: { prev: "Previous", next: "Next" },
      eventMinHeight: 28,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      },
      eventClick: (info) =>
        emit("meridian-calendar-select", { id: info.event.id }),
      dateClick: (info) =>
        emit("meridian-calendar-pick", { date: info.dateStr }),
      eventDrop: changed,
      eventResize: changed,
      eventContent(info) {
        const content = element.ownerDocument.createElement("span");
        content.className = "fc-event-title";
        content.textContent =
          (info.view.type.startsWith("list") || !info.timeText
            ? ""
            : info.timeText + " ") + info.event.title;
        return { domNodes: [content] };
      },
      datesSet: () => view.queueMicrotask(labelCells),
      eventsSet: () => view.queueMicrotask(labelCells),
      eventDidMount(info) {
        const control = info.el.matches("tr")
          ? info.el.querySelector(".fc-list-event-title a")
          : info.el;
        if (!control) return;
        control.tabIndex = 0;
        control.setAttribute("role", "button");
        control.setAttribute(
          "aria-label",
          `${info.timeText ? info.timeText + " " : ""}${info.event.title}: ${info.event.startStr}`,
        );
        control.dataset.calendarEvent = info.event.id;
      },
    });
    const keydown = (event) => {
      const control = event.target.closest?.("[data-calendar-event]");
      if (control && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        emit("meridian-calendar-select", { id: control.dataset.calendarEvent });
      }
    };
    element.addEventListener("keydown", keydown);
    let previous = {};
    calendar.render();
    return {
      update(config, theme, direction) {
        calendar.batchRendering(() => {
          calendar.setOption("direction", direction);
          calendar.setOption("timeZone", config.timeZone);
          if (config.initialView !== previous.initialView)
            calendar.changeView(config.initialView);
          if (config.initialDate !== previous.initialDate)
            calendar.gotoDate(config.initialDate);
          calendar.removeAllEventSources();
          calendar.addEventSource(config.events);
        });
        previous = config;
      },
      resize() {
        calendar.updateSize();
      },
      destroy() {
        element.removeEventListener("keydown", keydown);
        calendar.destroy();
      },
    };
  });
}
