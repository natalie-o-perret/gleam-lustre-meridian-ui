import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/field
import meridian_ui/fieldset
import meridian_ui/hierarchy.{type Node}

pub type Action {
  Choose(level: Int, value: String)
}

pub fn update(path: List(String), action: Action) -> List(String) {
  let Choose(level, value) = action
  choose(path, level, value)
}

pub fn choose(path: List(String), level: Int, value: String) -> List(String) {
  let prefix = list.take(path, int.max(level, 0))
  case value {
    "" -> prefix
    _ -> list.append(prefix, [value])
  }
}

pub fn leaf_value(nodes: List(Node), path: List(String)) -> Option(String) {
  case path {
    [] -> None
    [id, ..rest] ->
      case list.find(nodes, fn(node) { node.id == id && !node.disabled }) {
        Error(_) -> None
        Ok(node) ->
          case rest, node.children {
            [], [] -> Some(id)
            [_, ..], [_, ..] -> leaf_value(node.children, rest)
            _, _ -> None
          }
      }
  }
}

pub fn view(
  id: String,
  label: String,
  name: String,
  path: List(String),
  required: Bool,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  nodes: List(Node),
) -> Element(msg) {
  case hierarchy.validate(nodes) {
    Error(_) -> h.p([a.role("alert")], [h.text("Invalid selection options.")])
    Ok(_) ->
      fieldset.view(label, [a.class("meridian-cascade-select"), ..attrs], [
        field.fluid(
          [a.class("meridian-cascade-levels")],
          levels(id, label, nodes, path, 0, required, on_action),
        ),
        case leaf_value(nodes, path) {
          None -> element.none()
          Some(value) ->
            h.input([a.type_("hidden"), a.name(name), a.value(value)])
        },
      ])
  }
}

fn levels(
  id: String,
  label: String,
  nodes: List(Node),
  remaining: List(String),
  level: Int,
  required: Bool,
  on_action: fn(Action) -> msg,
) -> List(Element(msg)) {
  let chosen = case remaining {
    [value, ..] -> value
    [] -> ""
  }
  let selected =
    list.find(nodes, fn(node) { node.id == chosen && !node.disabled })
  let valid = case selected {
    Ok(_) -> True
    Error(_) -> False
  }
  let control =
    h.label([a.class("meridian-cascade-level")], [
      h.span([], [h.text(label <> ": level " <> int.to_string(level + 1))]),
      field.select(
        [
          a.id(id <> "-level-" <> int.to_string(level)),
          a.aria_label(label <> ": level " <> int.to_string(level + 1)),
          a.required(required),
          event.on_input(fn(value) { on_action(Choose(level, value)) }),
        ],
        [
          h.option([a.value(""), a.selected(!valid)], "Choose an option"),
          ..list.map(nodes, fn(node) {
            field.option(
              [
                a.value(node.id),
                a.selected(valid && chosen == node.id),
                a.disabled(node.disabled),
              ],
              [h.text(node.label)],
            )
          })
        ],
      ),
    ])
  case selected, remaining {
    Ok(node), [_, ..rest] ->
      case node.children {
        [] -> [control]
        children -> [
          control,
          ..levels(id, label, children, rest, level + 1, required, on_action)
        ]
      }
    _, _ -> [control]
  }
}
