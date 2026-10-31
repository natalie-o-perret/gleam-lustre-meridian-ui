import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/button

/// The ID prefix must be unique. Use the same prefix for the associated content.
pub fn toggle(
  id: String,
  label: String,
  expanded: Bool,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  button.view(
    [
      a.id(id <> "-toggle"),
      a.class("meridian-disclosure-toggle"),
      a.aria_controls(id <> "-content"),
      a.aria_expanded(expanded),
      ..attrs
    ],
    [
      h.span([a.class("meridian-disclosure-icon"), a.aria_hidden(True)], []),
      h.span([], [h.text(label)]),
    ],
  )
}

pub fn content(
  id: String,
  expanded: Bool,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.id(id <> "-content"),
      a.role("region"),
      a.aria_labelledby(id <> "-toggle"),
      a.hidden(!expanded),
      ..attrs
    ],
    children,
  )
}
