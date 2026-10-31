import gleam/int
import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/confirm_dialog
import meridian_ui/confirm_popup
import meridian_ui/date_picker
import meridian_ui/dialog
import meridian_ui/drawer
import meridian_ui/field
import meridian_ui/popover

pub type State {
  State(open: List(String), approvals: Int, side: String)
}

pub type Action {
  Open(String)
  Close(String)
  Approve(String)
  Side(String)
}

pub type Model {
  Model(primary: State, secondary: State, dark: Bool)
}

pub type Msg {
  Primary(Action)
  Secondary(Action)
  ToggleTheme
}

pub fn main() {
  let app =
    lustre.simple(
      fn(_) { Model(State([], 0, "start"), State([], 0, "start"), False) },
      update,
      view,
    )
  let assert Ok(_) = lustre.start(app, "#overlays-fixture", Nil)
  Nil
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Primary(action) ->
      Model(..model, primary: update_state(model.primary, action))
    Secondary(action) ->
      Model(..model, secondary: update_state(model.secondary, action))
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn update_state(state: State, action: Action) -> State {
  case action {
    Open(id) ->
      State(..state, open: case list.contains(state.open, id) {
        True -> state.open
        False -> list.append(state.open, [id])
      })
    Close(id) ->
      State(..state, open: list.filter(state.open, fn(value) { value != id }))
    Approve(id) ->
      State(
        ..state,
        open: list.filter(state.open, fn(value) { value != id }),
        approvals: state.approvals + 1,
      )
    Side(value) -> State(..state, side: value)
  }
}

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("overlays-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Meridian overlays")]),
        button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
        controls("primary", model.primary) |> element.map(Primary),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent overlays"),
      ],
      [
        h.h2([], [h.text("Independent dark instance")]),
        controls("secondary", model.secondary) |> element.map(Secondary),
      ],
    ),
  ])
}

fn controls(prefix: String, state: State) -> Element(Action) {
  let side = case state.side {
    "end" -> drawer.End
    "top" -> drawer.Top
    "bottom" -> drawer.Bottom
    _ -> drawer.Start
  }
  h.div([a.id(prefix <> "-controls"), a.class("fixture-form")], [
    h.div(
      [a.class("fixture-row")],
      list.map(
        [
          #("modal", "Open modal"),
          #("nonmodal", "Open non-modal"),
          #("confirm", "Ask for confirmation"),
          #("drawer", "Open drawer"),
        ],
        fn(item) {
          button.view(
            [
              a.id(prefix <> "-open-" <> item.0),
              popover.anchor(prefix <> "-" <> item.0),
              a.aria_controls(prefix <> "-" <> item.0),
              e.on_click(Open(item.0)),
            ],
            [h.text(item.1)],
          )
        },
      ),
    ),
    h.div([a.class("fixture-row")], [
      popover.trigger(
        prefix <> "-popover",
        "Open details popup",
        list.contains(state.open, "popover"),
        Open("popover"),
        [],
        [h.text("Open details popup")],
      ),
      popover.trigger(
        prefix <> "-popup",
        "Ask in popup",
        list.contains(state.open, "popup"),
        Open("popup"),
        [],
        [h.text("Ask in popup")],
      ),
    ]),
    field.fluid([a.class("fixture-field")], [
      h.label([a.for(prefix <> "-outside")], [h.text("Outside note")]),
      field.input([a.id(prefix <> "-outside"), a.default_value("Outside value")]),
      h.label([a.for(prefix <> "-side")], [h.text("Drawer side")]),
      field.select(
        [a.id(prefix <> "-side"), e.on_input(Side)],
        list.map(["start", "end", "top", "bottom"], fn(value) {
          h.option([a.value(value)], value)
        }),
      ),
    ]),
    button.view([], [h.text("Outside action")]),
    dialog.view(
      prefix <> "-modal",
      "Edit project",
      list.contains(state.open, "modal"),
      Close("modal"),
      [],
      [
        field.fluid([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-project")], [h.text("Project name")]),
          field.input([
            a.id(prefix <> "-project"),
            a.default_value("Retained project"),
            a.autofocus(True),
          ]),
          h.label([], [
            h.span([], [h.text("Project date")]),
            date_picker.view([a.default_value("2024-02-29")]),
          ]),
          button.view(
            [a.id(prefix <> "-open-nested"), e.on_click(Open("nested"))],
            [h.text("Open nested dialog")],
          ),
        ]),
        dialog.view(
          prefix <> "-nested",
          "Nested project dialog",
          list.contains(state.open, "nested"),
          Close("nested"),
          [],
          [h.p([], [h.text("Closing this dialog must not close its parent.")])],
        ),
      ],
    ),
    dialog.nonmodal(
      prefix <> "-nonmodal",
      "Project notes",
      list.contains(state.open, "nonmodal"),
      Close("nonmodal"),
      [],
      [h.p([], [h.text("Outside controls remain usable.")])],
    ),
    confirm_dialog.view(
      prefix <> "-confirm",
      "Delete project?",
      list.contains(state.open, "confirm"),
      Approve("confirm"),
      Close("confirm"),
      [],
      [h.p([], [h.text("Only Confirm records an approval.")])],
    ),
    drawer.view(
      prefix <> "-drawer",
      "Project navigation",
      side,
      list.contains(state.open, "drawer"),
      Close("drawer"),
      [],
      [
        button.view([e.on_click(Close("drawer"))], [h.text("Choose project")]),
      ],
    ),
    popover.view(
      prefix <> "-popover",
      "Project details popup",
      list.contains(state.open, "popover"),
      Close("popover"),
      [],
      [
        h.p([], [h.text("Anchored content stays within the viewport.")]),
        button.view([e.on_click(Close("popover"))], [
          h.text("Close details popup"),
        ]),
      ],
    ),
    confirm_popup.view(
      prefix <> "-popup",
      "Archive project?",
      list.contains(state.open, "popup"),
      Approve("popup"),
      Close("popup"),
      [],
      [h.p([], [h.text("Anchored confirmation")])],
    ),
    h.p([a.id(prefix <> "-approvals")], [
      h.text("Approvals: " <> int.to_string(state.approvals)),
    ]),
  ])
}
