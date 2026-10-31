import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/button

/// Empty `target` scrolls the page. Otherwise use the ID of a scroll container.
pub fn view(
  target: String,
  label: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  button.view(
    [
      a.class("meridian-scroll-top"),
      a.data("meridian-scroll-top", target),
      ..attrs
    ],
    [h.text(label)],
  )
}
