import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Decorative loading placeholder. Mark its containing region `aria-busy`.
/// Supply dimensions with ordinary styles or classes.
pub fn view(attrs: List(Attribute(msg))) -> Element(msg) {
  h.div([a.class("meridian-skeleton"), a.aria_hidden(True), ..attrs], [])
}

pub fn circle(attrs: List(Attribute(msg))) -> Element(msg) {
  view([a.class("meridian-skeleton-circle"), ..attrs])
}
