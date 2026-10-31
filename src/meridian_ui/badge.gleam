import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub type Tone {
  Success
  Warning
  Danger
  Accent
}

pub fn view(
  tone: Tone,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  let colour = case tone {
    Success -> "badge-success"
    Warning -> "badge-warning"
    Danger -> "badge-danger"
    Accent -> "badge-accent"
  }
  h.span([a.class("badge " <> colour), ..attrs], children)
}

pub fn counter(
  label: String,
  count: Int,
  maximum: Int,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let count = int.max(count, 0)
  let maximum = int.max(maximum, 1)
  let display = case count > maximum {
    True -> int.to_string(maximum) <> "+"
    False -> int.to_string(count)
  }
  h.span([a.class("meridian-counter"), ..attrs], [
    h.span([a.aria_hidden(True)], [h.text(display)]),
    h.span([a.class("sr-only")], [h.text(label <> ": " <> int.to_string(count))]),
  ])
}

pub fn dot(label: String, attrs: List(Attribute(msg))) -> Element(msg) {
  h.span(
    [a.class("meridian-dot"), a.role("img"), a.aria_label(label), ..attrs],
    [],
  )
}
