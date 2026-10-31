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
            h.tr(
              [
                a.data("tree-row", entry.node.id),
                a.data("tree-depth", int.to_string(entry.level - 1)),
                a.style("--tree-depth", int.to_string(entry.level - 1)),
              ],
              [
                h.th(
                  [
                    a.scope("row"),
                    a.style(
                      "padding-inline-start",
                      "calc(12px + " <> int.to_string(entry.level - 1) <> "rem)",
                    ),
                  ],
                  [
                    case entry.node.children {
                      [] ->
                        h.span([a.class("meridian-tree-table-label")], [
                          h.span(
                            [
                              a.class("meridian-tree-spacer"),
                              a.aria_hidden(True),
                            ],
                            [],
                          ),
                          h.text(entry.node.label),
                        ])
                      _ ->
                        button.text(
                          [
                            a.class("meridian-tree-table-toggle"),
                            a.data("tree-table-toggle", entry.node.id),
                            a.disabled(entry.node.disabled),
                            a.aria_expanded(list.contains(
                              expanded,
                              entry.node.id,
                            )),
                            event.on_click(on_toggle(entry.node.id)),
                          ],
                          [
                            h.span(
                              [
                                a.class("meridian-tree-toggle"),
                                a.aria_hidden(True),
                              ],
                              [
                                h.text(
                                  case list.contains(expanded, entry.node.id) {
                                    True -> "-"
                                    False -> "+"
                                  },
                                ),
                              ],
                            ),
                            h.text(entry.node.label),
                          ],
                        )
                    },
                  ],
                ),
                ..list.map(columns, fn(column) {
                  h.td([], [column.cell(entry.node)])
                })
              ],
            )
          }),
        ),
      ]),
    ],
  )
}
