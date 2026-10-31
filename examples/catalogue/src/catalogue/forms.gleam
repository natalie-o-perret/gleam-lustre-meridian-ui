import catalogue/common
import gleam/dict
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, Some}
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/autocomplete
import meridian_ui/badge
import meridian_ui/button
import meridian_ui/cascade_select
import meridian_ui/checkbox
import meridian_ui/date_picker
import meridian_ui/field
import meridian_ui/icon
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
    props: common.Properties,
    rating: Option(Float),
    zone: String,
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
  Properties(common.Properties)
  Rating(Option(Float))
  Zoned(date_picker.ZonedAction)
}

pub fn start(component: String) {
  common.start(
    Model(
      case component {
        "datepicker" -> "2026-11-05"
        "timepicker" -> "09:30:15"
        "datetimepicker" -> "2026-11-05T09:30:15"
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
      case component {
        "datetimepicker" -> #("2026-11-05T09:30", "2026-11-06T17:00")
        _ -> #("2026-11-01", "2026-11-15")
      },
      slider.Bounds(20, 80),
      "",
      dict.new(),
      Some(3.0),
      "disabled",
    ),
    update,
    Properties,
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
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        text: common.property(props, "value", model.text),
        choice: common.property(props, "value", model.choice),
        volume: common.property(props, "value", model.volume),
        checked: common.flag(props, "checked", model.checked),
        revealed: common.flag(props, "revealed", model.revealed),
        value: common.number(props, "value", model.value),
        query: common.property(props, "query", model.query),
        zone: common.property(props, "zone", model.zone),
        rating: case dict.has_key(props, "value") {
          True -> Some(common.decimal(props, "value", 3.0))
          False -> model.rating
        },
        selected: common.selected(
          dict.merge(model.props, props),
          model.selected,
          selection.Multiple,
        ),
        bounds: slider.Bounds(
          common.number(props, "lower", model.bounds.lower),
          common.number(props, "upper", model.bounds.upper),
        ),
        path: case common.property(props, "path", "keep") {
          "none" -> []
          "tokens" -> ["design", "tokens"]
          "api" -> ["engineering", "api"]
          _ -> model.path
        },
        tags: case dict.get(props, "tags") {
          Ok(value) ->
            list.fold(
              string.split(value, ","),
              input_tags.Model([], ""),
              input_tags.add,
            )
          Error(_) -> model.tags
        },
      )
    Text(value) -> Model(..model, text: value, status: "Value: " <> value)
    Query(value) -> Model(..model, query: value)
    Choice(value) ->
      Model(..model, choice: value, status: "Selected: " <> value)
    Checked(value) -> Model(..model, checked: value)
    Reveal -> Model(..model, revealed: !model.revealed)
    Rate(value) ->
      Model(..model, value: value, status: "Rating: " <> int.to_string(value))
    Rating(value) ->
      Model(
        ..model,
        rating: value,
        status: "Rating: "
          <> case value {
            Some(value) -> float.to_string(value)
            _ -> "Unrated"
          },
      )
    Zoned(action) -> {
      let value =
        date_picker.update_zoned(
          date_picker.ZonedValue(model.text, model.zone),
          action,
        )
      Model(..model, text: value.value, zone: value.zone)
    }
    Volume(value) -> Model(..model, volume: value)
    Select(values) -> Model(..model, selected: values)
    Segment(action) ->
      Model(
        ..model,
        selected: select_button.update(
          model.selected,
          action,
          common.mode(model.props, selection.Multiple),
        ),
      )
    Path(action) ->
      Model(..model, path: cascade_select.update(model.path, action))
    Tags(action) -> Model(..model, tags: input_tags.update(model.tags, action))
    Dates(action) ->
      Model(..model, dates: date_picker.update(model.dates, action))
    Bounds(action) ->
      Model(
        ..model,
        bounds: slider.update(
          model.bounds,
          action,
          common.number(model.props, "minimum", 0),
          common.number(model.props, "maximum", 100),
        ),
      )
    Mask(value) ->
      Model(..model, text: value.masked, status: "Raw value: " <> value.raw)
    Submit ->
      Model(..model, status: "The native form is valid. Nothing was sent.")
  }
}

