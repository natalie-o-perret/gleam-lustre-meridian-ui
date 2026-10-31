import gleam/dynamic/decode
import gleam/list
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/date_picker
import meridian_ui/disclosure

pub type View {
  Month
  Week
  Day
  Agenda
}

pub type Recurrence {
  Never
  Daily(interval: Int)
  Weekly(interval: Int, weekdays: List(Int))
  Monthly(interval: Int)
}

pub type Event {
  Event(
    id: String,
    title: String,
    start: String,
    end: String,
    all_day: Bool,
    editable: Bool,
    recurrence: Recurrence,
  )
}

pub type Config {
  Config(view: View, date: String, time_zone: String, events: List(Event))
}

pub type Options {
  Options(
    first_day: Int,
    weekends: Bool,
    week_numbers: Bool,
    now_indicator: Bool,
    slot_duration: String,
    day_start: String,
    day_end: String,
    event_limit: Int,
    readonly: Bool,
  )
}

pub fn default_options() -> Options {
  Options(1, True, False, True, "00:30:00", "00:00:00", "24:00:00", 3, False)
}

pub type Change {
  Change(id: String, start: String, end: String, all_day: Bool)
}

pub type Action {
  Select(String)
  Pick(String)
  ChangeEvent(Change)
}

pub fn validate(config: Config) -> Result(Nil, String) {
  case config_error(config) {
    "" -> Ok(Nil)
    error -> Error(error)
  }
}

pub fn change(events: List(Event), change: Change) -> List(Event) {
  list.map(events, fn(event) {
    case event.id == change.id {
      True ->
        Event(
          ..event,
          start: change.start,
          end: change.end,
          all_day: change.all_day,
        )
      False -> event
    }
  })
}

/// Dates retain ISO offsets. All-day ends are exclusive. Use an IANA time zone,
/// `UTC` or `local`. Selection also exposes a native-button event list for editing.
pub fn view(
  id: String,
  label: String,
  config: Config,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view_with(id, label, config, default_options(), on_action, attrs)
}

pub fn view_with(
  id: String,
  label: String,
  config: Config,
  options: Options,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  case validate(config) {
    Ok(_) ->
      case options_error(options) {
        "" -> render(id, label, config, options, on_action, attrs)
        error -> h.p([a.role("alert")], [h.text(error)])
      }
    Error(error) -> h.p([a.role("alert")], [h.text(error)])
  }
}

fn render(
  id: String,
  label: String,
  config: Config,
  options: Options,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.section([a.class("meridian-scheduler"), a.aria_label(label), ..attrs], [
    h.div(
      [
        a.id(id),
        a.data("scheduler", encode_with(config, options)),
        event.on(
          "meridian-calendar-select",
          decode.at(["detail", "id"], decode.string)
            |> decode.map(fn(id) { on_action(Select(id)) }),
        )
          |> event.stop_propagation,
        event.on(
          "meridian-calendar-pick",
          decode.at(["detail", "date"], decode.string)
            |> decode.map(fn(date) { on_action(Pick(date)) }),
        )
          |> event.stop_propagation,
        event.on(
          "meridian-calendar-change",
          decode.at(["detail"], {
            use id <- decode.field("id", decode.string)
            use start <- decode.field("start", decode.string)
            use end <- decode.field("end", decode.string)
            use all_day <- decode.field("allDay", decode.bool)
            decode.success(
              on_action(ChangeEvent(Change(id, start, end, all_day))),
            )
          }),
        )
          |> event.stop_propagation,
      ],
      [],
    ),
    h.label([], [
      h.span([], [h.text("Choose calendar date")]),
      date_picker.view([
        a.value(string.slice(config.date, 0, 10)),
        event.on_input(fn(date) { on_action(Pick(date)) }),
      ]),
    ]),
    h.details([], [
      disclosure.summary("Event list", []),
      h.ul(
        [],
        list.map(config.events, fn(item) {
          h.li([], [
            button.text([event.on_click(on_action(Select(item.id)))], [
              h.text(item.title <> ": " <> item.start <> " to " <> item.end),
            ]),
          ])
        }),
      ),
    ]),
  ])
}

@external(javascript, "./scheduler_ffi.mjs", "encodeWith")
fn encode_with(config: Config, options: Options) -> String

@external(javascript, "./scheduler_ffi.mjs", "optionsError")
fn options_error(options: Options) -> String

@external(javascript, "./scheduler_ffi.mjs", "error")
fn config_error(config: Config) -> String

@external(javascript, "./scheduler_ffi.mjs", "mount")
pub fn mount(id: String) -> fn() -> Nil
