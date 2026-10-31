import gleam/int
import gleam/option.{type Option, None, Some}
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// `None` means an unknown duration. Percentages are clamped to 0-100.
pub fn view(
  label: String,
  value: Option(Int),
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  case value {
    None ->
      h.div(
        [
          a.class("meridian-progress meridian-progress-indeterminate"),
          a.role("progressbar"),
          a.aria_label(label),
          ..attrs
        ],
        [h.span([a.aria_hidden(True)], [])],
      )
    Some(value) -> {
      let value = int.clamp(value, min: 0, max: 100) |> int.to_string
      h.progress(
        [
          a.class("meridian-progress"),
          a.max("100"),
          a.value(value),
          a.aria_label(label),
          ..attrs
        ],
        [h.text(value <> "%")],
      )
    }
  }
}
