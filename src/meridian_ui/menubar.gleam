import lustre/attribute.{type Attribute}
import lustre/element.{type Element}
import meridian_ui/menu
import meridian_ui/orientation

pub fn view(
  id: String,
  label: String,
  open: List(String),
  on_action: fn(menu.Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(menu.Item(msg)),
) -> Element(msg) {
  menu.build(id, label, orientation.Horizontal, open, on_action, attrs, items)
}
