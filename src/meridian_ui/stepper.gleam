import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import meridian_ui/orientation.{type Orientation}
import meridian_ui/tabs

pub type Step(msg) {
  Step(
    id: String,
    label: String,
    complete: Bool,
    disabled: Bool,
    on_select: msg,
    children: List(Element(msg)),
  )
}

/// In linear mode a step is reachable only after every preceding step is complete.
pub fn can_enter(steps: List(Step(msg)), target: String, linear: Bool) -> Bool {
  case steps {
    [] -> False
    [step, ..rest] ->
      case step.id == target {
        True -> !step.disabled
        False ->
          case linear && !step.complete {
            True -> False
            False -> can_enter(rest, target, linear)
          }
      }
  }
}

pub fn view(
  id: String,
  label: String,
  active: String,
  direction: Orientation,
  linear: Bool,
  attrs: List(Attribute(msg)),
  steps: List(Step(msg)),
) -> Element(msg) {
  tabs.view(
    id,
    label,
    active,
    direction,
    tabs.Manual,
    [a.class("meridian-stepper"), ..attrs],
    list.index_map(steps, fn(step, index) {
      tabs.Tab(
        step.id,
        int.to_string(index + 1)
          <> ". "
          <> step.label
          <> case step.complete {
          True -> " (complete)"
          False -> ""
        },
        !can_enter(steps, step.id, linear),
        step.on_select,
        [
          a.data("complete", case step.complete {
            True -> "true"
            False -> "false"
          }),
          a.attribute("aria-current", case step.id == active {
            True -> "step"
            False -> "false"
          }),
        ],
        step.children,
      )
    }),
  )
}
