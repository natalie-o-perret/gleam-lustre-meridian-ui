import gleam/dynamic/decode
import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/orientation.{type Orientation, Horizontal, Vertical}

pub fn clamp(value: Int, minimum: Int, maximum: Int) -> Int {
  let minimum = int.clamp(minimum, 0, 100)
  let maximum = int.clamp(maximum, minimum, 100)
  int.clamp(value, minimum, maximum)
}

/// Controlled two-pane sizing. The caller commits `on_change` percentages.
pub fn view(
  id: String,
  label: String,
  direction: Orientation,
  minimum: Int,
  maximum: Int,
  value: Int,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
  first: List(Element(msg)),
  second: List(Element(msg)),
) -> Element(msg) {
  let minimum = clamp(minimum, 0, 100)
  let maximum = clamp(maximum, minimum, 100)
  let value = clamp(value, minimum, maximum)
  let axis = case direction {
    Horizontal -> "columns"
    Vertical -> "rows"
  }
  let proportions =
    "minmax(0,"
    <> int.to_string(value)
    <> "fr) 8px minmax(0,"
    <> int.to_string(100 - value)
    <> "fr)"
  h.div(
    [
      a.id(id),
      a.class("meridian-splitter"),
      a.data("orientation", orientation.name(direction)),
      a.style("grid-template-" <> axis, proportions),
      ..attrs
    ],
    [
      h.div(
        [
          a.id(id <> "-first"),
          a.class("meridian-splitter-pane"),
          a.inert(value == 0),
          a.aria_hidden(value == 0),
        ],
        first,
      ),
      h.div(
        [
          a.class("meridian-splitter-handle"),
          a.role("separator"),
          a.aria_label(label),
          a.aria_orientation(case direction {
            Horizontal -> "vertical"
            Vertical -> "horizontal"
          }),
          a.aria_controls(id <> "-first " <> id <> "-second"),
          a.aria_valuemin(int.to_string(minimum)),
          a.aria_valuemax(int.to_string(maximum)),
          a.aria_valuenow(int.to_string(value)),
          a.tabindex(case minimum == maximum {
            True -> -1
            False -> 0
          }),
          a.aria_disabled(minimum == maximum),
          a.data("meridian-split", "true"),
          a.data("value", int.to_string(value)),
          event.on(
            "meridian-resize",
            decode.at(["detail", "value"], decode.int)
              |> decode.map(on_change),
          ),
        ],
        [],
      ),
      h.div(
        [
          a.id(id <> "-second"),
          a.class("meridian-splitter-pane"),
          a.inert(value == 100),
          a.aria_hidden(value == 100),
        ],
        second,
      ),
    ],
  )
}
