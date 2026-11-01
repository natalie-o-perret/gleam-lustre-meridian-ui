import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/svg

pub fn view(
  name: String,
  path: String,
  style: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let brand = name == "GitHub"
  svg.svg(
    [
      a.class("meridian-icon"),
      case brand {
        True -> a.data("icon-brand", "github")
        False -> a.none()
      },
      a.data("icon-style", style),
      a.aria_hidden(True),
      a.attribute("focusable", "false"),
      a.attribute("viewBox", case brand {
        True -> "0 0 32 32"
        False -> "0 0 24 24"
      }),
      a.attribute("fill", case brand {
        True -> "currentColor"
        False -> "none"
      }),
      a.attribute("stroke", case brand {
        True -> "none"
        False -> "currentColor"
      }),
      a.attribute("stroke-width", "2"),
      a.attribute("stroke-linecap", "round"),
      a.attribute("stroke-linejoin", "round"),
      ..attrs
    ],
    [svg.path([a.attribute("d", path)])],
  )
}
