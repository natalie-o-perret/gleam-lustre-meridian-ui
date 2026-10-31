import gleam/list
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/fieldset
import meridian_ui/hierarchy.{type Node}
import meridian_ui/selection.{type Mode}
import meridian_ui/tree

/// The tree stays inline, so selection and disclosure are available without a popup.
pub fn view(
  label: String,
  name: String,
  mode: Mode,
  model: tree.Model,
  on_action: fn(tree.Action) -> msg,
  attrs: List(Attribute(msg)),
  nodes: List(Node),
) -> Element(msg) {
  let choices =
    hierarchy.all(nodes)
    |> list.filter(fn(node) {
      !node.disabled && list.contains(model.selected, node.id)
    })
  fieldset.view(label, [a.class("meridian-tree-select"), ..attrs], [
    h.p([a.role("status")], [
      h.text(case choices {
        [] -> "No selection"
        _ ->
          "Selected: "
          <> string.join(list.map(choices, fn(node) { node.label }), ", ")
      }),
    ]),
    tree.view(label <> " options", mode, model, on_action, [], nodes),
    h.div(
      [],
      list.map(choices, fn(node) {
        h.input([a.type_("hidden"), a.name(name), a.value(node.id)])
      }),
    ),
  ])
}
