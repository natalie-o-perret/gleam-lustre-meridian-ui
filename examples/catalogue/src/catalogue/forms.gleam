import catalogue/common
import gleam/int
import gleam/list
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/autocomplete
import meridian_ui/button
import meridian_ui/cascade_select
import meridian_ui/checkbox
import meridian_ui/date_picker
import meridian_ui/field
import meridian_ui/input_mask
import meridian_ui/input_otp
import meridian_ui/input_tags
import meridian_ui/key_filter
import meridian_ui/knob
import meridian_ui/listbox
import meridian_ui/password
import meridian_ui/radio
import meridian_ui/rating
import meridian_ui/select
import meridian_ui/select_button
import meridian_ui/selection
import meridian_ui/slider
import meridian_ui/toggle_button
import meridian_ui/toggle_switch

pub type Model {
  Model(
    text: String,
    query: String,
    choice: String,
    checked: Bool,
    revealed: Bool,
    value: Int,
    volume: String,
    selected: List(String),
    path: List(String),
    tags: input_tags.Model,
    dates: #(String, String),
    bounds: slider.Bounds,
    status: String,
  )
}

pub type Msg {
  Text(String)
  Query(String)
  Choice(String)
  Checked(Bool)
  Reveal
  Rate(Int)
  Volume(String)
  Select(List(String))
  Segment(select_button.Action)
  Path(cascade_select.Action)
  Tags(input_tags.Action)
  Dates(date_picker.Action)
  Bounds(slider.Action)
  Mask(input_mask.Value)
  Submit
}

pub fn start(component: String) {
  common.start(
    Model(
      case component {
        "datepicker" -> "2026-11-05"
        "timepicker" -> "09:30"
        "datetimepicker" -> "2026-11-05T09:30"
        _ -> ""
      },
      "",
      "design",
      False,
      False,
      3,
      "40",
      ["design"],
      [],
      input_tags.Model(["Gleam", "Lustre"], ""),
      #("2026-11-01", "2026-11-15"),
      slider.Bounds(20, 80),
      "",
    ),
    update,
    fn(model) {
      common.stack([
        case component {
          "autocomplete" -> auto_complete(model)
          "cascadeselect" -> cascade_select_example(model)
          "checkbox" -> checkbox_example(model)
          "datepicker" -> date_picker_example(model)
          "timepicker" -> time_picker_example(model)
          "datetimepicker" -> date_time_picker_example(model)
          "floatlabel" -> float_label(model)
          "iconfield" -> icon_field(model)
          "iftalabel" -> ifta_label(model)
          "inputcolor" -> input_color(model)
          "inputgroup" -> input_group(model)
          "inputmask" -> input_mask_example(model)
          "inputnumber" -> input_number(model)
          "inputotp" -> input_otp_example(model)
          "inputpassword" -> input_password(model)
          "inputtags" -> input_tags_example(model)
          "inputtext" -> input_text(model)
          "keyfilter" -> key_filter_example(model)
          "knob" -> knob_example(model)
          "label" -> label(model)
          "listbox" -> listbox_example(model)
          "radiobutton" -> radio_button(model)
          "rating" -> rating_example(model)
          "select" -> select_example(model)
          "selectbutton" -> select_button_example(model)
          "slider" -> slider_example(model)
          "textarea" -> textarea(model)
          "togglebutton" -> toggle_button_example(model)
          "toggleswitch" -> toggle_switch_example(model)
          _ -> common.missing()
        },
        h.p([a.role("status"), a.class("demo-status")], [h.text(model.status)]),
      ])
    },
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Text(value) -> Model(..model, text: value, status: "Value: " <> value)
    Query(value) -> Model(..model, query: value)
    Choice(value) ->
      Model(..model, choice: value, status: "Selected: " <> value)
    Checked(value) -> Model(..model, checked: value)
    Reveal -> Model(..model, revealed: !model.revealed)
    Rate(value) ->
      Model(..model, value: value, status: "Rating: " <> int.to_string(value))
    Volume(value) -> Model(..model, volume: value)
    Select(values) -> Model(..model, selected: values)
    Segment(action) ->
      Model(
        ..model,
        selected: select_button.update(
          model.selected,
          action,
          selection.Multiple,
        ),
      )
    Path(action) ->
      Model(..model, path: cascade_select.update(model.path, action))
    Tags(action) -> Model(..model, tags: input_tags.update(model.tags, action))
    Dates(action) ->
      Model(..model, dates: date_picker.update(model.dates, action))
    Bounds(action) ->
      Model(..model, bounds: slider.update(model.bounds, action, 0, 100))
    Mask(value) ->
      Model(..model, text: value.masked, status: "Raw value: " <> value.raw)
    Submit ->
      Model(..model, status: "The native form is valid. Nothing was sent.")
  }
}

