import gleam/dynamic/decode
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub fn view(
  label: String,
  editing: Bool,
  on_edit: msg,
  on_cancel: msg,
  attrs: List(Attribute(msg)),
  display: List(Element(msg)),
  editor: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-inplace"),
      a.data("meridian-inplace", case editing {
        True -> "true"
        False -> "false"
      }),
      event.on("meridian-cancel", decode.success(on_cancel))
        |> event.stop_propagation,
      ..attrs
    ],
    [
      h.div([a.hidden(editing)], [
        h.div([], display),
        button.text(
          [a.data("meridian-inplace-trigger", "true"), event.on_click(on_edit)],
          [h.text("Edit " <> label)],
        ),
      ]),
      h.div(
        [
          a.hidden(!editing),
          a.role("group"),
          a.aria_label("Edit " <> label),
          a.data("meridian-inplace-editor", "true"),
        ],
        list.append(editor, [
          button.view([event.on_click(on_cancel)], [h.text("Cancel")]),
        ]),
      ),
    ],
  )
}

import gleam/list
