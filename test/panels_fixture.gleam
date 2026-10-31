import gleam/int
import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/field
import meridian_ui/fieldset
import meridian_ui/panel
import meridian_ui/scroll_area

pub type State {
  State(
    expanded: Bool,
    advanced: Bool,
    disabled: Bool,
    actions: Int,
    submissions: Int,
  )
}

pub type Action {
  TogglePanel
  ToggleAdvanced
  ToggleDisabled
  CloseAll
  RecordAction
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
  let assert Ok(_) = lustre.start(app, "#panels-fixture", Nil)
  Nil
}

fn initial() -> State {
  State(True, False, False, 0, 0)
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
    TogglePanel -> State(..state, expanded: !state.expanded)
    ToggleAdvanced -> State(..state, advanced: !state.advanced)
    ToggleDisabled -> State(..state, disabled: !state.disabled)
    CloseAll -> State(..state, expanded: False, advanced: False)
    RecordAction -> State(..state, actions: state.actions + 1)
    Submit -> State(..state, submissions: state.submissions + 1)
  }
}

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("panels-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Meridian panels and scrolling")]),
        button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
        form("primary", model.primary) |> element.map(Primary),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent panels"),
      ],
      [
        h.h2([], [h.text("Independent dark instance")]),
        form("secondary", model.secondary) |> element.map(Secondary),
      ],
    ),
  ])
}

fn form(prefix: String, state: State) -> Element(Action) {
  h.form(
    [
      a.id(prefix <> "-form"),
      a.class("fixture-form"),
      e.on_submit(fn(_) { Submit }),
    ],
    [
      panel.view(
        "Project brief",
        [],
        [button.view([e.on_click(RecordAction)], [h.text("Record action")])],
        [
          h.p([], [
            h.text(
              "A native content panel with a heading and independent header actions.",
            ),
          ]),
        ],
      ),
      panel.collapsible(
        prefix <> "-details",
        "Project details",
        state.expanded,
        TogglePanel,
        [],
        [button.view([e.on_click(RecordAction)], [h.text("Header action")])],
        [
          field.fluid([a.class("fixture-field")], [
            h.label([a.for(prefix <> "-note")], [h.text("Project note")]),
            field.input([
              a.id(prefix <> "-note"),
              a.name("note"),
              a.default_value("Keep my text"),
            ]),
            button.view([e.on_click(RecordAction)], [h.text("Content action")]),
          ]),
        ],
      ),
      fieldset.view("Service settings", [a.disabled(state.disabled)], [
        field.fluid([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-region")], [h.text("Region")]),
          field.input([
            a.id(prefix <> "-region"),
            a.name("region"),
            a.default_value("local"),
          ]),
        ]),
      ]),
      fieldset.collapsible(
        prefix <> "-advanced",
        "Advanced settings",
        state.advanced,
        ToggleAdvanced,
        [a.disabled(state.disabled)],
        [
          field.fluid([a.class("fixture-field")], [
            h.label([a.for(prefix <> "-advanced-note")], [
              h.text("Advanced note"),
            ]),
            field.input([
              a.id(prefix <> "-advanced-note"),
              a.name("advanced"),
              a.default_value("Saved even when collapsed"),
            ]),
          ]),
        ],
      ),
      scroll_area.view(
        "Recent events",
        [a.id(prefix <> "-events"), a.style("max-block-size", "12rem")],
        [
          h.ol(
            [],
            list.index_map(list.repeat(Nil, 30), fn(_, index) {
              h.li([], [h.text("Recorded event " <> int.to_string(index + 1))])
            }),
          ),
          button.view([e.on_click(RecordAction)], [h.text("Last event action")]),
        ],
      ),
      scroll_area.view(
        "Component matrix",
        [a.id(prefix <> "-matrix"), a.style("max-block-size", "12rem")],
        [
          h.table([a.class("fixture-scroll-table")], [
            h.caption([], [h.text("Component matrix")]),
            h.thead([], [
              h.tr(
                [],
                list.map(["Component", "Owner", "State", "Region"], fn(title) {
                  h.th([a.scope("col")], [h.text(title)])
                }),
              ),
            ]),
            h.tbody(
              [],
              list.index_map(list.repeat(Nil, 20), fn(_, index) {
                h.tr(
                  [],
                  list.map(
                    [
                      "Panel " <> int.to_string(index + 1),
                      "Project team",
                      "Available",
                      "Local",
                    ],
                    fn(value) { h.td([], [h.text(value)]) },
                  ),
                )
              }),
            ),
          ]),
        ],
      ),
      h.div([a.class("fixture-row")], [
        button.view([e.on_click(ToggleDisabled)], [
          h.text(case state.disabled {
            True -> "Enable fieldsets"
            False -> "Disable fieldsets"
          }),
        ]),
        button.view([e.on_click(CloseAll)], [h.text("Close all sections")]),
        button.primary([a.type_("submit")], [h.text("Submit form")]),
      ]),
      h.p([a.id(prefix <> "-actions")], [
        h.text("Actions: " <> int.to_string(state.actions)),
      ]),
      h.p([a.id(prefix <> "-submissions")], [
        h.text("Submissions: " <> int.to_string(state.submissions)),
      ]),
    ],
  )
}