pub fn auto_complete(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Choose a language"),
    autocomplete.view(
      "languages",
      common.attrs(model.props, [a.value(model.text), e.on_input(Text)]),
      list.take(
        [
          autocomplete.suggestion("Gleam", "Typed and friendly"),
          autocomplete.suggestion("Elixir", "Functional and concurrent"),
          autocomplete.suggestion("Erlang", "Built for resilience"),
          autocomplete.suggestion("Clojure", "Lisp on the JVM"),
          autocomplete.suggestion("Rust", "Memory-safe systems"),
          autocomplete.suggestion("Go", "Simple concurrent services"),
          autocomplete.suggestion("TypeScript", "Typed JavaScript"),
          autocomplete.suggestion("JavaScript", "The web platform"),
          autocomplete.suggestion("Python", "Readable and versatile"),
          autocomplete.suggestion("Ruby", "Expressive and dynamic"),
          autocomplete.suggestion("Haskell", "Pure and lazy"),
          autocomplete.suggestion("OCaml", "Functional and practical"),
          autocomplete.suggestion("F#", "Functional on .NET"),
          autocomplete.suggestion("Scala", "Functional and object-oriented"),
          autocomplete.suggestion("Kotlin", "Concise on the JVM"),
          autocomplete.suggestion("Java", "Portable and established"),
          autocomplete.suggestion("Swift", "Modern native applications"),
          autocomplete.suggestion("C", "Close to the machine"),
          autocomplete.suggestion("C++", "Systems and abstractions"),
          autocomplete.suggestion("Zig", "Explicit systems programming"),
        ],
        common.number(model.props, "suggestions", 20),
      ),
    ),
  )
}

pub fn cascade_select_example(model: Model) -> Element(Msg) {
  cascade_select.view(
    "team",
    common.property(model.props, "label", "Team"),
    "team",
    model.path,
    common.flag(model.props, "required", False),
    Path,
    common.attrs(model.props, []),
    common.nodes(),
  )
}

pub fn checkbox_example(model: Model) -> Element(Msg) {
  common.row([
    checkbox.view(
      common.property(model.props, "label", "Send project updates"),
      "Choose whether to receive updates",
      common.attrs(model.props, [
        a.checked(model.checked),
        e.on_check(Checked),
      ]),
    ),
    h.text(common.property(model.props, "label", "Send project updates")),
    checkbox.view("Disabled choice", "Unavailable", [
      a.disabled(True),
      a.checked(True),
    ]),
  ])
}

pub fn date_picker_example(model: Model) -> Element(Msg) {
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    common.field(
      common.property(model.props, "label", "Single date"),
      date_picker.view(
        common.attrs(model.props, [
          a.name("date"),
          a.value(model.text),
          a.required(True),
          e.on_input(Text),
        ]),
      ),
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
  let label =
    common.property(model.props, "label", "Meeting time (09:00-17:00)")
  let attrs =
    common.attrs(model.props, [
      a.min(common.property(model.props, "min", "09:00")),
      a.max(common.property(model.props, "max", "17:00")),
      a.step(common.property(model.props, "step", "1")),
      a.required(True),
    ])
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    case model.zone {
      "disabled" ->
        common.field(
          label,
          date_picker.time([
            a.name("time"),
            a.value(model.text),
            e.on_input(Text),
            ..attrs
          ]),
        )
      _ ->
        date_picker.zoned_time(
          label,
          "time",
          date_picker.ZonedValue(model.text, case model.zone {
            "browser" -> ""
            _ -> model.zone
          }),
          Zoned,
          attrs,
        )
    },
    button.primary([a.type_("submit")], [h.text("Validate time")]),
  ])
}

pub fn date_time_picker_example(model: Model) -> Element(Msg) {
  let label = common.property(model.props, "label", "Meeting date and time")
  let attrs =
    common.attrs(model.props, [
      a.min(common.property(model.props, "min", "2026-11-01T09:00")),
      a.max(common.property(model.props, "max", "2026-11-30T17:00")),
      a.step(common.property(model.props, "step", "1")),
      a.required(True),
    ])
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    case model.zone {
      "disabled" ->
        common.field(
          label,
          date_picker.date_time([
            a.name("date-time"),
            a.value(model.text),
            e.on_input(Text),
            ..attrs
          ]),
        )
      _ ->
        date_picker.zoned_date_time(
          label,
          "date-time",
          date_picker.ZonedValue(model.text, case model.zone {
            "browser" -> ""
            _ -> model.zone
          }),
          Zoned,
          attrs,
        )
    },
    date_picker.date_time_range(
      "Workshop dates and times",
      "workshop",
      model.dates.0,
      model.dates.1,
      True,
      Dates,
      [],
    ),
    h.p([a.class("muted")], [
      h.text(
        "Zone changes keep the clock time. Your application handles conversion to an instant.",
      ),
    ]),
    button.primary([a.type_("submit")], [h.text("Validate date and time")]),
  ])
}

