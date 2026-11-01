import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/field

/// Mounted suggestions use a themed listbox. Unmounted inputs keep a native datalist.
/// Suggestions open while typing, or with ArrowUp and ArrowDown, not on focus.
/// The caller can replace suggestions after an asynchronous request.
pub fn view(
  id: String,
  attrs: List(Attribute(msg)),
  suggestions: List(Element(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-autocomplete")], [
    field.input([
      a.id(id),
      a.list(id <> "-suggestions"),
      a.data("meridian-autocomplete", id <> "-suggestions"),
      a.autocomplete("off"),
      ..attrs
    ]),
    h.datalist([a.id(id <> "-suggestions")], suggestions),
  ])
}

pub fn suggestion(value: String, label: String) -> Element(msg) {
  h.option([a.value(value)], label)
}
