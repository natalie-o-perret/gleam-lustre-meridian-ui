import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import lustre/attribute as a
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/badge
import meridian_ui/button
import meridian_ui/card
import meridian_ui/data_view
import meridian_ui/field
import meridian_ui/file_tree
import meridian_ui/filter_service
import meridian_ui/hierarchy
import meridian_ui/icon
import meridian_ui/order_list
import meridian_ui/org_chart
import meridian_ui/orientation
import meridian_ui/paginator
import meridian_ui/pick_list
import meridian_ui/selection
import meridian_ui/table
import meridian_ui/timeline
import meridian_ui/toggle_switch
import meridian_ui/tree
import meridian_ui/tree_select
import meridian_ui/tree_table
import meridian_ui/virtual_scroller

pub type Model {
  Model(
    tree: tree.Model,
    files: tree.Model,
    table: table.Model,
    order: List(String),
    target: List(String),
    page: Int,
    grid: Bool,
    viewport: virtual_scroller.Viewport,
    query: String,
    props: common.Properties,
    records: List(String),
    total: Int,
    loading: Bool,
    error: Option(String),
    request_id: Int,
  )
}

pub type Msg {
  Tree(tree.Action)
  Files(tree.Action)
  Table(table.Action)
  Order(order_list.Action)
  Pick(pick_list.Action)
  Page(Int)
  Size(Int)
  Grid(Bool)
  Scroll(virtual_scroller.Viewport)
  Query(String)
  Properties(common.Properties)
  Loaded(Int, List(String), Int)
  LoadFailed(Int)
  Retry
}

pub fn start(component: String) {
  common.start_with_effect(
    Model(
      tree.Model([], []),
      tree.Model(["src"], []),
      table.Model("", None, [], 0, 3),
      ["Design", "Build", "Review"],
      [],
      0,
      True,
      virtual_scroller.Viewport(0, 320),
      "",
      dict.new(),
      list.take(names(), 3),
      list.length(names()),
      False,
      None,
      0,
    ),
    update_with_effect,
    Properties,
    fn(model) {
      case component {
        "dataview" -> data_view_example(model)
        "orderlist" -> order_list_example(model)
        "organizationchart" -> organization_chart(model)
        "paginator" -> paginator_example(model)
        "picklist" -> pick_list_example(model)
        "table" -> table_example(model)
        "timeline" -> timeline_example(model)
        "tree" -> tree_example(model)
        "treeselect" -> tree_select_example(model)
        "treetable" -> tree_table_example(model)
        "virtualscroller" -> virtual_scroller_example(model)
        "filterservice" -> filter_service_example(model)
        "filetree" -> file_tree_example(model)
        _ -> common.missing()
      }
    },
  )
}

fn items(model: Model, ids: List(String)) -> List(order_list.Item(Msg)) {
  list.map(ids, fn(id) {
    order_list.Item(
      id,
      id,
      id == "Build" && common.flag(model.props, "lockBuild", False),
      case common.flag(model.props, "descriptions", False) {
        True -> [
          h.p([], [
            h.text(case id {
              "Design" -> "Sketch the flow and agree on scope."
              "Build" -> "Build the smallest working change."
              _ -> "Check behaviour before publishing."
            }),
          ]),
        ]
        False -> []
      },
    )
  })
}

fn nodes(props: common.Properties) -> List(hierarchy.Node) {
  common.items(
    props,
    list.map(common.nodes(), fn(node) {
      hierarchy.Node(
        ..node,
        disabled: node.id == "engineering"
          && common.flag(props, "lockTeam", False),
        children: case common.flag(props, "children", True) {
          True -> node.children
          False -> []
        },
      )
    }),
  )
}

fn node_content(
  node: hierarchy.Node,
  props: common.Properties,
) -> Element(Msg) {
  common.row([
    h.text(node.label),
    case common.property(props, "content", "plain") {
      "tags" ->
        badge.view(badge.Accent, [], [
          h.text(case node.children {
            [] -> "Team"
            _ -> "Group"
          }),
        ])
      _ -> h.text("")
    },
  ])
}

fn appearance(props: common.Properties) {
  tree.appearance(
    common.flag(props, "lines", True),
    common.flag(props, "boxed", True),
    common.flag(props, "animate", True),
  )
}

