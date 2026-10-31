import gleam/dynamic/decode
import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/keyed
import lustre/event
import meridian_ui/button

pub type Item(msg) {
  Item(id: String, label: String, disabled: Bool, children: List(Element(msg)))
}

pub type Action {
  Move(id: String, position: Int)
}

pub fn move(
  items: List(Item(msg)),
  id: String,
  position: Int,
) -> List(Item(msg)) {
  case list.find(items, fn(item) { item.id == id && !item.disabled }) {
    Error(_) -> items
    Ok(item) -> {
      let rest = list.filter(items, fn(other) { other.id != id })
      let #(before, after) =
        list.split(rest, int.clamp(position, 0, list.length(rest)))
      list.append(before, [item, ..after])
    }
  }
}

/// Native move buttons are the keyboard and touch alternative to drag/drop.
pub fn view(
  label: String,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  items: List(Item(msg)),
) -> Element(msg) {
  keyed.ol(
    [
      a.class("meridian-order-list"),
      a.aria_label(label),
      a.data("meridian-order", "true"),
      event.on(
        "meridian-reorder",
        decode.at(["detail"], {
          use id <- decode.field("id", decode.string)
          use position <- decode.field("position", decode.int)
          decode.success(on_action(Move(id, position)))
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    list.index_map(items, fn(item, index) {
      #(
        item.id,
        h.li(
          [
            a.data("order-id", item.id),
            a.data("order-index", int.to_string(index)),
            a.draggable(!item.disabled),
          ],
          [
            h.div([a.class("meridian-order-content")], [
              h.span([], [h.text(item.label)]),
              ..item.children
            ]),
            h.div([a.class("meridian-order-actions")], [
              button.view(
                [
                  a.aria_label("Move " <> item.label <> " up"),
                  a.disabled(item.disabled || index == 0),
                  event.on_click(on_action(Move(item.id, index - 1))),
                ],
                [h.text("Up")],
              ),
              button.view(
                [
                  a.aria_label("Move " <> item.label <> " down"),
                  a.disabled(item.disabled || index == list.length(items) - 1),
                  event.on_click(on_action(Move(item.id, index + 1))),
                ],
                [h.text("Down")],
              ),
            ]),
          ],
        ),
      )
    }),
  )
}
