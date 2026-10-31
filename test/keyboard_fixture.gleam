import gleam/int
import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/accordion
import meridian_ui/button
import meridian_ui/field
import meridian_ui/orientation.{Horizontal, Vertical}
import meridian_ui/splitter
import meridian_ui/stepper
import meridian_ui/tabs
import meridian_ui/toggle_switch
import meridian_ui/toolbar

pub type State {
  State(
    open: List(String),
    multiple: Bool,
    tab: String,
    manual: Bool,
    vertical: Bool,
    step: String,
    complete: Bool,
    percent: Int,
    stacked: Int,
    actions: Int,
    submitted: Int,
  )
}

pub type Action {
  Open(List(String))
  SetMultiple(Bool)
  SelectTab(String)
  SetManual(Bool)
  SetVertical(Bool)
  SelectStep(String)
  Complete
  Resize(Int)
  ResizeStacked(Int)
  Record
  Submit
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
    lustre.simple(fn(_) { Model(initial(), initial(), False) }, update, view)
  let assert Ok(_) = lustre.start(app, "#keyboard-fixture", Nil)
  Nil
}

fn initial() -> State {
  State(["one"], False, "one", False, False, "account", False, 35, 50, 0, 0)
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
    Open(value) -> State(..state, open: value)
    SetMultiple(value) ->
      State(..state, multiple: value, open: case value {
        True -> state.open
        False -> list.take(state.open, 1)
      })
    SelectTab(value) -> State(..state, tab: value)
    SetManual(value) -> State(..state, manual: value)
    SetVertical(value) -> State(..state, vertical: value)
    SelectStep(value) -> State(..state, step: value)
    Complete -> State(..state, complete: !state.complete)
    Resize(value) -> State(..state, percent: value)
    ResizeStacked(value) -> State(..state, stacked: value)
    Record -> State(..state, actions: state.actions + 1)
    Submit -> State(..state, submitted: state.submitted + 1)
  }
}

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("keyboard-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Meridian keyboard and layout")]),
        button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
        controls("primary", model.primary) |> element.map(Primary),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent keyboard components"),
      ],
      [
        h.h2([], [h.text("Independent dark instance")]),
        controls("secondary", model.secondary) |> element.map(Secondary),
      ],
    ),
  ])
}

fn controls(prefix: String, state: State) -> Element(Action) {
  let orientation = case state.vertical {
    True -> Vertical
    False -> Horizontal
  }
  h.form(
    [
      a.id(prefix <> "-form"),
      a.class("fixture-form"),
      e.on_submit(fn(_) { Submit }),
    ],
    [
      h.div([a.class("fixture-row")], [
        toggle_switch.view("Multiple accordion panels", [
          a.checked(state.multiple),
          e.on_check(SetMultiple),
        ]),
        toggle_switch.view("Manual tab activation", [
          a.checked(state.manual),
          e.on_check(SetManual),
        ]),
        toggle_switch.view("Vertical tabs and toolbar", [
          a.checked(state.vertical),
          e.on_check(SetVertical),
        ]),
      ]),
      accordion.view(
        prefix <> "-faq",
        "Project questions",
        state.multiple,
        state.open,
        Open,
        [],
        [
          accordion.Panel("one", "First question", False, [
            h.p([], [h.text("First answer")]),
          ]),
          accordion.Panel("locked", "Unavailable question", True, [
            h.p([], [h.text("Unavailable answer")]),
          ]),
          accordion.Panel("two", "Second question", False, [
            h.p([], [h.text("Second answer")]),
          ]),
          accordion.Panel("three", "Third question", False, [
            h.p([], [h.text("Third answer")]),
          ]),
        ],
      ),
      tabs.view(
        prefix <> "-tabs",
        "Project views",
        state.tab,
        orientation,
        case state.manual {
          True -> tabs.Manual
          False -> tabs.Automatic
        },
        [],
        [
          tabs.Tab("one", "Overview", False, SelectTab("one"), [], [
            field.fluid([a.class("fixture-field")], [
              h.label([a.for(prefix <> "-retained")], [
                h.text("Retained tab value"),
              ]),
              field.input([
                a.id(prefix <> "-retained"),
                a.default_value("Keep me"),
              ]),
            ]),
          ]),
          tabs.Tab("locked", "Unavailable view", True, SelectTab("locked"), [], [
            h.text("Unavailable"),
          ]),
          tabs.Tab("two", "Activity", False, SelectTab("two"), [], [
            h.p([], [h.text("Project activity")]),
          ]),
          tabs.Tab("three", "Members", False, SelectTab("three"), [], [
            h.p([], [h.text("Project members")]),
          ]),
        ],
      ),
      toolbar.view(
        "Project actions",
        orientation,
        [a.id(prefix <> "-toolbar")],
        [
          button.view([toolbar.item(), e.on_click(Record)], [
            h.text("First action"),
          ]),
          button.view([toolbar.item(), a.disabled(True), e.on_click(Record)], [
            h.text("Unavailable action"),
          ]),
          button.view([toolbar.item(), e.on_click(Record)], [
            h.text("Last action"),
          ]),
          field.input([
            toolbar.item(),
            a.aria_label("Toolbar filter"),
            a.default_value("editable"),
          ]),
        ],
      ),
      stepper.view(
        prefix <> "-steps",
        "Project setup",
        state.step,
        Horizontal,
        True,
        [],
        [
          stepper.Step(
            "account",
            "Account",
            state.complete,
            False,
            SelectStep("account"),
            [
              h.p([], [h.text("Account settings")]),
              button.view([e.on_click(Complete)], [
                h.text(case state.complete {
                  True -> "Mark account incomplete"
                  False -> "Complete account"
                }),
              ]),
            ],
          ),
          stepper.Step("review", "Review", False, False, SelectStep("review"), [
            h.p([], [h.text("Review project settings")]),
          ]),
        ],
      ),
      splitter.view(
        prefix <> "-split",
        "Resize workspace",
        Horizontal,
        10,
        90,
        state.percent,
        Resize,
        [],
        [h.p([], [h.text("First workspace pane")])],
        [h.p([], [h.text("Second workspace pane")])],
      ),
      splitter.view(
        prefix <> "-stacked",
        "Resize stacked workspace",
        Vertical,
        10,
        90,
        state.stacked,
        ResizeStacked,
        [],
        [h.p([], [h.text("Top pane")])],
        [h.p([], [h.text("Bottom pane")])],
      ),
      button.primary([a.type_("submit")], [h.text("Submit form")]),
      h.p([a.id(prefix <> "-actions")], [
        h.text("Actions: " <> int.to_string(state.actions)),
      ]),
      h.p([a.id(prefix <> "-submitted")], [
        h.text("Submissions: " <> int.to_string(state.submitted)),
      ]),
    ],
  )
}
