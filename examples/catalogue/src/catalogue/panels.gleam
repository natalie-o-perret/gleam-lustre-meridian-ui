import catalogue/common
import gleam/dict
import gleam/int
import gleam/list
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
    props: common.Properties,
  )
}

pub type Msg {
  Open(List(String))
  Toggle
  Tab(String)
  Resize(Int)
  Complete
  Properties(common.Properties)
}

pub fn start(component: String) {
  common.start(
    Model(["about"], True, "overview", 50, False, dict.new()),
    update,
    Properties,
    fn(model) {
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
    },
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        props: dict.merge(model.props, props),
        expanded: common.flag(props, "expanded", model.expanded),
        percent: common.number(props, "percent", model.percent),
        complete: common.flag(props, "complete", model.complete),
        tab: common.property(props, "active", model.tab),
        open: case common.property(props, "panels", "keep") {
          "none" -> []
          "about" -> ["about"]
          "state" -> ["state"]
          "both" ->
            case common.flag(dict.merge(model.props, props), "multiple", True) {
              True -> ["about", "state"]
              False -> ["about"]
            }
          _ ->
            case common.flag(dict.merge(model.props, props), "multiple", True) {
              True -> model.open
              False -> list.take(model.open, 1)
            }
        },
      )
    Open(value) -> Model(..model, open: value)
    Toggle -> Model(..model, expanded: !model.expanded)
    Tab(value) -> Model(..model, tab: value)
    Resize(value) -> Model(..model, percent: value)
    Complete -> Model(..model, complete: !model.complete)
  }
}

pub fn accordion_example(model: Model) -> Element(Msg) {
  accordion.view(
    "faq",
    common.property(model.props, "label", "Common questions"),
    common.flag(model.props, "multiple", True),
    model.open,
    Open,
    [],
    [
      accordion.Panel("about", "What is Meridian?", False, [
        h.p([], [
          h.text(
            "Independent Gleam and Lustre components, built around native controls.",
          ),
        ]),
      ]),
      accordion.Panel(
        "state",
        "Who owns the state?",
        common.flag(model.props, "stateDisabled", False),
        [
          h.p([], [h.text("Your application's update function owns the state.")]),
        ],
      ),
      accordion.Panel("disabled", "Unavailable question", True, []),
    ],
  )
}

pub fn fieldset_example(model: Model) -> Element(Msg) {
  fieldset.collapsible(
    "settings",
    common.property(model.props, "label", "Project settings"),
    model.expanded,
    Toggle,
    common.attrs(model.props, []),
    [common.field("Project name", field.input([a.default_value("Meridian")]))],
  )
}

pub fn panel_example(model: Model) -> Element(Msg) {
  panel.collapsible(
    "project-panel",
    common.property(model.props, "label", "Project overview"),
    model.expanded,
    Toggle,
    [],
    case common.flag(model.props, "actions", False) {
      True -> [button.view([e.on_click(Toggle)], [h.text("Toggle content")])]
      False -> []
    },
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

pub fn scroll_area_example(model: Model) -> Element(Msg) {
  scroll_area.view(
    common.property(model.props, "label", "Release notes"),
    [
      a.style(
        "block-size",
        int.to_string(common.number(model.props, "height", 192)) <> "px",
      ),
    ],
    [
      h.div(
        [
          a.style("block-size", "30rem"),
          a.style(
            "inline-size",
            case common.number(model.props, "contentWidth", 0) {
              0 -> "auto"
              width -> int.to_string(width) <> "px"
            },
          ),
        ],
        [
          h.h2([], [h.text("Release notes")]),
          h.p([], [
            h.text(
              "Focus this region and use the arrow keys, Page Down or End to scroll.",
            ),
          ]),
        ],
      ),
      h.p([], [h.text("You've reached the end.")]),
    ],
  )
}

pub fn splitter_example(model: Model) -> Element(Msg) {
  splitter.view(
    "workspace",
    "Resize workspace",
    common.orientation(model.props, orientation.Horizontal),
    common.number(model.props, "minimum", 15),
    common.number(model.props, "maximum", 85),
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
    common.orientation(model.props, orientation.Horizontal),
    common.flag(model.props, "linear", True),
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
    common.orientation(model.props, orientation.Horizontal),
    case common.property(model.props, "activation", "automatic") {
      "manual" -> tabs.Manual
      _ -> tabs.Automatic
    },
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
    toolbar.view(
      common.property(model.props, "label", "Document actions"),
      common.orientation(model.props, orientation.Horizontal),
      [],
      [
        button.view([toolbar.item(), e.on_click(Toggle)], [h.text("New")]),
        button.view([toolbar.item(), e.on_click(Toggle)], [h.text("Save")]),
        button.view(
          [
            toolbar.item(),
            a.disabled(common.flag(model.props, "deleteDisabled", True)),
            e.on_click(Toggle),
          ],
          [h.text("Delete")],
        ),
      ],
    ),
    h.p([a.role("status")], [
      h.text(case model.expanded {
        True -> "Ready"
        False -> "Action recorded"
      }),
    ]),
  ])
}
