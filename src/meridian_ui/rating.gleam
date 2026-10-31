import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
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
              h.span([a.aria_hidden(True)], [h.text("★")]),
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
        [h.text("★")],
      )
    }),
  )
}
