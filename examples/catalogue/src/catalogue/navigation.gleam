import catalogue/common
import gleam/int
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/breadcrumb
import meridian_ui/button
import meridian_ui/command_menu
import meridian_ui/context_menu
import meridian_ui/dock
import meridian_ui/mega_menu
import meridian_ui/menu
import meridian_ui/menubar
import meridian_ui/sidebar
import meridian_ui/speed_dial
import meridian_ui/split_button
import meridian_ui/tiered_menu

pub type Model {
  Model(
    open: List(String),
    visible: Bool,
    query: String,
    position: context_menu.Position,
    expanded: Bool,
    actions: Int,
  )
}

pub type Msg {
  Menu(menu.Action(Msg))
  Show
  Hide
  Search(String)
  Context(context_menu.Position)
  Toggle
  Record
}

pub fn start(component: String) {
  common.start(
    Model([], False, "", context_menu.Position(0, 0), True, 0),
    update,
    fn(model) {
      common.stack([
        case component {
          "breadcrumb" -> breadcrumb_example(model)
          "commandmenu" -> command_menu_example(model)
          "contextmenu" -> context_menu_example(model)
          "dock" -> dock_example(model)
          "megamenu" -> mega_menu_example(model)
          "menu" -> menu_example(model)
          "menubar" -> menubar_example(model)
          "sidebar" -> sidebar_example(model)
          "tieredmenu" -> tiered_menu_example(model)
          "speeddial" -> speed_dial_example(model)
          "splitbutton" -> split_button_example(model)
          _ -> common.missing()
        },
        h.p([a.role("status"), a.class("demo-status")], [
          h.text("Actions: " <> int.to_string(model.actions)),
        ]),
      ])
    },
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Menu(menu.Invoke(msg)) ->
      update(Model(..model, open: [], visible: False), msg)
    Menu(action) -> Model(..model, open: menu.update(model.open, action))
    Show -> Model(..model, visible: True)
    Hide -> Model(..model, visible: False)
    Search(query) -> Model(..model, query: query)
    Context(position) -> Model(..model, position: position, visible: True)
    Toggle -> Model(..model, expanded: !model.expanded)
    Record -> Model(..model, actions: model.actions + 1, visible: False)
  }
}

fn items() -> List(menu.Item(Msg)) {
  [
    menu.Command("new", "New project", False, Record),
    menu.Submenu("export", "Export", False, [
      menu.Command("csv", "Export CSV", False, Record),
      menu.Command("json", "Export JSON", False, Record),
    ]),
    menu.Separator,
    menu.Command("locked", "Delete (unavailable)", True, Record),
  ]
}

pub fn breadcrumb_example(_model: Model) -> Element(Msg) {
  breadcrumb.view(
    "Project location",
    [
      breadcrumb.Crumb("Workspace", common.destination()),
      breadcrumb.Crumb("Projects", common.destination()),
    ],
    "Meridian",
    [],
  )
}

pub fn command_menu_example(model: Model) -> Element(Msg) {
  common.stack([
    button.primary([e.on_click(Show)], [h.text("Open command palette")]),
    command_menu.view(
      "commands",
      "Project commands",
      model.visible,
      model.query,
      Search,
      Hide,
      [],
      [
        command_menu.Command(
          "create",
          "Create project",
          "new workspace",
          False,
          Record,
        ),
        command_menu.Command(
          "export",
          "Export projects",
          "csv download",
          False,
          Record,
        ),
        command_menu.Command(
          "settings",
          "Open settings",
          "preferences",
          False,
          Record,
        ),
      ],
    ),
  ])
}

pub fn context_menu_example(model: Model) -> Element(Msg) {
  context_menu.view(
    "context-actions",
    "Project actions",
    model.visible,
    model.position,
    Context,
    Hide,
    model.open,
    Menu,
    [],
    [
      button.view([a.class("demo-context-target")], [
        h.text("Right-click here, or focus and press Shift+F10"),
      ]),
    ],
    items(),
  )
}

pub fn dock_example(_model: Model) -> Element(Msg) {
  dock.view("Workspace navigation", [], [
    dock.Item("Home", common.destination(), h.text("⌂"), True),
    dock.Item("Projects", common.destination(), h.text("◇"), False),
    dock.Item("Settings", common.destination(), h.text("⚙"), False),
  ])
}

pub fn mega_menu_example(_model: Model) -> Element(Msg) {
  mega_menu.view("Explore workspace", [], [
    mega_menu.Column("Build", [
      mega_menu.Link("Projects", common.destination()),
      mega_menu.Link("Templates", common.destination()),
    ]),
    mega_menu.Column("Collaborate", [
      mega_menu.Link("Teams", common.destination()),
      mega_menu.Link("Activity", common.destination()),
    ]),
    mega_menu.Column("Learn", [
      mega_menu.Link("Guides", common.destination()),
      mega_menu.Link("Examples", common.destination()),
    ]),
  ])
}

pub fn menu_example(model: Model) -> Element(Msg) {
  menu.view("project-menu", "Project actions", model.open, Menu, [], items())
}

pub fn menubar_example(model: Model) -> Element(Msg) {
  menubar.view("application-menu", "Application", model.open, Menu, [], items())
}

pub fn sidebar_example(model: Model) -> Element(Msg) {
  sidebar.view("workspace-sidebar", "Workspace", model.expanded, Toggle, [], [
    h.nav([a.aria_label("Workspace links")], [
      h.ul([], [
        h.li([], [h.a([a.href("#example")], [h.text("Overview")])]),
        h.li([], [h.a([a.href("#example")], [h.text("Projects")])]),
        h.li([], [h.a([a.href("#example")], [h.text("Settings")])]),
      ]),
    ]),
  ])
}

pub fn tiered_menu_example(model: Model) -> Element(Msg) {
  tiered_menu.view(
    "tiered-actions",
    "Project actions",
    model.open,
    Menu,
    [],
    items(),
  )
}

pub fn speed_dial_example(model: Model) -> Element(Msg) {
  speed_dial.view(
    "quick-actions",
    "Quick actions",
    model.visible,
    Show,
    Hide,
    model.open,
    Menu,
    [],
    items(),
  )
}

pub fn split_button_example(model: Model) -> Element(Msg) {
  split_button.view(
    "save-actions",
    "Save project",
    Record,
    model.visible,
    Show,
    Hide,
    model.open,
    Menu,
    [],
    items(),
  )
}
