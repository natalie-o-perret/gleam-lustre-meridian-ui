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

pub fn update(value: #(String, String), action: Action) -> #(String, String) {
  case action {
    Start(start) -> #(start, value.1)
    End(end) -> #(value.0, end)
  }
}

/// Values stay native ISO date strings. The browser owns locale display and its calendar.
pub fn view(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([a.type_("date"), ..attrs])
}

/// Zone-less local date/time, not an instant. The application chooses the time zone.
pub fn date_time(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([a.type_("datetime-local"), ..attrs])
}

pub fn time(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([a.type_("time"), ..attrs])
}

pub fn month(attrs: List(Attribute(msg))) -> Element(msg) {
  field.input([a.type_("month"), ..attrs])
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
  fieldset.view(label, [a.class("meridian-date-range"), ..attrs], [
    field.fluid([a.class("meridian-date-range-fields")], [
      h.label([], [
        h.span([], [h.text("Start date")]),
        view([
          a.name(name <> "-start"),
          a.value(start),
          a.max(end),
          a.required(required),
          event.on_input(fn(value) { on_action(Start(value)) }),
        ]),
      ]),
      h.label([], [
        h.span([], [h.text("End date")]),
        view([
          a.name(name <> "-end"),
          a.value(end),
          a.min(start),
          a.required(required),
          event.on_input(fn(value) { on_action(End(value)) }),
        ]),
      ]),
    ]),
  ])
}
