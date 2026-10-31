import catalogue/common
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
  Model(open: Bool, side: String, count: Int)
}

pub type Msg {
  Open
  Close
  Confirm
  Side(String)
}

pub fn start(component: String) {
  common.start(Model(False, "end", 0), update, fn(model) {
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
  })
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Open -> Model(..model, open: True)
    Close -> Model(..model, open: False)
    Confirm -> Model(..model, open: False, count: model.count + 1)
    Side(value) -> Model(..model, side: value)
  }
}

pub fn confirm_dialog_example(model: Model) -> Element(Msg) {
  common.stack([
    button.view([e.on_click(Open)], [h.text("Archive project")]),
    confirm_dialog.view(
      "archive",
      "Archive this project?",
      model.open,
      Confirm,
      Close,
      [],
      [
        h.p([], [
          h.text("This demo records your choice without changing any data."),
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
      "Archive this project?",
      model.open,
      Confirm,
      Close,
      [],
      [h.p([], [h.text("Confirm or cancel this action.")])],
    ),
  ])
}

pub fn dialog_example(model: Model) -> Element(Msg) {
  common.stack([
    button.primary([e.on_click(Open)], [h.text("Edit project")]),
    dialog.view("edit-project", "Edit project", model.open, Close, [], [
      common.field(
        "Project name",
        field.input([a.default_value("Meridian"), a.autofocus(True)]),
      ),
      button.primary([e.on_click(Confirm)], [h.text("Save changes")]),
    ]),
  ])
}

pub fn drawer_example(model: Model) -> Element(Msg) {
  common.stack([
    common.field(
      "Drawer side",
      field.select([a.value(model.side), e.on_input(Side)], [
        h.option([a.value("start")], "Start"),
        h.option([a.value("end"), a.selected(True)], "End"),
        h.option([a.value("top")], "Top"),
        h.option([a.value("bottom")], "Bottom"),
      ]),
    ),
    button.view([e.on_click(Open)], [h.text("Open drawer")]),
    drawer.view(
      "navigation-drawer",
      "Project navigation",
      case model.side {
        "start" -> drawer.Start
        "top" -> drawer.Top
        "bottom" -> drawer.Bottom
        _ -> drawer.End
      },
      model.open,
      Close,
      [],
      [
        h.p([], [h.text("A drawer can open from any logical edge.")]),
        button.view([e.on_click(Close)], [h.text("Choose project")]),
      ],
    ),
  ])
}

pub fn dynamic_dialog(model: Model) -> Element(Msg) {
  common.stack([
    button.view([e.on_click(Open)], [h.text("Open dynamic content")]),
    dialog.view(
      "dynamic",
      "Review " <> int.to_string(model.count + 1),
      model.open,
      Close,
      [],
      [
        h.p([], [
          h.text("The title and content come from ordinary application state."),
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
        h.text(
          "An anchored native popover. Click outside or press Escape to dismiss it.",
        ),
      ]),
      button.view([e.on_click(Close)], [h.text("Close details")]),
    ]),
  ])
}
