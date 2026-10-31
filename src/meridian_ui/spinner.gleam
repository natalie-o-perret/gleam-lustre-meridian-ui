import gleam/int
import gleam/option.{type Option, None, Some}
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/svg

/// `None` spins for unknown progress. `Some(percent)` shows a stationary ring.
pub fn view(
  label: String,
  value: Option(Int),
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let #(state, range) = case value {
    None -> #(a.class("meridian-spinner-indeterminate"), "25 100")
    Some(value) -> {
      let value = int.clamp(value, min: 0, max: 100) |> int.to_string
      #(a.aria_valuenow(value), value <> " 100")
    }
  }
  let circle = [
    a.attribute("cx", "20"),
    a.attribute("cy", "20"),
    a.attribute("r", "16"),
    a.attribute("pathLength", "100"),
  ]
  h.span(
    [
      a.class("meridian-spinner"),
      a.role("progressbar"),
      a.aria_label(label),
      a.aria_valuemin("0"),
      a.aria_valuemax("100"),
      state,
      ..attrs
    ],
    [
      svg.svg(
        [
          a.attribute("viewBox", "0 0 40 40"),
          a.attribute("fill", "none"),
          a.attribute("stroke-width", "4"),
          a.aria_hidden(True),
          a.attribute("focusable", "false"),
        ],
        [
          svg.circle([a.class("meridian-spinner-track"), ..circle]),
          svg.circle([
            a.class("meridian-spinner-range"),
            a.attribute("stroke-dasharray", range),
            a.attribute("stroke-linecap", "round"),
            ..circle
          ]),
        ],
      ),
    ],
  )
}
