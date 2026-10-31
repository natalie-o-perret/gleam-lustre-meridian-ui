import gleam/int
import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/autocomplete
import meridian_ui/button
import meridian_ui/cascade_select
import meridian_ui/date_picker
import meridian_ui/field
import meridian_ui/hierarchy.{Node}
import meridian_ui/input_mask
import meridian_ui/input_otp
import meridian_ui/input_tags
import meridian_ui/key_filter
import meridian_ui/knob
import meridian_ui/listbox
import meridian_ui/rating
import meridian_ui/select
import meridian_ui/select_button
import meridian_ui/selection
import meridian_ui/slider
import meridian_ui/toggle_switch

pub type State {
  State(
    owners: List(String),
    views: List(String),
    rating: Int,
    tags: input_tags.Model,
    path: List(String),
    start: String,
    end: String,
    volume: String,
    mask: String,
    bounds: slider.Bounds,
    disabled: Bool,
    submissions: Int,
    select_query: String,
    select_value: String,
  )
}

pub type Action {
  Owners(List(String))
  Views(select_button.Action)
  Rate(Int)
  Tags(input_tags.Action)
  Path(cascade_select.Action)
  Dates(date_picker.Action)
  Volume(String)
  Mask(input_mask.Value)
  Bounds(slider.Action)
  Disabled(Bool)
  Submit
  SelectQuery(String)
  SelectValue(String)
}

pub type Model {
  Model(primary: State, secondary: State, dark: Bool)
}

pub type Msg {
  Primary(Action)
  Secondary(Action)
  ToggleTheme
}

fn initial() -> State {
  State(
    ["one"],
    ["list"],
    3,
    input_tags.Model(["Initial"], ""),
    [],
    "2026-10-01",
    "2026-10-31",
    "35",
    "",
    slider.Bounds(20, 80),
    False,
    0,
    "",
    "one",
  )
}

pub fn main() {
  let app =
    lustre.simple(fn(_) { Model(initial(), initial(), False) }, update, view)
  let assert Ok(_) = lustre.start(app, "#selection-fixture", Nil)
  Nil
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Primary(action) -> Model(..model, primary: change(model.primary, action))
    Secondary(action) ->
      Model(..model, secondary: change(model.secondary, action))
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn change(state: State, action: Action) -> State {
  case action {
    Owners(values) -> State(..state, owners: values)
    Views(action) ->
      State(
        ..state,
        views: select_button.update(state.views, action, selection.Multiple),
      )
    Rate(value) -> State(..state, rating: value)
    Tags(action) -> State(..state, tags: input_tags.update(state.tags, action))
    Path(action) ->
      State(..state, path: cascade_select.update(state.path, action))
    Dates(action) -> {
      let #(start, end) = date_picker.update(#(state.start, state.end), action)
      State(..state, start: start, end: end)
    }
    Volume(value) -> State(..state, volume: value)
    Mask(value) -> State(..state, mask: value.masked)
    Bounds(action) ->
      State(..state, bounds: slider.update(state.bounds, action, 0, 100))
    Disabled(value) -> State(..state, disabled: value)
    Submit -> State(..state, submissions: state.submissions + 1)
    SelectQuery(value) -> State(..state, select_query: value)
    SelectValue(value) -> State(..state, select_value: value)
  }
}

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("selection-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Selection fields")]),
        button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
        controls("primary", model.primary) |> element.map(Primary),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent selections"),
      ],
      [
        h.h2([], [h.text("Independent selections")]),
        controls("secondary", model.secondary) |> element.map(Secondary),
      ],
    ),
  ])
}

fn controls(prefix: String, state: State) -> Element(Action) {
  h.form(
    [
      a.id(prefix <> "-form"),
      a.class("fixture-form"),
      e.on_submit(fn(_) { Submit }),
    ],
    [
      toggle_switch.view("Disable fields", [
        a.checked(state.disabled),
        e.on_check(Disabled),
      ]),
      h.fieldset([a.disabled(state.disabled)], [
        h.legend([], [h.text("Selection and editing")]),
        field.fluid([], [
          listbox.view(
            "Owners",
            4,
            selection.Multiple,
            Owners,
            [a.name("owners")],
            [
              listbox.option(
                "one",
                "Alex",
                list.contains(state.owners, "one"),
                False,
              ),
              listbox.option("locked", "Unavailable", False, True),
              listbox.option(
                "two",
                "Blair",
                list.contains(state.owners, "two"),
                False,
              ),
            ],
          ),
          select_button.view(
            "Views",
            prefix <> "-views",
            selection.Multiple,
            True,
            state.views,
            Views,
            [],
            [
              select_button.Choice("list", "List", False),
              select_button.Choice("grid", "Grid", False),
              select_button.Choice("locked", "Locked view", True),
            ],
          ),
          select.view(
            "Primary owner",
            state.select_query,
            state.select_value,
            SelectQuery,
            SelectValue,
            [a.name("primary-owner")],
            [
              select.Option("one", "Alex", False),
              select.Option("two", "Blair", False),
            ],
          ),
          rating.view(
            "Quality",
            prefix <> "-rating",
            state.rating,
            5,
            False,
            Rate,
            [],
          ),
          h.label([], [
            h.span([], [h.text("Verification code")]),
            input_otp.view(6, input_otp.Digits, [a.name("code")]),
          ]),
          input_tags.view(
            prefix <> "-tags",
            "Labels",
            "labels",
            True,
            state.tags,
            Tags,
            [],
          ),
          h.label([], [
            h.span([], [h.text("Owner suggestions")]),
            autocomplete.view(prefix <> "-owner", [a.name("owner")], [
              autocomplete.suggestion("Alex", "Team A"),
              autocomplete.suggestion("Blair", "Team B"),
            ]),
          ]),
          cascade_select.view(
            prefix <> "-project",
            "Project",
            "project",
            state.path,
            False,
            Path,
            [],
            [
              Node("team", "Team", False, [
                Node("project", "Project one", False, []),
                Node("locked", "Locked project", True, []),
              ]),
              Node("standalone", "Standalone", False, []),
            ],
          ),
          date_picker.range(
            "Dates",
            "dates",
            state.start,
            state.end,
            True,
            Dates,
            [],
          ),
          knob.view("Volume", state.volume, Volume, [
            a.name("volume"),
            a.min("0"),
            a.max("100"),
            a.step("5"),
          ]),
          h.label([], [
            h.span([], [h.text("Telephone mask")]),
            input_mask.view(prefix <> "-mask", "000 000", state.mask, Mask, [
              a.name("phone"),
            ]),
          ]),
          h.label([], [
            h.span([], [h.text("Letters only")]),
            field.input([
              a.name("letters"),
              key_filter.pattern(key_filter.Letters),
            ]),
          ]),
          slider.range("Price range", "price", 0, 100, state.bounds, Bounds, []),
        ]),
      ]),
      button.primary([a.type_("submit")], [h.text("Submit selections")]),
      h.p([a.id(prefix <> "-submitted")], [
        h.text("Submissions: " <> int.to_string(state.submissions)),
      ]),
    ],
  )
}
