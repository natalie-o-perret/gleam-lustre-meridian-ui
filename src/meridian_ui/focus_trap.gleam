import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// The newest active trap owns focus. Native modal dialogs take priority.
pub fn view(
  label: String,
  active: Bool,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.tabindex(-1),
      a.role("group"),
      a.aria_label(label),
      a.data("meridian-trap", case active {
        True -> "true"
        False -> "false"
      }),
      ..attrs
    ],
    children,
  )
}
