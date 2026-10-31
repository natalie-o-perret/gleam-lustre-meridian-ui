import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// A labelled, keyboard-focusable native scroller. Set its size with ordinary CSS.
pub fn view(
  label: String,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-scroll-area"),
      a.role("region"),
      a.aria_label(label),
      a.tabindex(0),
      ..attrs
    ],
    children,
  )
}
