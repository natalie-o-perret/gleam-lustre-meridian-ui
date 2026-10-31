import gleam/dynamic/decode
import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/selection.{type Mode, Multiple}

/// Native selection, typeahead, range selection and repeated form values stay native.
pub fn view(
  label: String,
  rows: Int,
  mode: Mode,
  on_change: fn(List(String)) -> msg,
  attrs: List(Attribute(msg)),
  options: List(Element(msg)),
) -> Element(msg) {
  h.select(
    [
      a.class("meridian-listbox"),
      a.aria_label(label),
      a.size(int.to_string(int.max(rows, 2))),
      a.multiple(mode == Multiple),
      a.data("meridian-listbox", "true"),
      event.on(
        "meridian-selection",
        decode.at(["detail", "values"], decode.list(decode.string))
          |> decode.map(on_change),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    options,
  )
}

pub fn option(
  value: String,
  label: String,
  selected: Bool,
  disabled: Bool,
) -> Element(msg) {
  h.option([a.value(value), a.selected(selected), a.disabled(disabled)], label)
}
