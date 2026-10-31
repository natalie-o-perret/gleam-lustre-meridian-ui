import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Content stays visible without JavaScript and under reduced motion.
pub fn view(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div([a.data("meridian-reveal", "true"), ..attrs], children)
}
