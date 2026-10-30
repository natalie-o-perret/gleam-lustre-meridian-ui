import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Supply a label or an `aria-label`, as with a native input.
pub fn input(attrs: List(Attribute(msg))) -> Element(msg) {
  h.input([a.class("input"), ..attrs])
}

pub fn select(
  attrs: List(Attribute(msg)),
  options: List(Element(msg)),
) -> Element(msg) {
  h.select(attrs, [
    h.button([a.type_("button"), a.class("select-button"), a.tabindex(-1)], [
      element.element("selectedcontent", [], []),
    ]),
    ..options
  ])
}

/// Rich option content should be non-interactive and contain no IDs.
/// Browsers clone it into the selected value where supported.
pub fn option(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  element.element("option", attrs, children)
}

pub fn search(
  label: String,
  icon: Element(msg),
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.label([a.class("search-field")], [
    h.span([a.class("sr-only")], [h.text(label)]),
    icon,
    input([a.type_("search"), ..attrs]),
  ])
}
