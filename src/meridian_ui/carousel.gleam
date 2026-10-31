import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button

pub fn next(index: Int, count: Int, delta: Int) -> Int {
  let count = int.max(count, 1)
  { { index + delta } % count + count } % count
}

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
      ..attrs
    ],
    [
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
            ],
            [slide],
          )
        }),
      ),
      h.div([a.class("meridian-carousel-controls")], [
        button.view(
          [
            a.disabled(count < 2),
            event.on_click(on_change(next(active, count, -1))),
          ],
          [h.text("Previous slide")],
        ),
        h.span([a.role("status"), a.aria_atomic(True)], [
          h.text(case count {
            0 -> "No slides"
            _ -> int.to_string(active + 1) <> " of " <> int.to_string(count)
          }),
        ]),
        button.view(
          [
            a.disabled(count < 2),
            event.on_click(on_change(next(active, count, 1))),
          ],
          [h.text("Next slide")],
        ),
      ]),
    ],
  )
}
