import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/disclosure
import meridian_ui/icon
import meridian_ui/internal/link
import meridian_ui/url.{type Url}

pub type Link {
  Link(label: String, destination: Url)
}

pub type Column {
  Column(label: String, links: List(Link))
}

/// Navigation uses native details and links, not application-menu ARIA roles.
pub fn view(
  label: String,
  attrs: List(Attribute(msg)),
  columns: List(Column),
) -> Element(msg) {
  h.nav([a.class("meridian-mega-menu"), a.aria_label(label), ..attrs], [
    h.details([], [
      disclosure.summary(label, [a.class("button")]),
      h.div(
        [a.class("meridian-mega-columns")],
        list.map(columns, fn(column) {
          h.section([a.aria_label(column.label)], [
            h.h3([], [h.text(column.label)]),
            h.ul(
              [a.role("list")],
              list.map(column.links, fn(item) {
                h.li([], [
                  link.view(item.destination, [], [
                    h.text(item.label),
                    icon.view(icon.ChevronRight, []),
                  ]),
                ])
              }),
            ),
          ])
        }),
      ),
    ]),
  ])
}
