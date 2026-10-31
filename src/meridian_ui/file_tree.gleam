import gleam/list
import gleam/set
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/hierarchy
import meridian_ui/icon
import meridian_ui/selection.{type Mode}
import meridian_ui/tree

pub type Entry {
  File(id: String, name: String, disabled: Bool)
  Folder(id: String, name: String, disabled: Bool, children: List(Entry))
}

/// Caller-owned files, expansion and selection. No filesystem access or file mutations.
/// Use tree.update for actions. IDs must be unique, including empty folders.
pub fn view(
  label: String,
  mode: Mode,
  model: tree.Model,
  on_action: fn(tree.Action) -> msg,
  attrs: List(Attribute(msg)),
  entries: List(Entry),
) -> Element(msg) {
  let folders = folder_ids(entries) |> set.from_list
  tree.view_with(
    label,
    mode,
    model,
    on_action,
    [a.class("meridian-file-tree"), ..attrs],
    list.map(entries, node),
    fn(node) {
      h.span([a.class("meridian-file-tree-label")], [
        icon.view(
          case set.contains(folders, node.id) {
            True -> icon.Folder
            False -> icon.File
          },
          [],
        ),
        h.text(node.label),
      ])
    },
  )
}

fn node(entry: Entry) -> hierarchy.Node {
  case entry {
    File(id, name, disabled) -> hierarchy.Node(id, name, disabled, [])
    Folder(id, name, disabled, children) ->
      hierarchy.Node(id, name, disabled, list.map(children, node))
  }
}

fn folder_ids(entries: List(Entry)) -> List(String) {
  list.flat_map(entries, fn(entry) {
    case entry {
      File(..) -> []
      Folder(id, _, _, children) -> [id, ..folder_ids(children)]
    }
  })
}
