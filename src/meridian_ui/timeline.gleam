import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/orientation.{type Orientation}

pub type Event(msg) {
  Event(
    label: String,
    datetime: String,
    time_label: String,
    children: List(Element(msg)),
  )
}

pub type Alignment {
  Start
  End
  Alternate
}

pub fn view(
  label: String,
  direction: Orientation,
  attrs: List(Attribute(msg)),
  events: List(Event(msg)),
) -> Element(msg) {
  view_with(
    label,
    direction,
    Start,
    attrs,
    events,
    fn(event) { h.div([], [h.h3([], [h.text(event.label)]), ..event.children]) },
    fn(event) {
      h.time([a.datetime(event.datetime)], [h.text(event.time_label)])
    },
    fn(_) { h.span([a.class("meridian-timeline-dot")], []) },
  )
}

/// Compose event content, opposite content and non-interactive markers.
/// Alignment is logical, so Start and End follow the document's direction.
pub fn view_with(
  label: String,
  direction: Orientation,
  alignment: Alignment,
  attrs: List(Attribute(msg)),
  events: List(event),
  render: fn(event) -> Element(msg),
  opposite: fn(event) -> Element(msg),
  marker: fn(event) -> Element(msg),
) -> Element(msg) {
  h.ol(
    [
      a.class("meridian-timeline"),
      a.role("list"),
      a.aria_label(label),
      a.data("orientation", orientation.name(direction)),
      a.data("alignment", case alignment {
        Start -> "start"
        End -> "end"
        Alternate -> "alternate"
      }),
      ..attrs
    ],
    list.map(events, fn(event) {
      h.li([], [
        h.div([a.class("meridian-timeline-opposite")], [opposite(event)]),
        h.div([a.class("meridian-timeline-separator"), a.aria_hidden(True)], [
          marker(event),
        ]),
        h.div([a.class("meridian-timeline-content")], [render(event)]),
      ])
    }),
  )
}
