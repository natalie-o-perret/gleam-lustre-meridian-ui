import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/internal/link
import meridian_ui/url.{type Url}

pub type Item(msg) {
  Item(label: String, destination: Url, icon: Element(msg), current: Bool)
}

pub fn view(
  label: String,
  attrs: List(Attribute(msg)),
  items: List(Item(msg)),
) -> Element(msg) {
  h.nav([a.class("meridian-dock"), a.aria_label(label), ..attrs], [
    h.ul(
      [],
      list.map(items, fn(item) {
        h.li([], [
          link.view(
            item.destination,
            [
              a.aria_current(case item.current {
                True -> "page"
                False -> "false"
              }),
            ],
            [
              h.span([a.aria_hidden(True)], [item.icon]),
              h.span([], [h.text(item.label)]),
            ],
          ),
        ])
      }),
    ),
  ])
}
