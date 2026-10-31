import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/paginator

pub type Layout {
  List
  Grid
}

pub fn view(
  label: String,
  layout: Layout,
  page: Int,
  size: Int,
  on_page: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
  items: List(item),
  render: fn(item) -> Element(msg),
) -> Element(msg) {
  h.section([a.class("meridian-data-view"), a.aria_label(label), ..attrs], [
    case items {
      [] -> h.p([a.role("status")], [h.text("No results")])
      _ ->
        h.ul(
          [
            a.class("meridian-data-view-items"),
            a.data("layout", case layout {
              List -> "list"
              Grid -> "grid"
            }),
          ],
          list.map(paginator.slice(items, page, size), fn(item) {
            h.li([], [render(item)])
          }),
        )
    },
    paginator.view(
      label <> " pages",
      list.length(items),
      size,
      page,
      on_page,
      [],
    ),
  ])
}
