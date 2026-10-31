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

pub fn view(
  label: String,
  direction: Orientation,
  attrs: List(Attribute(msg)),
  events: List(Event(msg)),
) -> Element(msg) {
  h.ol(
    [
      a.class("meridian-timeline"),
      a.aria_label(label),
      a.data("orientation", orientation.name(direction)),
      ..attrs
    ],
    list.map(events, fn(event) {
      h.li([], [
        h.time([a.datetime(event.datetime)], [h.text(event.time_label)]),
        h.h3([], [h.text(event.label)]),
        h.div([], event.children),
      ])
    }),
  )
}
