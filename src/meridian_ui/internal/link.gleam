import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/url.{type Url}

pub fn view(
  destination: Url,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.a([a.href(url.to_string(destination)), ..attrs], children)
}
