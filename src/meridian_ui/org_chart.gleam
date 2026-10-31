import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/hierarchy.{type Node}

/// Nested lists expose the reporting hierarchy without relying on connector lines.
pub fn view(
  label: String,
  attrs: List(Attribute(msg)),
  nodes: List(Node),
  render: fn(Node) -> Element(msg),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-org-chart"),
      a.role("region"),
      a.aria_label(label),
      a.tabindex(0),
      ..attrs
    ],
    [branches(nodes, render)],
  )
}

fn branches(
  nodes: List(Node),
  render: fn(Node) -> Element(msg),
) -> Element(msg) {
  h.ul(
    [a.role("list")],
    list.map(nodes, fn(node) {
      h.li([], [
        h.div([a.class("meridian-org-node")], [render(node)]),
        case node.children {
          [] -> element.none()
          children -> branches(children, render)
        },
      ])
    }),
  )
}
