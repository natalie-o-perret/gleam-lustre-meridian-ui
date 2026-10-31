import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/breadcrumb
import meridian_ui/button
import meridian_ui/command_menu
import meridian_ui/context_menu
import meridian_ui/data_view
import meridian_ui/dock
import meridian_ui/field
import meridian_ui/hierarchy.{Node}
import meridian_ui/mega_menu
import meridian_ui/menu
import meridian_ui/menubar
import meridian_ui/order_list
import meridian_ui/org_chart
import meridian_ui/pick_list
import meridian_ui/selection
import meridian_ui/sidebar
import meridian_ui/speed_dial
import meridian_ui/split_button
import meridian_ui/table
import meridian_ui/tiered_menu
import meridian_ui/tree
import meridian_ui/tree_select
import meridian_ui/tree_table
import meridian_ui/url
import meridian_ui/virtual_scroller

pub type Model {
  Model(
    tree: tree.Model,
    table: table.Model,
    order: List(String),
    target: List(String),
    menu_open: List(String),
    popup: String,
    query: String,
    context: context_menu.Position,
    viewport: virtual_scroller.Viewport,
    actions: Int,
    expanded: Bool,
    dark: Bool,
  )
}

pub type Msg {
  Tree(tree.Action)
  Table(table.Action)
  Order(order_list.Action)
  Pick(pick_list.Action)
  Menu(menu.Action(Msg))
  Popup(String)
  Search(String)
  Context(context_menu.Position)
  Scroll(virtual_scroller.Viewport)
  Record
  ToggleSidebar
  ToggleTheme
}

pub fn main() {
  let app =
    lustre.simple(
      fn(_) {
        Model(
          tree.Model([], []),
          table.Model("", None, [], 0, 2),
          ["one", "two", "three"],
          [],
          [],
          "",
          "",
          context_menu.Position(0, 0),
          virtual_scroller.Viewport(0, 320),
          0,
          True,
          False,
        )
      },
      update,
      view,
    )
  let assert Ok(_) = lustre.start(app, "#data-fixture", Nil)
  Nil
}

