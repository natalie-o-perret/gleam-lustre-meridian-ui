import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// A labelled native checkbox with switch semantics and ordinary form values.
pub fn view(label: String, attrs: List(Attribute(msg))) -> Element(msg) {
  h.label([a.class("meridian-switch")], [
    h.input([
      a.type_("checkbox"),
      a.role("switch"),
      a.class("meridian-switch-input"),
      ..attrs
    ]),
    h.span([a.class("meridian-switch-track"), a.aria_hidden(True)], []),
    h.span([], [h.text(label)]),
  ])
}
