import gleam/list
import gleam/result
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/fieldset
import meridian_ui/selection.{type Mode, Multiple, Single}

pub type Choice {
  Choice(value: String, label: String, disabled: Bool)
}

pub type Action {
  Toggle(String)
  Clear
}

pub fn update(
  values: List(String),
  action: Action,
  mode: Mode,
) -> List(String) {
  case action {
    Toggle(value) -> selection.toggle(values, value, mode)
    Clear -> []
  }
}

pub fn view(
  label: String,
  name: String,
  mode: Mode,
  required: Bool,
  values: List(String),
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  choices: List(Choice),
) -> Element(msg) {
  let first_enabled =
    list.find(choices, fn(choice) { !choice.disabled })
    |> result.map(fn(choice) { choice.value })
    |> result.unwrap("")
  let selected = case mode {
    Single -> list.take(values, 1)
    Multiple -> values
  }
  let valid_values =
    list.filter(selected, fn(value) {
      list.any(choices, fn(choice) { choice.value == value && !choice.disabled })
    })
  fieldset.view(
    label,
    [
      a.class("meridian-select-button"),
      a.role(case mode {
        Single -> "radiogroup"
        Multiple -> "group"
      }),
      ..attrs
    ],
    [
      h.div(
        [a.class("meridian-select-button-options")],
        list.map(choices, fn(choice) {
          h.label([a.class("meridian-select-choice")], [
            h.input([
              a.type_(case mode {
                Single -> "radio"
                Multiple -> "checkbox"
              }),
              a.name(name),
              a.value(choice.value),
              a.checked(list.contains(selected, choice.value)),
              a.disabled(choice.disabled),
              a.required(
                required
                && case mode {
                  Single -> True
                  Multiple ->
                    valid_values == [] && choice.value == first_enabled
                },
              ),
              event.on_check(fn(_) { on_action(Toggle(choice.value)) }),
            ]),
            h.span([], [h.text(choice.label)]),
          ])
        }),
      ),
      case required {
        True -> element.none()
        False ->
          button.text(
            [a.disabled(selected == []), event.on_click(on_action(Clear))],
            [h.text("Clear selection")],
          )
      },
    ],
  )
}
