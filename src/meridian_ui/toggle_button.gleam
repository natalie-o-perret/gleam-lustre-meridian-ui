import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import meridian_ui/button

/// Keep the label stable. The caller updates `pressed` through native click events.
pub fn view(
  pressed: Bool,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  button.view(
    [
      a.class("meridian-toggle-button"),
      a.aria_pressed(case pressed {
        True -> "true"
        False -> "false"
      }),
      ..attrs
    ],
    children,
  )
}