pub fn auto_complete(model: Model) -> Element(Msg) {
  common.field(
    "Choose a language",
    autocomplete.view("languages", [a.value(model.text), e.on_input(Text)], [
      autocomplete.suggestion("Gleam", "Typed and friendly"),
      autocomplete.suggestion("Elixir", "Functional and concurrent"),
      autocomplete.suggestion("Erlang", "Built for resilience"),
    ]),
  )
}

pub fn cascade_select_example(model: Model) -> Element(Msg) {
  cascade_select.view(
    "team",
    "Team",
    "team",
    model.path,
    False,
    Path,
    [],
    common.nodes(),
  )
}

pub fn checkbox_example(model: Model) -> Element(Msg) {
  common.row([
    checkbox.view("Send project updates", "Choose whether to receive updates", [
      a.checked(model.checked),
      e.on_check(Checked),
    ]),
    h.text("Send project updates"),
    checkbox.view("Disabled choice", "Unavailable", [
      a.disabled(True),
      a.checked(True),
    ]),
  ])
}

pub fn date_picker_example(model: Model) -> Element(Msg) {
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    common.field(
      "Single date",
      date_picker.view([
        a.name("date"),
        a.value(model.text),
        a.required(True),
        e.on_input(Text),
      ]),
    ),
    date_picker.range(
      "Travel dates",
      "travel",
      model.dates.0,
      model.dates.1,
      True,
      Dates,
      [],
    ),
    common.field(
      "Month",
      date_picker.month([
        a.name("month"),
        a.default_value("2026-11"),
        e.on_input(Query),
      ]),
    ),
    button.primary([a.type_("submit")], [h.text("Validate dates")]),
  ])
}

pub fn time_picker_example(model: Model) -> Element(Msg) {
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    common.field(
      "Meeting time (09:00-17:00)",
      date_picker.time([
        a.name("time"),
        a.value(model.text),
        a.min("09:00"),
        a.max("17:00"),
        a.step("900"),
        a.required(True),
        e.on_input(Text),
      ]),
    ),
    button.primary([a.type_("submit")], [h.text("Validate time")]),
  ])
}

pub fn date_time_picker_example(model: Model) -> Element(Msg) {
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    common.field(
      "Meeting date and time",
      date_picker.date_time([
        a.name("date-time"),
        a.value(model.text),
        a.min("2026-11-01T09:00"),
        a.max("2026-11-30T17:00"),
        a.step("900"),
        a.required(True),
        e.on_input(Text),
      ]),
    ),
    h.p([a.class("muted")], [
      h.text(
        "This is a local date and time. Your application chooses the time zone.",
      ),
    ]),
    button.primary([a.type_("submit")], [h.text("Validate date and time")]),
  ])
}

pub fn float_label(model: Model) -> Element(Msg) {
  field.floating(
    "project",
    "Project name",
    [],
    field.input([
      a.id("project"),
      a.placeholder(" "),
      a.value(model.text),
      e.on_input(Text),
    ]),
  )
}

pub fn icon_field(model: Model) -> Element(Msg) {
  common.field(
    "Search projects",
    field.icon(
      [],
      h.text("⌕"),
      field.input([a.type_("search"), a.value(model.text), e.on_input(Text)]),
    ),
  )
}

pub fn ifta_label(model: Model) -> Element(Msg) {
  field.inset(
    "reference",
    "Project reference",
    [],
    field.input([a.id("reference"), a.value(model.text), e.on_input(Text)]),
  )
}

pub fn input_color(model: Model) -> Element(Msg) {
  common.field(
    "Accent colour",
    field.colour([
      a.value(case model.text {
        "" -> "#b41472"
        value -> value
      }),
      e.on_input(Text),
    ]),
  )
}

pub fn input_group(model: Model) -> Element(Msg) {
  common.field(
    "Website name",
    field.group([], [
      field.addon([], [h.text("https://")]),
      field.input([
        a.value(model.text),
        e.on_input(Text),
        a.aria_label("Website name"),
      ]),
      field.addon([], [h.text(".example")]),
    ]),
  )
}

pub fn input_mask_example(model: Model) -> Element(Msg) {
  common.field(
    "Telephone",
    input_mask.view("telephone", "000 000 0000", model.text, Mask, [
      a.inputmode("tel"),
    ]),
  )
}

