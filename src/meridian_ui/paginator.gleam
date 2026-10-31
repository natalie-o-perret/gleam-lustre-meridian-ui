import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub fn pages(total: Int, size: Int) -> Int {
  int.max(1, { int.max(total, 0) + int.max(size, 1) - 1 } / int.max(size, 1))
}

pub fn clamp(page: Int, total: Int, size: Int) -> Int {
  int.clamp(page, 0, pages(total, size) - 1)
}

pub fn slice(items: List(item), page: Int, size: Int) -> List(item) {
  let size = int.max(size, 1)
  items
  |> list.drop(clamp(page, list.length(items), size) * size)
  |> list.take(size)
}

/// Pages are zero-based. A shrinking result set always renders a reachable page.
pub fn view(
  label: String,
  total: Int,
  size: Int,
  page: Int,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let page = clamp(page, total, size)
  let count = pages(total, size)
  let first = int.max(0, page - 2)
  let last = int.min(count - 1, page + 2)
  h.nav([a.class("meridian-paginator"), a.aria_label(label), ..attrs], [
    button.view([a.disabled(page == 0), event.on_click(on_change(0))], [
      h.text("First"),
    ]),
    button.view([a.disabled(page == 0), event.on_click(on_change(page - 1))], [
      h.text("Previous"),
    ]),
    ..list.append(
      list.index_map(list.repeat(Nil, last - first + 1), fn(_, offset) {
        let index = first + offset
        button.view(
          [
            a.aria_label("Page " <> int.to_string(index + 1)),
            a.aria_current(case index == page {
              True -> "page"
              False -> "false"
            }),
            event.on_click(on_change(index)),
          ],
          [h.text(int.to_string(index + 1))],
        )
      }),
      [
        h.span([a.role("status"), a.aria_atomic(True)], [
          h.text(
            "Page " <> int.to_string(page + 1) <> " of " <> int.to_string(count),
          ),
        ]),
        button.view(
          [a.disabled(page == count - 1), event.on_click(on_change(page + 1))],
          [h.text("Next")],
        ),
        button.view(
          [a.disabled(page == count - 1), event.on_click(on_change(count - 1))],
          [h.text("Last")],
        ),
      ],
    )
  ])
}
