import catalogue/common
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/accordion
import meridian_ui/button
import meridian_ui/field
import meridian_ui/fieldset
import meridian_ui/orientation
import meridian_ui/panel
import meridian_ui/scroll_area
import meridian_ui/splitter
import meridian_ui/stepper
import meridian_ui/tabs
import meridian_ui/toolbar

pub type Model {
  Model(
    open: List(String),
    expanded: Bool,
    tab: String,
    percent: Int,
    complete: Bool,
  )
}

pub type Msg {
  Open(List(String))
  Toggle
  Tab(String)
  Resize(Int)
  Complete
}

pub fn start(component: String) {
  common.start(Model(["about"], True, "overview", 50, False), update, fn(model) {
    case component {
      "accordion" -> accordion_example(model)
      "fieldset" -> fieldset_example(model)
      "panel" -> panel_example(model)
      "scrollarea" -> scroll_area_example(model)
      "splitter" -> splitter_example(model)
      "stepper" -> stepper_example(model)
      "tabs" -> tabs_example(model)
      "toolbar" -> toolbar_example(model)
      _ -> common.missing()
    }
  })
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Open(value) -> Model(..model, open: value)
    Toggle -> Model(..model, expanded: !model.expanded)
    Tab(value) -> Model(..model, tab: value)
    Resize(value) -> Model(..model, percent: value)
    Complete -> Model(..model, complete: !model.complete)
  }
}

pub fn accordion_example(model: Model) -> Element(Msg) {
  accordion.view("faq", "Common questions", True, model.open, Open, [], [
    accordion.Panel("about", "What is Meridian?", False, [
      h.p([], [
        h.text(
          "Independent Gleam and Lustre components, built around native controls.",
        ),
      ]),
    ]),
    accordion.Panel("state", "Who owns the state?", False, [
      h.p([], [h.text("Your application's update function owns the state.")]),
    ]),
    accordion.Panel("disabled", "Unavailable question", True, []),
  ])
}

pub fn fieldset_example(model: Model) -> Element(Msg) {
  fieldset.collapsible(
    "settings",
    "Project settings",
    model.expanded,
    Toggle,
    [],
    [common.field("Project name", field.input([a.default_value("Meridian")]))],
  )
}

pub fn panel_example(model: Model) -> Element(Msg) {
  panel.collapsible(
    "project-panel",
    "Project overview",
    model.expanded,
    Toggle,
    [],
    [],
    [
      h.p([], [
        h.text("Collapse this panel and reopen it. Its content stays mounted."),
      ]),
      common.field(
        "Retained notes",
        field.input([a.default_value("Keep this text")]),
      ),
    ],
  )
}

pub fn scroll_area_example(_model: Model) -> Element(Msg) {
  scroll_area.view("Release notes", [a.style("block-size", "12rem")], [
    h.div([a.style("block-size", "30rem")], [
      h.h2([], [h.text("Release notes")]),
      h.p([], [
        h.text(
          "Focus this region and use the arrow keys, Page Down or End to scroll.",
        ),
      ]),
    ]),
    h.p([], [h.text("You've reached the end.")]),
  ])
}

pub fn splitter_example(model: Model) -> Element(Msg) {
  splitter.view(
    "workspace",
    "Resize workspace",
    orientation.Horizontal,
    15,
    85,
    model.percent,
    Resize,
    [],
    [h.p([], [h.text("Files")])],
    [h.p([], [h.text("Drag the divider or focus it and use the arrow keys.")])],
  )
}

pub fn stepper_example(model: Model) -> Element(Msg) {
  stepper.view(
    "setup",
    "Project setup",
    case model.tab {
      "review" -> "review"
      _ -> "account"
    },
    orientation.Horizontal,
    True,
    [],
    [
      stepper.Step("account", "Account", model.complete, False, Tab("account"), [
        h.p([], [h.text("Complete this step to unlock Review.")]),
        button.view([e.on_click(Complete)], [
          h.text(case model.complete {
            True -> "Mark incomplete"
            False -> "Complete account"
          }),
        ]),
      ]),
      stepper.Step("review", "Review", False, False, Tab("review"), [
        h.p([], [h.text("Everything is ready to review.")]),
      ]),
    ],
  )
}

pub fn tabs_example(model: Model) -> Element(Msg) {
  tabs.view(
    "project-views",
    "Project views",
    model.tab,
    orientation.Horizontal,
    tabs.Automatic,
    [],
    [
      tabs.Tab("overview", "Overview", False, Tab("overview"), [], [
        h.p([], [h.text("Your project at a glance.")]),
      ]),
      tabs.Tab("activity", "Activity", False, Tab("activity"), [], [
        h.p([], [h.text("The latest changes appear here.")]),
      ]),
      tabs.Tab("locked", "Unavailable", True, Tab("locked"), [], []),
    ],
  )
}

pub fn toolbar_example(model: Model) -> Element(Msg) {
  common.stack([
    toolbar.view("Document actions", orientation.Horizontal, [], [
      button.view([toolbar.item(), e.on_click(Toggle)], [h.text("New")]),
      button.view([toolbar.item(), e.on_click(Toggle)], [h.text("Save")]),
      button.view([toolbar.item(), a.disabled(True)], [h.text("Delete")]),
    ]),
    h.p([a.role("status")], [
      h.text(case model.expanded {
        True -> "Ready"
        False -> "Action recorded"
      }),
    ]),
  ])
}
