import gleam/dynamic/decode
import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event

pub type Viewport {
  Viewport(top: Int, height: Int)
}

pub type Window {
  Window(start: Int, end: Int, before: Int, after: Int)
}

pub fn window(
  count: Int,
  row_height: Int,
  viewport: Viewport,
  overscan: Int,
) -> Window {
  let count = int.max(count, 0)
  let row_height = int.max(row_height, 1)
  let overscan = int.max(overscan, 0)
  let top =
    int.clamp(
      viewport.top,
      0,
      int.max(0, count * row_height - int.max(viewport.height, 1)),
    )
  let start = int.max(0, top / row_height - overscan)
  let end =
    int.min(
      count,
      { top + int.max(viewport.height, 1) + row_height - 1 }
        / row_height
        + overscan,
    )
  Window(start, end, start * row_height, { count - end } * row_height)
}

/// Uniform row heights are explicit, so scrolling does not guess from text lengths.
/// shortcut: fixed-height rows, use a measured layout for variable-height content.
pub fn view(
  label: String,
  row_height: Int,
  viewport: Viewport,
  on_scroll: fn(Viewport) -> msg,
  attrs: List(Attribute(msg)),
  items: List(item),
  render: fn(item) -> Element(msg),
) -> Element(msg) {
  let row_height = int.max(row_height, 1)
  let count = list.length(items)
  let window = window(count, row_height, viewport, 3)
  h.div(
    [
      a.class("meridian-virtual-scroller"),
      a.role("region"),
      a.aria_label(label),
      a.tabindex(0),
      a.data("meridian-virtual", "true"),
      event.on(
        "meridian-viewport",
        decode.at(["detail"], {
          use top <- decode.field("top", decode.int)
          use height <- decode.field("height", decode.int)
          decode.success(on_scroll(Viewport(top, height)))
        }),
      )
        |> event.stop_propagation,
      ..attrs
    ],
    [
      h.ul(
        [
          a.aria_label(label <> " items"),
          a.style("padding-block-start", int.to_string(window.before) <> "px"),
          a.style("padding-block-end", int.to_string(window.after) <> "px"),
        ],
        items
          |> list.drop(window.start)
          |> list.take(window.end - window.start)
          |> list.index_map(fn(item, index) {
            h.li(
              [
                a.style("block-size", int.to_string(row_height) <> "px"),
                a.attribute(
                  "aria-posinset",
                  int.to_string(window.start + index + 1),
                ),
                a.attribute("aria-setsize", int.to_string(count)),
              ],
              [render(item)],
            )
          }),
      ),
    ],
  )
}
