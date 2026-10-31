import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub fn view(on_save: msg) -> Element(msg) {
  h.div(
    [
      a.id("app-ui"),
      a.class("meridian-ui"),
      a.data("theme", "light"),
    ],
    [
      button.primary([event.on_click(on_save)], [h.text("Save")]),
    ],
  )
}