fn names() {
  [
    "Atlas",
    "Beacon",
    "Cascade",
    "Drift",
    "Éire",
    "Fieldnote",
    "Harbour",
    "Meridian",
  ]
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        query: common.property(props, "query", model.query),
        page: common.number(props, "page", model.page),
        grid: common.flag(props, "grid", model.grid),
        viewport: virtual_scroller.Viewport(
          ..model.viewport,
          height: common.number(props, "viewport", model.viewport.height),
        ),
        tree: tree.Model(
          selected: common.selected(
            dict.merge(model.props, props),
            model.tree.selected,
            selection.Multiple,
          ),
          expanded: case dict.get(props, "expanded") {
            Ok("true") -> ["design", "engineering"]
            Ok("false") -> []
            _ -> model.tree.expanded
          },
        ),
        files: tree.Model(
          selected: common.selected(
            dict.merge(model.props, props),
            model.files.selected,
            selection.Single,
          ),
          expanded: case dict.get(props, "expanded") {
            Ok("true") -> ["src", "src/components", "test"]
            Ok("false") -> []
            _ -> model.files.expanded
          },
        ),
        table: table.Model(
          ..model.table,
          query: common.property(props, "query", model.table.query),
          size: common.number(props, "size", model.table.size),
          page: 0,
        ),
      )
    Tree(action) ->
      Model(
        ..model,
        tree: tree.update(
          model.tree,
          action,
          common.mode(model.props, selection.Multiple),
        ),
      )
    Files(action) ->
      Model(
        ..model,
        files: tree.update(
          model.files,
          action,
          common.mode(model.props, selection.Single),
        ),
      )
    Table(action) -> Model(..model, table: table.update(model.table, action))
    Order(order_list.Move(id, position)) ->
      Model(
        ..model,
        order: order_list.move(items(model, model.order), id, position)
          |> list.map(fn(item) { item.id }),
      )
    Pick(action) -> {
      let changed =
        pick_list.update(
          pick_list.Model(items(model, model.order), items(model, model.target)),
          action,
        )
      Model(
        ..model,
        order: list.map(changed.source, fn(item) { item.id }),
        target: list.map(changed.target, fn(item) { item.id }),
      )
    }
    Page(page) -> Model(..model, page: page)
    Size(size) ->
      Model(
        ..model,
        page: 0,
        props: dict.insert(model.props, "size", int.to_string(size)),
      )
    Grid(value) -> Model(..model, grid: value)
    Scroll(viewport) -> Model(..model, viewport: viewport)
    Query(value) -> Model(..model, query: value)
    Loaded(id, records, total) ->
      case id == model.request_id && server_mode(model) {
        True ->
          Model(
            ..model,
            records: records,
            total: total,
            loading: False,
            error: None,
          )
        False -> model
      }
    LoadFailed(id) ->
      case id == model.request_id && server_mode(model) {
        True ->
          Model(
            ..model,
            loading: False,
            error: Some("The example request failed. Retry the request."),
          )
        False -> model
      }
    Retry -> model
  }
}

fn server_mode(model: Model) -> Bool {
  common.property(model.props, "mode", "client") == "server"
}

fn update_with_effect(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  let changed = update(model, msg)
  let refetch = case msg {
    Retry -> True
    Properties(props) ->
      list.any(["mode", "empty", "fail", "latency"], fn(name) {
        dict.has_key(props, name)
      })
    _ -> False
  }
  case
    server_mode(changed)
    && { refetch || table.request(model.table) != table.request(changed.table) }
  {
    False -> #(changed, effect.none())
    True -> {
      let id = model.request_id + 1
      let request = table.request(changed.table)
      #(
        Model(..changed, loading: True, error: None, request_id: id),
        effect.from(fn(dispatch) {
          after(common.number(changed.props, "latency", 400), fn() {
            case common.flag(changed.props, "fail", False) {
              True -> dispatch(LoadFailed(id))
              False -> {
                // Local mock backend. Replace this effect with your HTTP request.
                let filtered =
                  table.rows(
                    common.items(changed.props, names()),
                    table.Model(
                      request.query,
                      request.sort,
                      [],
                      0,
                      request.limit,
                    ),
                    fn(name) { name },
                    [
                      table.Column(
                        "name",
                        "Project",
                        Some(string.compare),
                        h.text,
                      ),
                    ],
                  )
                dispatch(Loaded(
                  id,
                  filtered
                    |> list.drop(request.offset)
                    |> list.take(request.limit),
                  list.length(filtered),
                ))
              }
            }
          })
        }),
      )
    }
  }
}

@external(javascript, "../catalogue_data_ffi.mjs", "after")
fn after(milliseconds: Int, done: fn() -> Nil) -> Nil

