import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub type Animation {
  Fade
  SlideUp
  SlideLeft
  SlideRight
  Zoom
}

/// Content stays visible without JavaScript and under reduced motion.
pub fn view(
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  view_with(SlideUp, True, attrs, children)
}

pub fn view_with(
  animation: Animation,
  once: Bool,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.data("meridian-reveal", "true"),
      a.data("reveal-once", case once {
        True -> "true"
        False -> "false"
      }),
      a.data("reveal-effect", case animation {
        Fade -> "fade"
        SlideUp -> "slide-up"
        SlideLeft -> "slide-left"
        SlideRight -> "slide-right"
        Zoom -> "zoom"
      }),
      ..attrs
    ],
    children,
  )
}

/// Put this on a button to replay a reveal in the same mounted root.
pub fn replay(id: String) -> Attribute(msg) {
  a.data("meridian-replay", id)
}
