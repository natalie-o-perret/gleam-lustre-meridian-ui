import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Give related radios the same native `name` and different `value` attributes.
pub fn view(label: String, attrs: List(Attribute(msg))) -> Element(msg) {
  h.label([a.class("meridian-radio-field")], [
    h.input([a.type_("radio"), a.class("meridian-radio"), ..attrs]),
    h.span([], [h.text(label)]),
  ])
}
