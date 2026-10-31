import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub fn view(attrs: List(Attribute(msg))) -> Element(msg) {
  h.hr([a.class("meridian-divider"), ..attrs])
}

pub fn vertical(attrs: List(Attribute(msg))) -> Element(msg) {
  h.div(
    [
      a.class("meridian-divider meridian-divider-vertical"),
      a.role("separator"),
      a.attribute("aria-orientation", "vertical"),
      ..attrs
    ],
    [],
  )
}

pub fn label(text: String, attrs: List(Attribute(msg))) -> Element(msg) {
  h.div(
    [
      a.class("meridian-divider meridian-divider-labelled"),
      a.role("separator"),
      a.aria_label(text),
      ..attrs
    ],
    [h.span([a.aria_hidden(True)], [h.text(text)])],
  )
}