pub fn input_number(model: Model) -> Element(Msg) {
  common.field(
    "Seats (1-50)",
    field.number([
      a.min("1"),
      a.max("50"),
      a.step("1"),
      a.value(model.text),
      e.on_input(Text),
    ]),
  )
}

pub fn input_otp_example(_model: Model) -> Element(Msg) {
  common.field(
    "Verification code",
    input_otp.view(6, input_otp.Digits, [
      a.name("code"),
      a.placeholder("000000"),
      e.on_input(Text),
    ]),
  )
}

pub fn input_password(model: Model) -> Element(Msg) {
  password.view("password", "Account password", model.revealed, Reveal, [
    a.value(model.text),
    e.on_input(Text),
  ])
}

pub fn input_tags_example(model: Model) -> Element(Msg) {
  input_tags.view(
    "tags",
    "Project labels",
    "labels",
    False,
    model.tags,
    Tags,
    [],
  )
}

pub fn input_text(model: Model) -> Element(Msg) {
  common.field(
    "Your name",
    field.input([
      a.placeholder("Alex Morgan"),
      a.value(model.text),
      e.on_input(Text),
    ]),
  )
}

pub fn key_filter_example(_model: Model) -> Element(Msg) {
  h.form([e.on_submit(fn(_) { Submit })], [
    common.field(
      "Letters and spaces",
      field.input([key_filter.pattern(key_filter.Letters), a.required(True)]),
    ),
    button.primary([a.type_("submit")], [h.text("Validate")]),
  ])
}

pub fn knob_example(model: Model) -> Element(Msg) {
  knob.view("Volume", model.volume, Volume, [
    a.min("0"),
    a.max("100"),
    a.step("5"),
  ])
}

pub fn label(model: Model) -> Element(Msg) {
  common.stack([
    h.label([a.for("label-example")], [
      h.text("Click this label to focus its input"),
    ]),
    field.input([a.id("label-example"), a.value(model.text), e.on_input(Text)]),
  ])
}

pub fn listbox_example(model: Model) -> Element(Msg) {
  listbox.view("Teams", 4, selection.Multiple, Select, [a.name("teams")], [
    listbox.option(
      "design",
      "Design",
      list.contains(model.selected, "design"),
      False,
    ),
    listbox.option(
      "engineering",
      "Engineering",
      list.contains(model.selected, "engineering"),
      False,
    ),
    listbox.option("support", "Support (unavailable)", False, True),
  ])
}

pub fn radio_button(model: Model) -> Element(Msg) {
  common.row([
    radio.view("Design", [
      a.name("team"),
      a.value("design"),
      a.checked(model.choice == "design"),
      e.on_check(fn(_) { Choice("design") }),
    ]),
    radio.view("Engineering", [
      a.name("team"),
      a.value("engineering"),
      a.checked(model.choice == "engineering"),
      e.on_check(fn(_) { Choice("engineering") }),
    ]),
  ])
}

pub fn rating_example(model: Model) -> Element(Msg) {
  rating.view(
    "How was your experience?",
    "rating",
    model.value,
    5,
    False,
    Rate,
    [],
  )
}

pub fn select_example(model: Model) -> Element(Msg) {
  select.view(
    "Team",
    model.query,
    model.choice,
    Query,
    Choice,
    [a.name("team")],
    [
      select.Option("design", "Design", False),
      select.Option("engineering", "Engineering", False),
      select.Option("support", "Support", False),
    ],
  )
}

pub fn select_button_example(model: Model) -> Element(Msg) {
  select_button.view(
    "Visible teams",
    "teams",
    selection.Multiple,
    False,
    model.selected,
    Segment,
    [],
    [
      select_button.Choice("design", "Design", False),
      select_button.Choice("engineering", "Engineering", False),
      select_button.Choice("support", "Support", False),
    ],
  )
}

pub fn slider_example(model: Model) -> Element(Msg) {
  slider.range("Budget range", "budget", 0, 100, model.bounds, Bounds, [])
}

pub fn textarea(model: Model) -> Element(Msg) {
  common.field(
    "Project notes",
    field.textarea(
      [a.placeholder("What are you working on?"), e.on_input(Text)],
      model.text,
    ),
  )
}

pub fn toggle_button_example(model: Model) -> Element(Msg) {
  toggle_button.view(model.checked, [e.on_click(Checked(!model.checked))], [
    h.text("Pin project"),
  ])
}

pub fn toggle_switch_example(model: Model) -> Element(Msg) {
  toggle_switch.view("Email notifications", [
    a.checked(model.checked),
    e.on_check(Checked),
  ])
}
