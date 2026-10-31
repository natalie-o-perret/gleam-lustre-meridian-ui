import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
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

/// Native radios for fractional ratings. None is unrated, including when zero is valid.
/// Invalid bounds, more than 100 stars or more than 1000 choices render an alert.
pub fn range(
  label: String,
  name: String,
  value: Option(Float),
  minimum: Float,
  maximum: Float,
  step: Float,
  required: Bool,
  on_change: fn(Option(Float)) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  case
    minimum >=. 0.0
    && maximum >. minimum
    && maximum <=. 100.0
    && step >. 0.0
    && step <=. maximum
    && { maximum -. minimum } /. step <=. 999.0
  {
    False -> h.p([a.role("alert")], [h.text("Invalid rating bounds or step.")])
    True -> {
      let count =
        float.floor({ maximum -. minimum } /. step +. 0.000001)
        |> float.truncate
      let scores =
        list.index_map(list.repeat(Nil, count + 1), fn(_, index) {
          float.to_precision(minimum +. int.to_float(index) *. step, 6)
        })
      let selected =
        option.map(value, fn(value) {
          let index =
            float.round({ value -. minimum } /. step) |> int.clamp(0, count)
          float.to_precision(minimum +. int.to_float(index) *. step, 6)
        })
      let smallest =
        list.fold(scores, step, fn(smallest, score) {
          let fraction = float.to_precision(score -. float.floor(score), 6)
          case fraction >. 0.0 {
            True -> float.min(smallest, fraction)
            False -> smallest
          }
        })
      let unit =
        float.max(42.0, float.ceiling(24.0 /. smallest)) |> float.to_string
      fieldset.view(
        label,
        [
          a.class("meridian-rating meridian-rating-precise"),
          a.role("radiogroup"),
          ..attrs
        ],
        [
          h.div(
            [
              a.class("meridian-rating-options"),
              a.data("meridian-keys", "rating"),
            ],
            [
              case minimum == 0.0 {
                True ->
                  h.label(
                    [a.class("meridian-rating-choice meridian-rating-zero")],
                    [
                      choice(name, 0.0, selected, required, on_change),
                      h.span([], [h.text("0")]),
                    ],
                  )
                False -> element.none()
              },
              ..list.index_map(
                list.repeat(Nil, maximum |> float.ceiling |> float.truncate),
                fn(_, index) {
                  let lower = int.to_float(index)
                  let choices =
                    list.filter(scores, fn(score) {
                      score >. lower && score <=. lower +. 1.0
                    })
                  h.span(
                    [
                      a.class("meridian-rating-slot"),
                      a.style("--rating-unit", unit <> "px"),
                    ],
                    [
                      h.span(
                        [
                          a.class("meridian-rating-base"),
                          a.aria_hidden(True),
                          filled(selected, lower +. 1.0),
                        ],
                        [star()],
                      ),
                      ..list.index_map(choices, fn(score, position) {
                        h.label(
                          [
                            a.class("meridian-rating-choice"),
                            filled(selected, score),
                            a.style(
                              "inline-size",
                              float.to_string({ score -. lower } *. 100.0)
                                <> "%",
                            ),
                            a.style(
                              "z-index",
                              int.to_string(list.length(choices) - position),
                            ),
                          ],
                          [
                            choice(name, score, selected, required, on_change),
                            star(),
                            h.span([a.class("meridian-rating-score")], [
                              h.text(score_text(score)),
                            ]),
                          ],
                        )
                      })
                    ],
                  )
                },
              )
            ],
          ),
          case required {
            True -> element.none()
            False ->
              button.text(
                [a.disabled(selected == None), event.on_click(on_change(None))],
                [h.text("Clear rating")],
              )
          },
        ],
      )
    }
  }
}

fn choice(
  name: String,
  score: Float,
  selected: Option(Float),
  required: Bool,
  on_change: fn(Option(Float)) -> msg,
) -> Element(msg) {
  let text = score_text(score)
  h.input([
    a.type_("radio"),
    a.data("meridian-item", "true"),
    a.name(name),
    a.value(text),
    a.aria_label(
      text
      <> case score == 1.0 {
        True -> " star"
        False -> " stars"
      },
    ),
    a.checked(selected == Some(score)),
    a.required(required),
    event.on_check(fn(_) { on_change(Some(score)) }),
  ])
}

fn filled(selected: Option(Float), score: Float) -> Attribute(msg) {
  a.data("filled", case selected {
    Some(value) if score <=. value -> "true"
    _ -> "false"
  })
}

fn score_text(score: Float) -> String {
  let text = float.to_string(score)
  case string.ends_with(text, ".0") {
    True -> string.drop_end(text, 2)
    False -> text
  }
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
