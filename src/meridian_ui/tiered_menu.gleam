import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import meridian_ui/menu

/// Nested overlay menus share the menu keyboard model and caller-owned state.
pub fn view(
  id: String,
  label: String,
  open: List(String),
  on_action: fn(menu.Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(menu.Item(msg)),
) -> Element(msg) {
  menu.view(
    id,
    label,
    open,
    on_action,
    [a.class("meridian-tiered-menu"), ..attrs],
    items,
  )
}
