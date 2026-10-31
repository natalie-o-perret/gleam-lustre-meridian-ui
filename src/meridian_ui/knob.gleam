import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/slider

/// Native range values, steps, keyboard access and form semantics with a pointer dial.
pub fn view(
  label: String,
  value: String,
  on_change: fn(String) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.label(
    [
      a.class("meridian-knob"),
      a.data("meridian-knob", "true"),
      a.data("value", value),
    ],
    [
      h.span([], [h.text(label)]),
      h.span([a.class("meridian-knob-control")], [
        slider.view([
          a.class("meridian-knob-input"),
          a.aria_label(label),
          a.value(value),
          a.data("meridian-knob-input", "true"),
          event.on_input(on_change),
          ..attrs
        ]),
        h.span([a.class("meridian-knob-face"), a.aria_hidden(True)], [
          h.span([a.data("knob-value", "true")], [h.text(value)]),
        ]),
      ]),
    ],
  )
}