fn item(id: String) -> order_list.Item(Msg) {
  order_list.Item(id, id, False, [])
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
    Menu(menu.Invoke(msg)) ->
      update(Model(..model, popup: "", menu_open: []), msg)
    Menu(action) ->
      Model(..model, menu_open: menu.update(model.menu_open, action))
    Popup(id) -> Model(..model, popup: id)
    Search(value) -> Model(..model, query: value)
    Context(position) -> Model(..model, context: position, popup: "context")
    Scroll(viewport) -> Model(..model, viewport: viewport)
    Record -> Model(..model, actions: model.actions + 1, popup: "")
    ToggleSidebar -> Model(..model, expanded: !model.expanded)
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn nodes() {
  [
    Node("team", "Team", False, [
      Node("one", "One", False, []),
      Node("locked", "Locked", True, []),
      Node("two", "Two", False, []),
    ]),
    Node("three", "Three", False, []),
  ]
}

fn commands() {
  [
    menu.Command("new", "New project", False, Record),
    menu.Command("locked", "Unavailable command", True, Record),
    menu.Submenu("export", "Export", False, [
      menu.Command("csv", "Export CSV", False, Record),
      menu.Command("json", "Export JSON", False, Record),
    ]),
  ]
}

fn view(model: Model) -> Element(Msg) {
  let assert Ok(home) = url.parse("#home")
  let items = ["Alex", "Blair", "Cat", "Dana", "Éire"]
  h.main(
    [
      a.id("data-demo"),
      a.class("meridian-ui fixture"),
      a.data("theme", case model.dark {
        True -> "dark"
        False -> "light"
      }),
    ],
    [
      h.h1([], [h.text("Navigation and data")]),
      button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
      breadcrumb.view(
        "Breadcrumb",
        [breadcrumb.Crumb("Home", home)],
        "Projects",
        [],
      ),
      menubar.view(
        "main-menu",
        "Application",
        model.menu_open,
        Menu,
        [],
        commands(),
      ),
      tiered_menu.view(
        "tiered",
        "Project commands",
        model.menu_open,
        Menu,
        [],
        commands(),
      ),
      mega_menu.view("Browse", [], [
        mega_menu.Column("Projects", [mega_menu.Link("All projects", home)]),
      ]),
      dock.view("Dock", [], [dock.Item("Home", home, h.text("H"), True)]),
      sidebar.view("sidebar", "Sidebar", model.expanded, ToggleSidebar, [], [
        h.a([a.href("#home")], [h.text("Home")]),
      ]),
      split_button.view(
        "split-actions",
        "Save",
        Record,
        model.popup == "split",
        Popup("split"),
        Popup(""),
        model.menu_open,
        Menu,
        [],
        commands(),
      ),
      speed_dial.view(
        "quick-actions",
        "Quick actions",
        model.popup == "speed",
        Popup("speed"),
        Popup(""),
        model.menu_open,
        Menu,
        [],
        commands(),
      ),
      button.view([e.on_click(Popup("commands"))], [
        h.text("Open command palette"),
      ]),
      command_menu.view(
        "commands",
        "Command palette",
        model.popup == "commands",
        model.query,
        Search,
        Popup(""),
        [],
        [
          command_menu.Command("one", "Create project", "new", False, Record),
          command_menu.Command("two", "Export projects", "csv", False, Record),
        ],
      ),
      context_menu.view(
        "context",
        "Context actions",
        model.popup == "context",
        model.context,
        Context,
        Popup(""),
        model.menu_open,
        Menu,
        [],
        [button.view([], [h.text("Context target")])],
        commands(),
      ),
      tree.view(
        "Project tree",
        selection.Multiple,
        model.tree,
        Tree,
        [],
        nodes(),
      ),
      tree_select.view(
        "Select projects",
        "projects",
        selection.Multiple,
        model.tree,
        Tree,
        [],
        nodes(),
      ),
      tree_table.view(
        "Project hierarchy",
        model.tree.expanded,
        fn(id) { Tree(tree.Expand(id)) },
        [],
        [tree_table.Column("ID", fn(node) { h.text(node.id) })],
        nodes(),
      ),
      org_chart.view("Organisation", [], nodes(), fn(node) {
        h.text(node.label)
      }),
      table.view(
        "Owners",
        model.table,
        Table,
        [],
        items,
        fn(value) { value },
        fn(value) { value },
        [table.Column("name", "Name", Some(string.compare), h.text)],
      ),
      order_list.view("Priority", Order, [], list.map(model.order, item)),
      table.view(
        "Editable owners",
        table.Model(..model.table, size: 10),
        Table,
        [],
        ["Blair", "Alex"],
        fn(value) { value },
        fn(value) { value },
        [
          table.Column("name", "Name", Some(string.compare), fn(value) {
            field.input([a.aria_label("Edit " <> value), a.default_value(value)])
          }),
        ],
      ),
      pick_list.view(
        "Available",
        "Chosen",
        pick_list.Model(
          list.map(model.order, item),
          list.map(model.target, item),
        ),
        Pick,
        [],
      ),
      data_view.view(
        "Cards",
        data_view.Grid,
        model.table.page,
        2,
        fn(page) { Table(table.Page(page)) },
        [],
        items,
        fn(value) { h.p([], [h.text(value)]) },
      ),
      virtual_scroller.view(
        "Large list",
        40,
        model.viewport,
        Scroll,
        [],
        list.index_map(list.repeat(Nil, 1000), fn(_, index) {
          int.to_string(index)
        }),
        fn(value) { h.p([], [h.text("Row " <> value)]) },
      ),
      h.p([a.id("action-count")], [
        h.text("Actions: " <> int.to_string(model.actions)),
      ]),
    ],
  )
}
