import gleam/dynamic/decode
import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/menu

pub type Position {
  Position(x: Int, y: Int)
}

/// Wrap only the region whose native context menu should be replaced.
pub fn view(
  id: String,
  label: String,
  visible: Bool,
  position: Position,
  on_open: fn(Position) -> msg,
  on_close: msg,
  open: List(String),
  on_action: fn(menu.Action(msg)) -> msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
  items: List(menu.Item(msg)),
) -> Element(msg) {
  h.div(
    [
      a.data("meridian-context", id),
      event.on(
        "meridian-context",
        decode.at(["detail"], {
          use x <- decode.field("x", decode.int)
          use y <- decode.field("y", decode.int)
          decode.success(on_open(Position(x, y)))
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    [
      h.div([], children),
      menu.popup(
        id,
        label,
        visible,
        on_close,
        open,
        on_action,
        [
          a.data("context-x", int.to_string(position.x)),
          a.data("context-y", int.to_string(position.y)),
        ],
        items,
      ),
    ],
  )
}
