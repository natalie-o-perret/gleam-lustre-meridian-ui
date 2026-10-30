import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub type Tone {
  Success
  Warning
  Danger
  Accent
}

pub fn view(
  tone: Tone,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  let colour = case tone {
    Success -> "badge-success"
    Warning -> "badge-warning"
    Danger -> "badge-danger"
    Accent -> "badge-accent"
  }
  h.span([a.class("badge " <> colour), ..attrs], children)
}
