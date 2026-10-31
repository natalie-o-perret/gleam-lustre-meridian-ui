import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/set.{type Set}
import gleam/string

pub type Node {
  Node(id: String, label: String, disabled: Bool, children: List(Node))
}

pub type Entry {
  Entry(node: Node, level: Int, parent: String, position: Int, siblings: Int)
}

pub fn entries(nodes: List(Node), expanded: List(String)) -> List(Entry) {
  walk(nodes, set.from_list(expanded), 1, "", []) |> list.reverse
}

fn walk(
  nodes: List(Node),
  expanded: Set(String),
  level: Int,
  parent: String,
  acc: List(Entry),
) -> List(Entry) {
  let count = list.length(nodes)
  list.index_fold(nodes, acc, fn(acc, node, index) {
    let acc = [Entry(node, level, parent, index + 1, count), ..acc]
    case set.contains(expanded, node.id) {
      True -> walk(node.children, expanded, level + 1, node.id, acc)
      False -> acc
    }
  })
}

pub fn validate(nodes: List(Node)) -> Result(Nil, String) {
  validate_with(nodes, set.new()) |> result.map(fn(_) { Nil })
}

fn validate_with(
  nodes: List(Node),
  seen: Set(String),
) -> Result(Set(String), String) {
  case nodes {
    [] -> Ok(seen)
    [node, ..rest] ->
      case
        node.id == ""
        || string.trim(node.label) == ""
        || set.contains(seen, node.id)
      {
        True ->
          Error(
            "Node IDs and labels must be non-empty, and IDs must be unique.",
          )
        False -> {
          use seen <- result.try(validate_with(
            node.children,
            set.insert(seen, node.id),
          ))
          validate_with(rest, seen)
        }
      }
  }
}

pub fn find_path(nodes: List(Node), id: String) -> Option(List(String)) {
  case nodes {
    [] -> None
    [node, ..rest] ->
      case node.id == id {
        True -> Some([id])
        False ->
          case find_path(node.children, id) {
            Some(path) -> Some([node.id, ..path])
            None -> find_path(rest, id)
          }
      }
  }
}

pub fn all(nodes: List(Node)) -> List(Node) {
  collect(nodes, set.new(), True, []) |> list.reverse
}

pub fn visible(nodes: List(Node), expanded: List(String)) -> List(Node) {
  collect(nodes, set.from_list(expanded), False, []) |> list.reverse
}

fn collect(
  nodes: List(Node),
  expanded: Set(String),
  all: Bool,
  acc: List(Node),
) -> List(Node) {
  case nodes {
    [] -> acc
    [node, ..rest] -> {
      let acc = [node, ..acc]
      let acc = case all || set.contains(expanded, node.id) {
        True -> collect(node.children, expanded, all, acc)
        False -> acc
      }
      collect(rest, expanded, all, acc)
    }
  }
}