pub fn float_label(model: Model) -> Element(Msg) {
  field.floating(
    "project",
    common.property(model.props, "label", "Project name"),
    [],
    field.input(
      common.attrs(model.props, [
        a.id("project"),
        a.placeholder(" "),
        a.value(model.text),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn icon_field(model: Model) -> Element(Msg) {
  common.field(
    "Search projects",
    field.icon(
      [],
      icon.view(
        case common.property(model.props, "icon", "search") {
          "mail" -> icon.Mail
          "user" -> icon.User
          _ -> icon.Search
        },
        [],
      ),
      field.input(
        common.attrs(model.props, [
          a.type_("search"),
          a.value(model.text),
          e.on_input(Text),
        ]),
      ),
    ),
  )
}

pub fn ifta_label(model: Model) -> Element(Msg) {
  field.inset(
    "reference",
    common.property(model.props, "label", "Project reference"),
    [],
    field.input(
      common.attrs(model.props, [
        a.id("reference"),
        a.value(model.text),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn input_color(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Accent colour"),
    field.colour(
      common.attrs(model.props, [
        a.value(case model.text {
          "" -> "#b41472"
          value -> value
        }),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn input_group(model: Model) -> Element(Msg) {
  common.field(
    "Website name",
    field.group([], [
      field.addon([], [
        h.text(common.property(model.props, "prefix", "https://")),
      ]),
      field.input(
        common.attrs(model.props, [
          a.value(model.text),
          e.on_input(Text),
          a.aria_label("Website name"),
        ]),
      ),
      field.addon([], [
        h.text(common.property(model.props, "suffix", ".example")),
      ]),
    ]),
  )
}

pub fn input_mask_example(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Telephone"),
    input_mask.view(
      "telephone",
      common.property(model.props, "mask", "000 000 0000"),
      model.text,
      Mask,
      common.attrs(model.props, [
        a.inputmode("tel"),
      ]),
    ),
  )
}

pub fn input_number(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Seats (1-50)"),
    field.number(
      common.attrs(model.props, [
        a.min("1"),
        a.max("50"),
        a.step("1"),
        a.value(model.text),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn input_otp_example(model: Model) -> Element(Msg) {
  common.field(
    "Verification code",
    input_otp.view(
      common.number(model.props, "digits", 6),
      case common.property(model.props, "alphabet", "digits") {
        "alphanumeric" -> input_otp.Alphanumeric
        _ -> input_otp.Digits
      },
      common.attrs(model.props, [
        a.name("code"),
        a.placeholder("000000"),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn input_password(model: Model) -> Element(Msg) {
  password.view(
    "password",
    common.property(model.props, "label", "Account password"),
    model.revealed,
    Reveal,
    common.attrs(model.props, [
      a.value(model.text),
      e.on_input(Text),
    ]),
  )
}

pub fn input_tags_example(model: Model) -> Element(Msg) {
  input_tags.view(
    "tags",
    common.property(model.props, "label", "Project labels"),
    "labels",
    common.flag(model.props, "required", False),
    model.tags,
    Tags,
    common.attrs(model.props, []),
  )
}

pub fn input_text(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Your name"),
    field.input(
      common.attrs(model.props, [
        a.placeholder("Alex Morgan"),
        a.value(model.text),
        e.on_input(Text),
      ]),
    ),
  )
}

pub fn key_filter_example(model: Model) -> Element(Msg) {
  h.form([a.class("meridian-form"), e.on_submit(fn(_) { Submit })], [
    common.field(
      "Letters and spaces",
      field.input([
        case dict.get(model.props, "pattern") {
          Ok(pattern) -> a.pattern(pattern)
          Error(_) -> key_filter.pattern(key_filter.Letters)
        },
        a.title(common.property(model.props, "hint", "Letters and spaces only.")),
        a.required(True),
      ]),
    ),
    button.primary([a.type_("submit")], [h.text("Validate")]),
  ])
}

pub fn knob_example(model: Model) -> Element(Msg) {
  knob.view(
    "Volume",
    model.volume,
    Volume,
    common.attrs(model.props, [
      a.min("0"),
      a.max("100"),
      a.step("5"),
    ]),
  )
}

pub fn label(model: Model) -> Element(Msg) {
  common.stack([
    h.label([a.for("label-example")], [
      h.text(common.property(
        model.props,
        "label",
        "Click this label to focus its input",
      )),
    ]),
    field.input([a.id("label-example"), a.value(model.text), e.on_input(Text)]),
  ])
}

pub fn listbox_example(model: Model) -> Element(Msg) {
  listbox.view(
    "Teams",
    common.number(model.props, "rows", 4),
    common.mode(model.props, selection.Multiple),
    Select,
    common.attrs(model.props, [a.name("teams")]),
    [
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
    ],
  )
}

pub fn radio_button(model: Model) -> Element(Msg) {
  common.row([
    radio.view(
      common.property(model.props, "label", "Design"),
      common.attrs(model.props, [
        a.name("team"),
        a.value("design"),
        a.checked(model.choice == "design"),
        e.on_check(fn(_) { Choice("design") }),
      ]),
    ),
    radio.view("Engineering", [
      a.name("team"),
      a.value("engineering"),
      a.checked(model.choice == "engineering"),
      e.on_check(fn(_) { Choice("engineering") }),
    ]),
  ])
}

pub fn rating_example(model: Model) -> Element(Msg) {
  rating.range(
    "How was your experience?",
    "rating",
    model.rating,
    common.decimal(model.props, "minimum", 1.0),
    common.decimal(model.props, "maximum", 5.0),
    common.decimal(model.props, "step", 1.0),
    common.flag(model.props, "required", False),
    Rating,
    common.attrs(model.props, []),
  )
}

pub fn select_example(model: Model) -> Element(Msg) {
  select.view_with(
    common.property(model.props, "label", "Team"),
    model.query,
    model.choice,
    Query,
    Choice,
    common.attrs(model.props, [a.name("team")]),
    [
      select.Option("design", "Design", False),
      select.Option("engineering", "Engineering", False),
      select.Option("support", "Support", False),
    ],
    fn(option) {
      case common.property(model.props, "content", "tags") {
        "plain" -> h.text(option.label)
        _ -> badge.view(badge.Accent, [], [h.text(option.label)])
      }
    },
  )
}

pub fn select_button_example(model: Model) -> Element(Msg) {
  select_button.view(
    "Visible teams",
    "teams",
    common.mode(model.props, selection.Multiple),
    common.flag(model.props, "required", False),
    model.selected,
    Segment,
    common.attrs(model.props, []),
    [
      select_button.Choice("design", "Design", False),
      select_button.Choice("engineering", "Engineering", False),
      select_button.Choice("support", "Support", False),
    ],
  )
}

pub fn slider_example(model: Model) -> Element(Msg) {
  slider.range(
    common.property(model.props, "label", "Budget range"),
    "budget",
    common.number(model.props, "minimum", 0),
    common.number(model.props, "maximum", 100),
    model.bounds,
    Bounds,
    common.attrs(model.props, []),
  )
}

pub fn textarea(model: Model) -> Element(Msg) {
  common.field(
    common.property(model.props, "label", "Project notes"),
    field.textarea(
      common.attrs(model.props, [
        a.placeholder("What are you working on?"),
        e.on_input(Text),
      ]),
      model.text,
    ),
  )
}

pub fn toggle_button_example(model: Model) -> Element(Msg) {
  toggle_button.view(
    model.checked,
    common.attrs(model.props, [e.on_click(Checked(!model.checked))]),
    [
      h.text(common.property(model.props, "label", "Pin project")),
    ],
  )
}

pub fn toggle_switch_example(model: Model) -> Element(Msg) {
  toggle_switch.view(
    common.property(model.props, "label", "Email notifications"),
    common.attrs(model.props, [
      a.checked(model.checked),
      e.on_check(Checked),
    ]),
  )
}
