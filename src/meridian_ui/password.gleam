import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/field

/// The caller owns visibility and the value. `id` must be unique in the document.
/// Native `disabled` attributes also disable the reveal button.
pub fn view(
  id: String,
  label: String,
  visible: Bool,
  on_toggle: msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let #(kind, action) = case visible {
    True -> #("text", "Hide")
    False -> #("password", "Show")
  }
  let disabled = list.filter(attrs, fn(attr) { attr.name == "disabled" })
  h.div([a.class("meridian-password")], [
    h.label([a.for(id)], [h.text(label)]),
    field.group([], [
      field.input([a.id(id), a.type_(kind), ..attrs]),
      button.view(
        [
          a.aria_label(action <> " " <> label),
          a.aria_controls(id),
          event.on_click(on_toggle),
          ..disabled
        ],
        [h.text(action)],
      ),
    ]),
  ])
}