pub fn data_view_example(model: Model) -> Element(Msg) {
  common.stack([
    toggle_switch.view("Grid layout", [a.checked(model.grid), e.on_check(Grid)]),
    data_view.view(
      "Projects",
      case model.grid {
        True -> data_view.Grid
        False -> data_view.List
      },
      model.page,
      common.number(model.props, "size", 4),
      Page,
      [],
      names()
        |> list.filter(fn(name) {
          filter_service.text(name, model.query, filter_service.Contains)
        }),
      fn(name) {
        h.article([a.class("demo-project")], [
          h.h2([], [h.text(name)]),
          case common.flag(model.props, "details", True) {
            True -> h.p([], [h.text("A place for your team's next idea.")])
            False -> h.text("")
          },
        ])
      },
    ),
  ])
}

pub fn order_list_example(model: Model) -> Element(Msg) {
  order_list.view(
    common.property(model.props, "label", "Project stages"),
    Order,
    [],
    common.items(model.props, items(model, model.order)),
  )
}

pub fn file_tree_example(model: Model) -> Element(Msg) {
  common.stack([
    file_tree.view(
      common.property(model.props, "label", "Project files"),
      common.mode(model.props, selection.Single),
      model.files,
      Files,
      appearance(model.props),
      common.items(model.props, [
        file_tree.Folder("src", "src", False, [
          file_tree.File("src/app.gleam", "app.gleam", False),
          file_tree.Folder("src/components", "components", False, [
            file_tree.File("src/components/header.gleam", "header.gleam", False),
          ]),
        ]),
        file_tree.Folder("test", "test", False, []),
        file_tree.File("gleam.toml", "gleam.toml", False),
        file_tree.File(
          "secrets.env",
          "secrets.env",
          common.flag(model.props, "lockSecrets", True),
        ),
      ]),
    ),
    h.p([a.role("status")], [
      h.text("Selected: " <> string.join(model.files.selected, ", ")),
    ]),
  ])
}

pub fn organization_chart(model: Model) -> Element(Msg) {
  org_chart.view(
    common.property(model.props, "label", "Organisation"),
    [],
    nodes(model.props),
    fn(node) { node_content(node, model.props) },
  )
}

pub fn paginator_example(model: Model) -> Element(Msg) {
  let total = common.number(model.props, "total", list.length(names()))
  let size = common.number(model.props, "size", 3)
  let records =
    list.index_map(list.repeat(Nil, total), fn(_, index) {
      names()
      |> list.drop(index)
      |> list.first
      |> result.unwrap("Project " <> int.to_string(index + 1))
    })
  common.stack([
    h.ul(
      [],
      list.map(paginator.slice(records, model.page, size), fn(name) {
        h.li([], [h.text(name)])
      }),
    ),
    paginator.with_sizes(
      "Project pages",
      total,
      size,
      model.page,
      Page,
      Size,
      common.property(model.props, "sizes", "3,5,10,25,50")
        |> string.split(",")
        |> list.filter_map(fn(value) { int.parse(string.trim(value)) }),
      [],
    ),
  ])
}

pub fn pick_list_example(model: Model) -> Element(Msg) {
  pick_list.view(
    common.property(model.props, "label", "Available stages"),
    common.property(model.props, "targetLabel", "Selected stages"),
    pick_list.Model(
      common.items(model.props, items(model, model.order)),
      items(model, model.target),
    ),
    Pick,
    [],
  )
}

pub fn table_example(model: Model) -> Element(Msg) {
  let label = common.property(model.props, "label", "Projects")
  let columns = [
    case server_mode(model) {
      True -> table.ServerColumn("name", "Project", True, h.text)
      False -> table.Column("name", "Project", Some(string.compare), h.text)
    },
    table.Column("notes", "Editable notes", None, fn(name) {
      field.input([
        a.aria_label("Notes for " <> name),
        a.default_value("Draft for " <> name),
      ])
    }),
  ]
  case server_mode(model) {
    True -> {
      let request = table.request(model.table)
      common.stack([
        h.p([], [
          h.text(
            "This example uses a delayed local mock backend. The caller owns fetching, request IDs, retries and the matching total.",
          ),
        ]),
        table.remote(
          label,
          model.table,
          model.total,
          model.loading,
          model.error,
          Table,
          [],
          model.records,
          fn(name) { name },
          columns,
        ),
        case model.error {
          Some(_) -> button.view([e.on_click(Retry)], [h.text("Retry request")])
          None -> h.text("")
        },
        h.pre([a.id("server-request")], [
          h.text(
            "Request "
            <> int.to_string(model.request_id)
            <> "\nquery: "
            <> request.query
            <> "\nsort: "
            <> case request.sort {
              None -> "original order"
              Some(table.Sort(column, direction)) ->
                column
                <> case direction {
                  table.Ascending -> " ascending"
                  table.Descending -> " descending"
                }
            }
            <> "\noffset: "
            <> int.to_string(request.offset)
            <> "\nlimit: "
            <> int.to_string(request.limit)
            <> "\ndelay: "
            <> common.property(model.props, "latency", "400")
            <> "ms",
          ),
        ]),
      ])
    }
    False ->
      table.view(
        label,
        model.table,
        Table,
        [],
        common.items(model.props, names()),
        fn(name) { name },
        fn(name) { name },
        columns,
      )
  }
}

