import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/icon
import meridian_ui/orientation.{type Orientation, Horizontal, Vertical}
import meridian_ui/slider
import meridian_ui/url.{type Url}

pub fn view(
  label: String,
  before: Url,
  before_label: String,
  after: Url,
  after_label: String,
  value: Int,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view_with(
    label,
    before,
    before_label,
    after,
    after_label,
    value,
    Horizontal,
    True,
    on_change,
    attrs,
  )
}

/// One native range handles pointer dragging, touch and keyboard input.
pub fn view_with(
  label: String,
  before: Url,
  before_label: String,
  after: Url,
  after_label: String,
  value: Int,
  direction: Orientation,
  draggable: Bool,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let value = int.clamp(value, 0, 100)
  let control =
    slider.view([
      a.class(case draggable {
        True -> "meridian-compare-control"
        False -> ""
      }),
      a.aria_label(label),
      a.attribute(
        "aria-valuetext",
        int.to_string(value) <> "% " <> before_label,
      ),
      a.attribute("aria-orientation", case direction {
        Vertical -> "vertical"
        Horizontal -> "horizontal"
      }),
      a.min("0"),
      a.max("100"),
      a.value(int.to_string(value)),
      event.on_input(fn(value) {
        case int.parse(value) {
          Ok(value) -> on_change(value)
          Error(_) -> on_change(0)
        }
      }),
    ])
  h.figure([a.class("meridian-compare"), ..attrs], [
    h.div(
      [
        a.class("meridian-compare-images"),
        a.data("orientation", case direction {
          Vertical -> "vertical"
          Horizontal -> "horizontal"
        }),
        a.style("--meridian-compare-position", int.to_string(value) <> "%"),
      ],
      [
        h.img([a.src(url.to_string(after)), a.alt(after_label)]),
        h.img([
          a.src(url.to_string(before)),
          a.alt(before_label),
          a.class("meridian-compare-before"),
          a.style("clip-path", case direction {
            Horizontal -> "inset(0 " <> int.to_string(100 - value) <> "% 0 0)"
            Vertical -> "inset(0 0 " <> int.to_string(100 - value) <> "% 0)"
          }),
        ]),
        ..case draggable {
          True -> [
            h.div([a.class("meridian-compare-divider"), a.aria_hidden(True)], [
              h.span([a.class("meridian-compare-grip")], [
                icon.view(icon.ChevronLeft, []),
                icon.view(icon.ChevronRight, []),
              ]),
            ]),
            control,
          ]
          False -> []
        }
      ],
    ),
    h.figcaption([], [h.text(before_label <> " / " <> after_label)]),
    h.p([], [h.text(label <> ": " <> int.to_string(value) <> "% before")]),
    ..case draggable {
      True -> []
      False -> [control]
    }
  ])
}
