import gleam/dynamic/decode
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/field
import meridian_ui/fieldset

pub type Action {
  Start(String)
  End(String)
}

pub type ZonedValue {
  ZonedValue(value: String, zone: String)
}

pub type ZonedAction {
  Value(String)
  Zone(String)
}

pub fn update_zoned(model: ZonedValue, action: ZonedAction) -> ZonedValue {
  case action {
    Value(value) -> ZonedValue(..model, value: value)
    Zone(zone) -> ZonedValue(..model, zone: zone)
  }
}

/// Browser/system IANA timezone, independent of the interface language.
@external(javascript, "./date_picker_ffi.mjs", "localTimeZone")
pub fn local_time_zone() -> String

/// Zone changes keep the clock time. Forms submit `name` and `name-zone` separately.
/// An empty zone uses the browser timezone. The picker commits zone edits on Apply.
pub fn zoned_time(
  label: String,
  name: String,
  model: ZonedValue,
  on_action: fn(ZonedAction) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  zoned(label, name, model, on_action, attrs, False)
}

pub fn zoned_date_time(
  label: String,
  name: String,
  model: ZonedValue,
  on_action: fn(ZonedAction) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  zoned(label, name, model, on_action, attrs, True)
}

fn zoned(
  label: String,
  name: String,
  model: ZonedValue,
  on_action: fn(ZonedAction) -> msg,
  attrs: List(Attribute(msg)),
  with_date: Bool,
) -> Element(msg) {
  let zone = case model.zone {
    "" -> local_time_zone()
    _ -> model.zone
  }
  case valid_zone(zone) {
    False ->
      h.p([a.role("alert")], [h.text("Choose a supported IANA time zone.")])
    True -> {
      let input = case with_date {
        True -> date_time
        False -> time
      }
      h.div([a.class("meridian-zoned-time")], [
        h.label([], [
          h.span([], [h.text(label)]),
          input([
            a.name(name),
            a.value(model.value),
            a.data("meridian-time-zone", zone),
            event.on_input(fn(value) { on_action(Value(value)) }),
            event.on(
              "meridian-time-zone",
              decode.at(["detail"], decode.string)
                |> decode.map(fn(zone) { on_action(Zone(zone)) }),
            )
              |> event.stop_propagation,
            ..attrs
          ]),
        ]),
        h.input([
          a.type_("hidden"),
          a.name(name <> "-zone"),
          a.value(zone),
          ..list.filter(attrs, fn(attr) { attr.name == "disabled" })
        ]),
        h.p([a.class("muted")], [h.text("Time zone: " <> zone)]),
      ])
    }
  }
}

@external(javascript, "./date_picker_ffi.mjs", "validTimeZone")
fn valid_zone(zone: String) -> Bool

pub fn update(value: #(String, String), action: Action) -> #(String, String) {
  case action {
    Start(start) -> #(start, value.1)
    End(end) -> #(value.0, end)
  }
}

/// Native ISO values and validation, with a Meridian calendar when interactions are mounted.
pub fn view(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([
    a.type_("date"),
    a.class("meridian-date-input"),
    a.data("meridian-picker", "date"),
    ..attrs
  ])
}

/// Zone-less local date/time, not an instant. The application chooses the time zone.
pub fn date_time(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([
    a.type_("datetime-local"),
    default_step(attrs),
    a.class("meridian-date-input"),
    a.data("meridian-picker", "datetime-local"),
    ..attrs
  ])
}

pub fn time(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([
    a.type_("time"),
    default_step(attrs),
    a.class("meridian-date-input"),
    a.data("meridian-picker", "time"),
    ..attrs
  ])
}

pub fn month(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([
    a.type_("month"),
    a.class("meridian-date-input"),
    a.data("meridian-picker", "month"),
    ..attrs
  ])
}

fn default_step(attrs: List(Attribute(msg))) -> Attribute(msg) {
  case list.any(attrs, fn(attr) { attr.name == "step" }) {
    True -> a.none()
    False -> a.step("1")
  }
}

pub fn range(
  label: String,
  name: String,
  start: String,
  end: String,
  required: Bool,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  range_view(label, name, start, end, required, on_action, attrs, False)
}

/// Select both local endpoints in one calendar, with time controls for each end.
pub fn date_time_range(
  label: String,
  name: String,
  start: String,
  end: String,
  required: Bool,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  range_view(label, name, start, end, required, on_action, attrs, True)
}

fn range_view(
  label: String,
  name: String,
  start: String,
  end: String,
  required: Bool,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  with_time: Bool,
) -> Element(msg) {
  let input = case with_time {
    True -> date_time
    False -> view
  }
  let suffix = case with_time {
    True -> " date and time"
    False -> " date"
  }
  fieldset.view(
    label,
    [
      a.class("meridian-date-range"),
      a.data("meridian-picker-range", ""),
      ..attrs
    ],
    [
      field.fluid([a.class("meridian-date-range-fields")], [
        h.label([], [
          h.span([], [h.text("Start" <> suffix)]),
          input([
            a.data("meridian-range", "start"),
            a.name(name <> "-start"),
            a.value(start),
            a.max(end),
            a.required(required),
            event.on_input(fn(value) { on_action(Start(value)) }),
          ]),
        ]),
        h.label([], [
          h.span([], [h.text("End" <> suffix)]),
          input([
            a.data("meridian-range", "end"),
            a.name(name <> "-end"),
            a.value(end),
            a.min(start),
            a.required(required),
            event.on_input(fn(value) { on_action(End(value)) }),
          ]),
        ]),
      ]),
    ],
  )
}
