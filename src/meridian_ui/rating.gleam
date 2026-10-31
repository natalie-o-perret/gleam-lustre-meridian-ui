import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/element/svg
import lustre/event
import meridian_ui/button
import meridian_ui/fieldset

pub fn view(
  label: String,
  name: String,
  value: Int,
  maximum: Int,
  required: Bool,
  on_change: fn(Int) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let maximum = int.max(maximum, 1)
  let value = int.clamp(value, 0, maximum)
  fieldset.view(
    label,
    [a.class("meridian-rating"), a.role("radiogroup"), ..attrs],
    [
      h.div(
        [a.class("meridian-rating-options"), a.data("meridian-keys", "rating")],
        list.index_map(list.repeat(Nil, maximum), fn(_, index) {
          let score = index + 1
          h.label(
            [
              a.class("meridian-rating-choice"),
              a.data("filled", case score <= value {
                True -> "true"
                False -> "false"
              }),
            ],
            [
              h.input([
                a.type_("radio"),
                a.data("meridian-item", "true"),
                a.name(name),
                a.value(int.to_string(score)),
                a.aria_label(
                  int.to_string(score)
                  <> case score {
                    1 -> " star"
                    _ -> " stars"
                  },
                ),
                a.checked(score == value),
                a.required(required),
                event.on_check(fn(_) { on_change(score) }),
              ]),
              star(),
            ],
          )
        }),
      ),
      case required {
        True -> element.none()
        False ->
          button.text([a.disabled(value == 0), event.on_click(on_change(0))], [
            h.text("Clear rating"),
          ])
      },
    ],
  )
}

pub fn display(
  label: String,
  value: Int,
  maximum: Int,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let maximum = int.max(maximum, 1)
  let value = int.clamp(value, 0, maximum)
  h.span(
    [
      a.class("meridian-rating-display"),
      a.role("img"),
      a.aria_label(
        label
        <> ": "
        <> int.to_string(value)
        <> " of "
        <> int.to_string(maximum),
      ),
      ..attrs
    ],
    list.index_map(list.repeat(Nil, maximum), fn(_, index) {
      h.span(
        [
          a.aria_hidden(True),
          a.data("filled", case index < value {
            True -> "true"
            False -> "false"
          }),
        ],
        [star()],
      )
    }),
  )
}

fn star() -> Element(msg) {
  svg.svg(
    [
      a.class("meridian-rating-star"),
      a.aria_hidden(True),
      a.attribute("focusable", "false"),
      a.attribute("viewBox", "0 0 24 24"),
    ],
    [
      svg.path([
        a.attribute(
          "d",
          "m12 2.5 2.9 6 6.6 1-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6L2.5 9.5l6.6-1Z",
        ),
        a.attribute("fill", "currentColor"),
        a.attribute("stroke", "currentColor"),
        a.attribute("stroke-width", "1.6"),
        a.attribute("stroke-linejoin", "round"),
      ]),
      svg.path([
        a.class("meridian-rating-eyes"),
        a.attribute("d", "M9.5 10.5v2m5-2v2"),
        a.attribute("stroke-width", "1.8"),
        a.attribute("stroke-linecap", "round"),
      ]),
    ],
  )
}
