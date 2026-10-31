import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/popover

pub fn view(
  id: String,
  title: String,
  open: Bool,
  on_confirm: msg,
  on_cancel: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  popover.view(id, title, open, on_cancel, [a.role("alertdialog"), ..attrs], [
    h.div([], children),
    h.div([a.class("meridian-overlay-actions")], [
      button.view([a.autofocus(True), event.on_click(on_cancel)], [
        h.text("Cancel"),
      ]),
      button.primary([event.on_click(on_confirm)], [h.text("Confirm")]),
    ]),
  ])
}
