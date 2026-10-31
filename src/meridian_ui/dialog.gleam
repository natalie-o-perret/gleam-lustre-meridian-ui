import gleam/dynamic/decode
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

/// Mount Meridian interactions after rendering. The caller commits close events.
pub fn view(
  id: String,
  title: String,
  open: Bool,
  on_close: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  build(id, title, open, True, on_close, attrs, children)
}

pub fn nonmodal(
  id: String,
  title: String,
  open: Bool,
  on_close: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  build(id, title, open, False, on_close, attrs, children)
}

fn build(
  id: String,
  title: String,
  open: Bool,
  modal: Bool,
  on_close: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.dialog(
    [
      a.id(id),
      a.class("meridian-dialog"),
      a.aria_labelledby(id <> "-title"),
      a.data("meridian-overlay", "dialog"),
      a.data("open", case open {
        True -> "true"
        False -> "false"
      }),
      a.data("modal", case modal {
        True -> "true"
        False -> "false"
      }),
      event.on("meridian-close", decode.success(on_close))
        |> event.stop_propagation,
      ..attrs
    ],
    [
      h.header([a.class("meridian-dialog-header")], [
        h.h2([a.id(id <> "-title")], [h.text(title)]),
        button.view(
          [a.aria_label("Close " <> title), event.on_click(on_close)],
          [h.text("Close")],
        ),
      ]),
      h.div([a.class("meridian-dialog-content")], children),
    ],
  )
}
