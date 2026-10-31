import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub fn view(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.span([a.class("meridian-chip"), ..attrs], children)
}

/// The caller owns removal. Native buttons provide Enter and Space activation.
pub fn removable(
  label: String,
  on_remove: msg,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  view(attrs, [
    h.span([], children),
    button.icon(
      [
        a.class("meridian-chip-remove"),
        a.aria_label("Remove " <> label),
        event.on_click(on_remove),
      ],
      [h.text("×")],
    ),
  ])
}
