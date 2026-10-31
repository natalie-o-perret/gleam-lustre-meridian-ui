import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/disclosure

pub type Panel(msg) {
  Panel(id: String, label: String, disabled: Bool, children: List(Element(msg)))
}

pub fn toggle(open: List(String), id: String, multiple: Bool) -> List(String) {
  case list.contains(open, id), multiple {
    True, _ -> list.filter(open, fn(value) { value != id })
    False, True -> list.append(open, [id])
    False, False -> [id]
  }
}

/// The caller owns open IDs. Mount Meridian interactions for arrow/Home/End keys.
pub fn view(
  id: String,
  label: String,
  multiple: Bool,
  open: List(String),
  on_change: fn(List(String)) -> msg,
  attrs: List(Attribute(msg)),
  panels: List(Panel(msg)),
) -> Element(msg) {
  let open = case multiple {
    True -> open
    False -> list.take(open, 1)
  }
  h.div(
    [
      a.id(id),
      a.class("meridian-accordion"),
      a.role("group"),
      a.aria_label(label),
      a.data("meridian-keys", "accordion"),
      a.data("orientation", "vertical"),
      ..attrs
    ],
    list.map(panels, fn(panel) {
      let prefix = id <> "-" <> panel.id
      let expanded = list.contains(open, panel.id)
      h.div([a.class("meridian-accordion-panel")], [
        h.h2([], [
          disclosure.toggle(prefix, panel.label, expanded, [
            a.data("meridian-item", "true"),
            a.disabled(panel.disabled),
            event.on_click(on_change(toggle(open, panel.id, multiple))),
          ]),
        ]),
        disclosure.content(
          prefix,
          expanded,
          [a.class("meridian-panel-content")],
          panel.children,
        ),
      ])
    }),
  )
}
