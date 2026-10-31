import gleam/dynamic/decode
import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/icon
import meridian_ui/tooltip

pub fn next(index: Int, count: Int, delta: Int) -> Int {
  let count = int.max(count, 1)
  { { index + delta } % count + count } % count
}

/// Drag/swipe uses mounted browser interactions. Buttons also work without the mount.
/// Autoplay is opt-in and caller-owned. Pause it for focus, hover and reduced motion.
pub fn view(
  label: String,
  active: Int,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
  slides: List(Element(msg)),
) -> Element(msg) {
  let count = list.length(slides)
  let active = int.clamp(active, 0, int.max(count - 1, 0))
  h.section(
    [
      a.class("meridian-carousel"),
      a.aria_label(label),
      a.attribute("aria-roledescription", "carousel"),
      a.data("meridian-carousel", "true"),
      event.on("meridian-swipe", {
        use delta <- decode.field("detail", decode.int)
        decode.success(on_change(next(active, count, delta)))
      }),
      ..attrs
    ],
    [
      h.div([a.class("meridian-carousel-viewport")], [
        h.div(
          [a.class("meridian-carousel-slides")],
          list.index_map(slides, fn(slide, index) {
            h.div(
              [
                a.role("group"),
                a.aria_label(
                  int.to_string(index + 1) <> " of " <> int.to_string(count),
                ),
                a.attribute("aria-roledescription", "slide"),
                a.hidden(index != active),
                a.aria_hidden(index != active),
                a.inert(index != active),
              ],
              [slide],
            )
          }),
        ),
        navigation(
          "Previous slide",
          "previous",
          icon.ChevronLeft,
          count < 2,
          on_change(next(active, count, -1)),
        ),
        navigation(
          "Next slide",
          "next",
          icon.ChevronRight,
          count < 2,
          on_change(next(active, count, 1)),
        ),
      ]),
      h.div([a.class("meridian-carousel-controls")], [
        h.span([a.role("status"), a.aria_atomic(True)], [
          h.text(case count {
            0 -> "No slides"
            _ -> int.to_string(active + 1) <> " of " <> int.to_string(count)
          }),
        ]),
      ]),
    ],
  )
}

fn navigation(
  label: String,
  direction: String,
  glyph: icon.Icon,
  disabled: Bool,
  on_click: msg,
) -> Element(msg) {
  button.icon(
    [
      a.class("meridian-carousel-step"),
      a.data("direction", direction),
      a.aria_label(label),
      tooltip.hint(label),
      a.disabled(disabled),
      event.on_click(on_click),
    ],
    [icon.view(glyph, [])],
  )
}
