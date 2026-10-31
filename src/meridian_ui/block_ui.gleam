import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Native inertness blocks pointer and keyboard input, not just a painted overlay.
pub fn view(
  label: String,
  active: Bool,
  attrs: List(Attribute(msg)),
  children: List(Element(msg)),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-block"),
      a.data("meridian-block", case active {
        True -> "true"
        False -> "false"
      }),
      ..attrs
    ],
    [
      h.div(
        [
          a.inert(active),
          a.aria_busy(active),
          a.data("meridian-block-content", "true"),
        ],
        children,
      ),
      h.div(
        [
          a.class("meridian-block-overlay"),
          a.role("status"),
          a.tabindex(-1),
          a.hidden(!active),
          a.data("meridian-block-status", "true"),
        ],
        [h.text(label)],
      ),
    ],
  )
}
