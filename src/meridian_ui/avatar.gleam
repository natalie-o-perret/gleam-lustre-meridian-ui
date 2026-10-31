import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Give the avatar a full accessible name, not just its visible initials.
/// Keep custom content non-interactive because it is exposed as one image.
pub fn view(
  description: String,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.span(
    [
      a.class("meridian-avatar"),
      a.role("img"),
      a.aria_label(description),
      ..attrs
    ],
    children,
  )
}

pub fn label(
  name: String,
  initials: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view(name, attrs, [h.text(initials)])
}

pub fn image(
  source: String,
  description: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.img([a.class("meridian-avatar"), a.src(source), a.alt(description), ..attrs])
}

pub fn group(
  label: String,
  attrs: List(Attribute(msg)),
  avatars: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-avatar-group"),
      a.role("group"),
      a.aria_label(label),
      ..attrs
    ],
    avatars,
  )
}
