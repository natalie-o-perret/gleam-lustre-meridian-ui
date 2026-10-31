import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/orientation.{type Orientation}

/// Mark each toolbar control with `item()`. Native text editing keys stay native.
pub fn view(
  label: String,
  direction: Orientation,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-toolbar"),
      a.role("toolbar"),
      a.aria_label(label),
      a.aria_orientation(orientation.name(direction)),
      a.data("meridian-keys", "toolbar"),
      ..attrs
    ],
    children,
  )
}

pub fn item() -> Attribute(msg) {
  a.data("meridian-item", "true")
}

pub fn group(
  label: String,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-toolbar-group"),
      a.role("group"),
      a.aria_label(label),
      ..attrs
    ],
    children,
  )
}
