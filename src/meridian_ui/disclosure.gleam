import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/icon

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
    label_content(label),
  )
}

/// Native details keep keyboard behaviour and expansion without a mount.
pub fn summary(label: String, attrs: List(Attribute(msg))) -> Element(msg) {
  h.summary(
    [a.class("meridian-disclosure-toggle"), ..attrs],
    label_content(label),
  )
}

fn label_content(label: String) -> List(Element(msg)) {
  [
    icon.view(icon.ChevronRight, [a.class("meridian-disclosure-icon")]),
    h.span([], [h.text(label)]),
  ]
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
