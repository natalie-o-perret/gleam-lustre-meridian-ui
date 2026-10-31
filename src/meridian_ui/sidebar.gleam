import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/panel

pub fn view(
  id: String,
  label: String,
  expanded: Bool,
  on_toggle: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.aside([a.class("meridian-sidebar"), a.aria_label(label), ..attrs], [
    panel.collapsible(id, label, expanded, on_toggle, [], [], children),
  ])
}
