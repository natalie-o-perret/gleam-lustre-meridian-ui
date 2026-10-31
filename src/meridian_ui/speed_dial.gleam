import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/menu
import meridian_ui/popover

pub fn view(
  id: String,
  label: String,
  open: Bool,
  on_toggle: msg,
  on_close: msg,
  expanded: List(String),
  on_action: fn(menu.Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(menu.Item(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-speed-dial"), ..attrs], [
    popover.trigger(
      id,
      label,
      open,
      on_toggle,
      [a.attribute("aria-haspopup", "menu")],
      [h.text(label)],
    ),
    menu.popup(id, label, open, on_close, expanded, on_action, [], items),
  ])
}
