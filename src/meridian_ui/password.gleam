import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/svg
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
      button.icon(
        [
          a.aria_label(action <> " " <> label),
          a.aria_controls(id),
          a.title(action <> " " <> label),
          event.on_click(on_toggle),
          ..disabled
        ],
        [
          svg.svg(
            [
              a.class("icon"),
              a.aria_hidden(True),
              a.attribute("focusable", "false"),
              a.attribute("viewBox", "0 0 24 24"),
              a.attribute("fill", "none"),
              a.attribute("stroke", "currentColor"),
              a.attribute("stroke-width", "1.8"),
              a.attribute("stroke-linecap", "round"),
              a.attribute("stroke-linejoin", "round"),
            ],
            [
              svg.path([
                a.attribute(
                  "d",
                  "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z",
                ),
              ]),
              svg.circle([
                a.attribute("cx", "12"),
                a.attribute("cy", "12"),
                a.attribute("r", "3"),
              ]),
              case visible {
                True -> svg.path([a.attribute("d", "m3 3 18 18")])
                False -> element.none()
              },
            ],
          ),
        ],
      ),
    ]),
  ])
}
