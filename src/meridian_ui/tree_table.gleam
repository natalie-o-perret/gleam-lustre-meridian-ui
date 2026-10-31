import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/hierarchy.{type Node}

pub type Column(msg) {
  Column(label: String, cell: fn(Node) -> Element(msg))
}

/// Native table navigation and disclosure buttons avoid a partial treegrid keyboard model.
pub fn view(
  label: String,
  expanded: List(String),
  on_toggle: fn(String) -> msg,
  attrs: List(Attribute(msg)),
  columns: List(Column(msg)),
  nodes: List(Node),
) -> Element(msg) {
  h.div(
    [
      a.class("meridian-table-scroll"),
      a.tabindex(0),
      a.role("region"),
      a.aria_label(label),
      ..attrs
    ],
    [
      h.table([a.class("meridian-tree-table")], [
        h.caption([], [h.text(label)]),
        h.thead([], [
          h.tr([], [
            h.th([a.scope("col")], [h.text("Name")]),
            ..list.map(columns, fn(column) {
              h.th([a.scope("col")], [h.text(column.label)])
            })
          ]),
        ]),
        h.tbody(
          [],
          list.map(hierarchy.entries(nodes, expanded), fn(entry) {
            h.tr([], [
              h.th(
                [
                  a.scope("row"),
                  a.style(
                    "padding-inline-start",
                    int.to_string(entry.level - 1) <> "rem",
                  ),
                ],
                [
                  case entry.node.children {
                    [] -> h.text(entry.node.label)
                    _ ->
                      button.text(
                        [
                          a.disabled(entry.node.disabled),
                          a.aria_expanded(list.contains(expanded, entry.node.id)),
                          event.on_click(on_toggle(entry.node.id)),
                        ],
                        [h.text(entry.node.label)],
                      )
                  },
                ],
              ),
              ..list.map(columns, fn(column) {
                h.td([], [column.cell(entry.node)])
              })
            ])
          }),
        ),
      ]),
    ],
  )
}
