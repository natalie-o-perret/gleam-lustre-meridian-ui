import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/breadcrumb
import meridian_ui/button
import meridian_ui/command_menu
import meridian_ui/context_menu
import meridian_ui/dock
import meridian_ui/field
import meridian_ui/filter_service
import meridian_ui/icon
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
    props: common.Properties,
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
  Properties(common.Properties)
}

pub fn start(component: String) {
  common.start(
    Model([], False, "", context_menu.Position(0, 0), True, 0, dict.new()),
    update,
    Properties,
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
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        expanded: common.flag(props, "expanded", model.expanded),
        query: common.property(props, "query", model.query),
        visible: common.flag(props, "open", model.visible),
      )
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

fn items(props: common.Properties) -> List(menu.Item(Msg)) {
  let items = [
    menu.Command("new", "New project", False, Record),
    case common.flag(props, "nested", True) {
      True ->
        menu.Submenu("export", "Export", False, [
          menu.Command("csv", "Export CSV", False, Record),
          menu.Command("json", "Export JSON", False, Record),
        ])
      False -> menu.Command("export", "Export projects", False, Record)
    },
    menu.Separator,
    menu.Command(
      "locked",
      case common.flag(props, "locked", True) {
        True -> "Delete (unavailable)"
        False -> "Delete"
      },
      common.flag(props, "locked", True),
      Record,
    ),
  ]
  common.items(
    props,
    list.filter(items, fn(item) {
      case item {
        menu.Separator -> common.flag(props, "separators", True)
        _ -> True
      }
    }),
  )
}

pub fn breadcrumb_example(model: Model) -> Element(Msg) {
  breadcrumb.view(
    common.property(model.props, "label", "Project location"),
    list.append(
      case common.flag(model.props, "workspace", True) {
        True -> [breadcrumb.Crumb("Workspace", common.destination())]
        False -> []
      },
      [
        breadcrumb.Crumb("Projects", common.destination()),
      ],
    ),
    common.property(model.props, "labelText", "Meridian"),
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
          common.flag(model.props, "exportDisabled", False),
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
    common.property(model.props, "label", "Project actions"),
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
    items(model.props),
  )
}

pub fn dock_example(model: Model) -> Element(Msg) {
  dock.view(
    common.property(model.props, "label", "Workspace navigation"),
    [],
    common.items(model.props, [
      dock.Item(
        "Home",
        common.destination(),
        icon.view(icon.Home, []),
        common.property(model.props, "active", "home") == "home",
      ),
      dock.Item(
        "Projects",
        common.destination(),
        icon.view(icon.Folder, []),
        common.property(model.props, "active", "home") == "projects",
      ),
      dock.Item(
        "Settings",
        common.destination(),
        icon.view(icon.Settings, []),
        common.property(model.props, "active", "home") == "settings",
      ),
    ]),
  )
}

pub fn mega_menu_example(model: Model) -> Element(Msg) {
  mega_menu.view(
    common.property(model.props, "label", "Explore workspace"),
    [],
    common.items(
      model.props,
      [
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
      ]
        |> list.filter(fn(column) {
          let group = common.property(model.props, "group", "all")
          group == "all" || column.label == group
        }),
    ),
  )
}

pub fn menu_example(model: Model) -> Element(Msg) {
  menu.view(
    "project-menu",
    common.property(model.props, "label", "Project actions"),
    model.open,
    Menu,
    [],
    items(model.props),
  )
}

pub fn menubar_example(model: Model) -> Element(Msg) {
  menubar.view(
    "application-menu",
    common.property(model.props, "label", "Application"),
    model.open,
    Menu,
    [],
    items(model.props),
  )
}

pub fn sidebar_example(model: Model) -> Element(Msg) {
  sidebar.view(
    "workspace-sidebar",
    common.property(model.props, "label", "Workspace"),
    model.expanded,
    Toggle,
    [],
    [
      common.field(
        "Filter workspace links",
        field.input([
          a.type_("search"),
          a.value(model.query),
          e.on_input(Search),
        ]),
      ),
      h.nav([a.aria_label("Workspace links")], [
        h.ul(
          [],
          ["Overview", "Projects", "Settings"]
            |> list.filter(fn(label) {
              filter_service.text(label, model.query, filter_service.Contains)
            })
            |> list.map(fn(label) {
              h.li([], [h.a([a.href("#example")], [h.text(label)])])
            }),
        ),
      ]),
    ],
  )
}

pub fn tiered_menu_example(model: Model) -> Element(Msg) {
  tiered_menu.view(
    "tiered-actions",
    common.property(model.props, "label", "Project actions"),
    model.open,
    Menu,
    [],
    items(model.props),
  )
}

pub fn speed_dial_example(model: Model) -> Element(Msg) {
  speed_dial.view(
    "quick-actions",
    common.property(model.props, "label", "Quick actions"),
    model.visible,
    Show,
    Hide,
    model.open,
    Menu,
    [],
    items(model.props),
  )
}

pub fn split_button_example(model: Model) -> Element(Msg) {
  split_button.view(
    "save-actions",
    common.property(model.props, "label", "Save project"),
    Record,
    model.visible,
    Show,
    Hide,
    model.open,
    Menu,
    [],
    items(model.props),
  )
}
