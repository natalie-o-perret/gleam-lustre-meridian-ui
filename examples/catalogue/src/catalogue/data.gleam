import catalogue/common
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/data_view
import meridian_ui/field
import meridian_ui/filter_service
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
    table: table.Model,
    order: List(String),
    target: List(String),
    page: Int,
    grid: Bool,
    viewport: virtual_scroller.Viewport,
    query: String,
  )
}

pub type Msg {
  Tree(tree.Action)
  Table(table.Action)
  Order(order_list.Action)
  Pick(pick_list.Action)
  Page(Int)
  Grid(Bool)
  Scroll(virtual_scroller.Viewport)
  Query(String)
}

pub fn start(component: String) {
  common.start(
    Model(
      tree.Model([], []),
      table.Model("", None, [], 0, 3),
      ["Design", "Build", "Review"],
      [],
      0,
      True,
      virtual_scroller.Viewport(0, 320),
      "",
    ),
    update,
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
        _ -> common.missing()
      }
    },
  )
}

fn item(id: String) -> order_list.Item(Msg) {
  order_list.Item(id, id, False, [])
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
    Tree(action) ->
      Model(..model, tree: tree.update(model.tree, action, selection.Multiple))
    Table(action) -> Model(..model, table: table.update(model.table, action))
    Order(order_list.Move(id, position)) ->
      Model(
        ..model,
        order: order_list.move(list.map(model.order, item), id, position)
          |> list.map(fn(item) { item.id }),
      )
    Pick(action) -> {
      let changed =
        pick_list.update(
          pick_list.Model(
            list.map(model.order, item),
            list.map(model.target, item),
          ),
          action,
        )
      Model(
        ..model,
        order: list.map(changed.source, fn(item) { item.id }),
        target: list.map(changed.target, fn(item) { item.id }),
      )
    }
    Page(page) -> Model(..model, page: page)
    Grid(value) -> Model(..model, grid: value)
    Scroll(viewport) -> Model(..model, viewport: viewport)
    Query(value) -> Model(..model, query: value)
  }
}

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
      4,
      Page,
      [],
      names(),
      fn(name) {
        h.article([a.class("demo-project")], [
          h.h2([], [h.text(name)]),
          h.p([], [h.text("A place for your team's next idea.")]),
        ])
      },
    ),
  ])
}

pub fn order_list_example(model: Model) -> Element(Msg) {
  order_list.view("Project stages", Order, [], list.map(model.order, item))
}

pub fn organization_chart(_model: Model) -> Element(Msg) {
  org_chart.view("Organisation", [], common.nodes(), fn(node) {
    h.text(node.label)
  })
}

pub fn paginator_example(model: Model) -> Element(Msg) {
  common.stack([
    h.ul(
      [],
      list.map(paginator.slice(names(), model.page, 3), fn(name) {
        h.li([], [h.text(name)])
      }),
    ),
    paginator.view(
      "Project pages",
      list.length(names()),
      3,
      model.page,
      Page,
      [],
    ),
  ])
}

pub fn pick_list_example(model: Model) -> Element(Msg) {
  pick_list.view(
    "Available stages",
    "Selected stages",
    pick_list.Model(list.map(model.order, item), list.map(model.target, item)),
    Pick,
    [],
  )
}

pub fn table_example(model: Model) -> Element(Msg) {
  table.view(
    "Projects",
    model.table,
    Table,
    [],
    names(),
    fn(name) { name },
    fn(name) { name },
    [
      table.Column("name", "Project", Some(string.compare), h.text),
      table.Column("notes", "Editable notes", None, fn(name) {
        field.input([
          a.aria_label("Notes for " <> name),
          a.default_value("Draft for " <> name),
        ])
      }),
    ],
  )
}

pub fn timeline_example(_model: Model) -> Element(Msg) {
  timeline.view("Project history", orientation.Vertical, [], [
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
}

pub fn tree_example(model: Model) -> Element(Msg) {
  tree.view(
    "Workspace teams",
    selection.Multiple,
    model.tree,
    Tree,
    [],
    common.nodes(),
  )
}

pub fn tree_select_example(model: Model) -> Element(Msg) {
  tree_select.view(
    "Choose teams",
    "teams",
    selection.Multiple,
    model.tree,
    Tree,
    [],
    common.nodes(),
  )
}

pub fn tree_table_example(model: Model) -> Element(Msg) {
  tree_table.view(
    "Workspace hierarchy",
    model.tree.expanded,
    fn(id) { Tree(tree.Expand(id)) },
    [],
    [tree_table.Column("Identifier", fn(node) { h.text(node.id) })],
    common.nodes(),
  )
}

pub fn virtual_scroller_example(model: Model) -> Element(Msg) {
  virtual_scroller.view(
    "One thousand rows",
    44,
    model.viewport,
    Scroll,
    [],
    list.index_map(list.repeat(Nil, 1000), fn(_, index) { index + 1 }),
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
          filter_service.text(name, model.query, filter_service.Contains)
        })
        |> list.map(fn(name) { h.li([], [h.text(name)]) }),
    ),
  ])
}
