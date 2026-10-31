import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/menu
import meridian_ui/popover

pub fn view(
  id: String,
  label: String,
  on_primary: msg,
  visible: Bool,
  on_toggle: msg,
  on_close: msg,
  open: List(String),
  on_action: fn(menu.Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  items: List(menu.Item(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-split-button"), ..attrs], [
    button.primary([event.on_click(on_primary)], [h.text(label)]),
    popover.trigger(
      id,
      "More " <> label <> " options",
      visible,
      on_toggle,
      [a.attribute("aria-haspopup", "menu")],
      [h.text("More")],
    ),
    menu.popup(
      id,
      label <> " options",
      visible,
      on_close,
      open,
      on_action,
      [],
      items,
    ),
  ])
}