pub fn timeline_example(model: Model) -> Element(Msg) {
  let events =
    common.items(model.props, [
      timeline.Event("Project created", "2026-11-01", "1 Nov", [
        h.text("The team started planning."),
      ]),
      timeline.Event("Design approved", "2026-11-04", "4 Nov", [
        h.text("Ready for development."),
      ]),
      timeline.Event("First release", "2026-11-10", "10 Nov", [
        h.text("The first version is live."),
      ]),
    ])
  let events = case common.flag(model.props, "reverse", False) {
    True -> list.reverse(events)
    False -> events
  }
  timeline.view_with(
    "Project history",
    common.orientation(model.props, orientation.Vertical),
    case common.property(model.props, "alignment", "start") {
      "end" -> timeline.End
      "alternate" -> timeline.Alternate
      _ -> timeline.Start
    },
    [],
    events,
    fn(event) {
      let render = case common.flag(model.props, "cards", False) {
        True -> card.article
        False -> h.div
      }
      render([], [h.h3([], [h.text(event.label)]), ..event.children])
    },
    fn(event) {
      case common.flag(model.props, "opposite", True) {
        True -> h.time([a.datetime(event.datetime)], [h.text(event.time_label)])
        False -> h.text("")
      }
    },
    fn(_) {
      case common.property(model.props, "marker", "dot") {
        "icon" -> icon.view(icon.Check, [])
        _ -> h.span([a.class("meridian-timeline-dot")], [])
      }
    },
  )
}

pub fn tree_example(model: Model) -> Element(Msg) {
  tree.view_with(
    common.property(model.props, "label", "Workspace teams"),
    common.mode(model.props, selection.Multiple),
    model.tree,
    Tree,
    appearance(model.props),
    nodes(model.props),
    fn(node) { node_content(node, model.props) },
  )
}

pub fn tree_select_example(model: Model) -> Element(Msg) {
  tree_select.view(
    common.property(model.props, "label", "Choose teams"),
    "teams",
    common.mode(model.props, selection.Multiple),
    model.tree,
    Tree,
    common.attrs(model.props, appearance(model.props)),
    nodes(model.props),
  )
}

pub fn tree_table_example(model: Model) -> Element(Msg) {
  tree_table.view(
    common.property(model.props, "label", "Workspace hierarchy"),
    model.tree.expanded,
    fn(id) { Tree(tree.Expand(id)) },
    appearance(model.props),
    [
      tree_table.Column("Identifier", fn(node) { h.text(node.id) }),
      ..case common.flag(model.props, "statusColumn", False) {
        True -> [
          tree_table.Column("Status", fn(node) {
            badge.view(badge.Success, [], [
              h.text(case node.disabled {
                True -> "Locked"
                False -> "Active"
              }),
            ])
          }),
        ]
        False -> []
      }
    ],
    nodes(model.props),
  )
}

pub fn virtual_scroller_example(model: Model) -> Element(Msg) {
  virtual_scroller.view(
    "One thousand rows",
    common.number(model.props, "height", 44),
    model.viewport,
    Scroll,
    [
      a.style(
        "block-size",
        common.property(model.props, "viewport", "320") <> "px",
      ),
    ],
    list.index_map(
      list.repeat(Nil, common.number(model.props, "count", 1000)),
      fn(_, index) { index + 1 },
    ),
    fn(index) { h.p([], [h.text("Project " <> int.to_string(index))]) },
  )
}

pub fn filter_service_example(model: Model) -> Element(Msg) {
  common.stack([
    common.field(
      "Filter projects (try eire)",
      field.input([a.type_("search"), a.value(model.query), e.on_input(Query)]),
    ),
    h.ul(
      [],
      names()
        |> list.filter(fn(name) {
          filter_service.text(
            name,
            model.query,
            case common.property(model.props, "match", "contains") {
              "starts" -> filter_service.StartsWith
              "ends" -> filter_service.EndsWith
              "equals" -> filter_service.Equals
              "not-equals" -> filter_service.NotEquals
              _ -> filter_service.Contains
            },
          )
        })
        |> list.map(fn(name) { h.li([], [h.text(name)]) }),
    ),
  ])
}
