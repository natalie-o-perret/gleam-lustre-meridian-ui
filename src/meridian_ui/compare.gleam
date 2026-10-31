import gleam/int
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
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
  let value = int.clamp(value, 0, 100)
  h.figure([a.class("meridian-compare"), ..attrs], [
    h.div([a.class("meridian-compare-images")], [
      h.img([a.src(url.to_string(after)), a.alt(after_label)]),
      h.img([
        a.src(url.to_string(before)),
        a.alt(before_label),
        a.class("meridian-compare-before"),
        a.style(
          "clip-path",
          "inset(0 " <> int.to_string(100 - value) <> "% 0 0)",
        ),
      ]),
    ]),
    h.figcaption([], [h.text(before_label <> " / " <> after_label)]),
    h.label([], [
      h.span([], [h.text(label <> ": " <> int.to_string(value) <> "% before")]),
      slider.view([
        a.min("0"),
        a.max("100"),
        a.value(int.to_string(value)),
        event.on_input(fn(value) {
          case int.parse(value) {
            Ok(value) -> on_change(value)
            Error(_) -> on_change(0)
          }
        }),
      ]),
    ]),
  ])
}
