import catalogue/common
import gleam/dict
import gleam/int
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/confirm_dialog
import meridian_ui/confirm_popup
import meridian_ui/dialog
import meridian_ui/drawer
import meridian_ui/field
import meridian_ui/popover

pub type Model {
  Model(open: Bool, side: String, count: Int, props: common.Properties)
}

pub type Msg {
  Open
  Close
  Confirm
  Side(String)
  Properties(common.Properties)
}

pub fn start(component: String) {
  common.start(
    Model(False, "right", 0, dict.new()),
    update,
    Properties,
    fn(model) {
      common.stack([
        case component {
          "confirmdialog" -> confirm_dialog_example(model)
          "confirmpopup" -> confirm_popup_example(model)
          "dialog" -> dialog_example(model)
          "drawer" -> drawer_example(model)
          "dynamicdialog" -> dynamic_dialog(model)
          "popover" -> popover_example(model)
          _ -> common.missing()
        },
        h.p([a.role("status")], [
          h.text("Confirmed actions: " <> int.to_string(model.count)),
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
        open: common.flag(props, "open", model.open),
        side: common.property(props, "side", model.side),
      )
    Open -> Model(..model, open: True)
    Close -> Model(..model, open: False)
    Confirm -> Model(..model, open: False, count: model.count + 1)
    Side(value) -> Model(..model, side: value)
  }
}

pub fn confirm_dialog_example(model: Model) -> Element(Msg) {
  common.stack([
    button.view([a.data("meridian-opener", "archive"), e.on_click(Open)], [
      h.text("Archive project"),
    ]),
    confirm_dialog.view(
      "archive",
      common.property(model.props, "title", "Archive this project?"),
      model.open,
      Confirm,
      Close,
      [],
      [
        h.p([], [
          h.text(common.property(
            model.props,
            "text",
            "This demo records your choice without changing any data.",
          )),
        ]),
      ],
    ),
  ])
}

pub fn confirm_popup_example(model: Model) -> Element(Msg) {
  common.stack([
    popover.trigger("confirm-popup", "Archive project", model.open, Open, [], [
      h.text("Archive project"),
    ]),
    confirm_popup.view(
      "confirm-popup",
      common.property(model.props, "title", "Archive this project?"),
      model.open,
      Confirm,
      Close,
      [],
      [
        h.p([], [
          h.text(common.property(
            model.props,
            "text",
            "Confirm or cancel this action.",
          )),
        ]),
      ],
    ),
  ])
}

pub fn dialog_example(model: Model) -> Element(Msg) {
  let render = case common.flag(model.props, "modal", True) {
    True -> dialog.view
    False -> dialog.nonmodal
  }
  common.stack([
    button.primary(
      [a.data("meridian-opener", "edit-project"), e.on_click(Open)],
      [h.text("Edit project")],
    ),
    render(
      "edit-project",
      common.property(model.props, "title", "Edit project"),
      model.open,
      Close,
      [
        a.style(
          "inline-size",
          common.property(model.props, "width", "576") <> "px",
        ),
      ],
      [
        common.field(
          "Project name",
          field.input([
            a.default_value("Meridian"),
            a.autofocus(True),
            a.readonly(common.flag(model.props, "readonly", False)),
          ]),
        ),
        h.p([], [
          h.text(common.property(
            model.props,
            "text",
            "Update the project name, then save your changes.",
          )),
        ]),
        button.primary([e.on_click(Confirm)], [h.text("Save changes")]),
      ],
    ),
  ])
}

pub fn drawer_example(model: Model) -> Element(Msg) {
  common.stack([
    common.field(
      "Drawer side",
      field.select([a.value(model.side), e.on_input(Side)], [
        h.option([a.value("left")], "Left"),
        h.option([a.value("right"), a.selected(True)], "Right"),
        h.option([a.value("top")], "Top"),
        h.option([a.value("bottom")], "Bottom"),
      ]),
    ),
    button.view(
      [a.data("meridian-opener", "navigation-drawer"), e.on_click(Open)],
      [h.text("Open drawer")],
    ),
    drawer.view(
      "navigation-drawer",
      "Project navigation",
      case model.side {
        "left" -> drawer.Left
        "top" -> drawer.Top
        "bottom" -> drawer.Bottom
        _ -> drawer.Right
      },
      model.open,
      Close,
      [],
      [
        h.p([], [
          h.text(common.property(
            model.props,
            "text",
            "A drawer can open from any logical edge.",
          )),
        ]),
        h.nav([a.aria_label("Project destinations")], [
          h.ul([], [
            h.li([], [h.a([a.href("#example")], [h.text("Projects")])]),
            h.li([], [h.a([a.href("#example")], [h.text("Teams")])]),
          ]),
        ]),
        button.view([e.on_click(Close)], [h.text("Choose project")]),
      ],
    ),
  ])
}

pub fn dynamic_dialog(model: Model) -> Element(Msg) {
  common.stack([
    button.view([a.data("meridian-opener", "dynamic"), e.on_click(Open)], [
      h.text("Open dynamic content"),
    ]),
    dialog.view(
      "dynamic",
      common.property(
        model.props,
        "title",
        "Review " <> int.to_string(model.count + 1),
      ),
      model.open,
      Close,
      [],
      [
        h.p([], [
          h.text(common.property(
            model.props,
            "text",
            "The title and content come from ordinary application state.",
          )),
        ]),
        button.primary([e.on_click(Confirm)], [h.text("Record review")]),
      ],
    ),
  ])
}

pub fn popover_example(model: Model) -> Element(Msg) {
  common.stack([
    popover.trigger("details", "Show details", model.open, Open, [], [
      h.text("Show details"),
    ]),
    popover.view("details", "Project details", model.open, Close, [], [
      h.p([], [
        h.text(common.property(
          model.props,
          "text",
          "An anchored native popover. Click outside or press Escape to dismiss it.",
        )),
      ]),
      button.view([e.on_click(Close)], [h.text("Close details")]),
    ]),
  ])
}
