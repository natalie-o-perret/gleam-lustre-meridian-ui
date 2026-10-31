import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/internal/link
import meridian_ui/url.{type Url}

pub type Crumb {
  Crumb(label: String, destination: Url)
}

pub fn view(
  label: String,
  parents: List(Crumb),
  current: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.nav([a.class("meridian-breadcrumb"), a.aria_label(label), ..attrs], [
    h.ol(
      [],
      list.append(
        list.map(parents, fn(crumb) {
          h.li([], [link.view(crumb.destination, [], [h.text(crumb.label)])])
        }),
        [h.li([a.aria_current("page")], [h.text(current)])],
      ),
    ),
  ])
}
