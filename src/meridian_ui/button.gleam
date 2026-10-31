import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub fn view(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.button([default_type(attrs), a.class("button"), ..attrs], children)
}

pub fn primary(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  view([a.class("primary-button"), ..attrs], children)
}

pub fn text(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  view([a.class("text-button"), ..attrs], children)
}

pub fn icon(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  // Icon-only buttons need an accessible label supplied by the caller.
  h.button([default_type(attrs), a.class("icon-button"), ..attrs], children)
}

fn default_type(attrs: List(Attribute(msg))) -> Attribute(msg) {
  case list.any(attrs, fn(attr) { attr.name == "type" }) {
    True -> a.none()
    False -> a.type_("button")
  }
}
