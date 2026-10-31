import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/hierarchy.{type Node}
import meridian_ui/selection.{type Mode, Multiple}

pub type Model {
  Model(expanded: List(String), selected: List(String))
}

pub type Action {
  Expand(String)
  Select(String)
}

pub fn update(model: Model, action: Action, mode: Mode) -> Model {
  case action {
    Expand(id) ->
      Model(..model, expanded: selection.toggle(model.expanded, id, Multiple))
    Select(id) ->
      Model(..model, selected: selection.toggle(model.selected, id, mode))
  }
}

pub fn view(
  label: String,
  mode: Mode,
  model: Model,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
  nodes: List(Node),
) -> Element(msg) {
  case hierarchy.validate(nodes) {
    Error(_) -> h.p([a.role("alert")], [h.text("Invalid tree options.")])
    Ok(_) ->
      h.ul(
        [
          a.class("meridian-tree"),
          a.role("tree"),
          a.aria_label(label),
          a.aria_multiselectable(mode == Multiple),
          a.data("meridian-tree", "true"),
          ..attrs
        ],
        branches(nodes, 1, "", model, on_action),
      )
  }
}

fn branches(
  nodes: List(Node),
  level: Int,
  parent: String,
  model: Model,
  on_action: fn(Action) -> msg,
) -> List(Element(msg)) {
  list.index_map(nodes, fn(node, index) {
    let expanded = list.contains(model.expanded, node.id)
    h.li(
      [
        a.role("treeitem"),
        a.tabindex(-1),
        a.aria_selected(list.contains(model.selected, node.id)),
        a.aria_disabled(node.disabled),
        a.attribute("aria-level", int.to_string(level)),
        a.attribute("aria-posinset", int.to_string(index + 1)),
        a.attribute("aria-setsize", int.to_string(list.length(nodes))),
        case node.children {
          [] -> a.none()
          _ -> a.aria_expanded(expanded)
        },
        a.data("tree-id", node.id),
        a.data("tree-parent", parent),
      ],
      [
        h.div([a.class("meridian-tree-row")], [
          case node.children {
            [] -> h.span([a.class("meridian-tree-spacer")], [])
            _ ->
              h.span(
                [
                  a.class("meridian-tree-toggle"),
                  a.aria_hidden(True),
                  a.data("tree-expand", "true"),
                  case node.disabled {
                    True -> a.none()
                    False ->
                      event.on_click(on_action(Expand(node.id)))
                      |> event.stop_propagation
                  },
                ],
                [
                  h.text(case expanded {
                    True -> "-"
                    False -> "+"
                  }),
                ],
              )
          },
          h.span(
            [
              a.data("tree-select", "true"),
              case node.disabled {
                True -> a.none()
                False ->
                  event.on_click(on_action(Select(node.id)))
                  |> event.stop_propagation
              },
            ],
            [h.text(node.label)],
          ),
        ]),
        case node.children {
          [] -> element.none()
          children ->
            h.ul(
              [a.role("group"), a.hidden(!expanded)],
              branches(children, level + 1, node.id, model, on_action),
            )
        },
      ],
    )
  })
}
