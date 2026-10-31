import gleam/int
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/date_picker
import meridian_ui/field
import meridian_ui/password
import meridian_ui/radio
import meridian_ui/slider
import meridian_ui/toggle_button
import meridian_ui/toggle_switch

pub type FormState {
  FormState(
    title: String,
    email: String,
    query: String,
    amount: String,
    colour: String,
    volume: String,
    notes: String,
    password: String,
    plan: String,
    alerts: Bool,
    pinned: Bool,
    revealed: Bool,
    locked: Bool,
    submissions: Int,
  )
}

pub type FormMsg {
  SetTitle(String)
  SetEmail(String)
  SetQuery(String)
  SetAmount(String)
  SetColour(String)
  SetVolume(String)
  SetNotes(String)
  SetPassword(String)
  SetPlan(String)
  SetAlerts(Bool)
  TogglePin
  ToggleReveal
  ToggleLock
  Submitted
  Reset
}

pub type Model {
  Model(primary: FormState, secondary: FormState, dark: Bool)
}

pub type Msg {
  Primary(FormMsg)
  Secondary(FormMsg)
  ToggleTheme
}

pub fn main() {
  let app =
    lustre.simple(fn(_) { Model(initial(), initial(), False) }, update, view)
  let assert Ok(_) = lustre.start(app, "#forms-fixture", Nil)
  Nil
}

fn initial() -> FormState {
  FormState(
    title: "Orbit",
    email: "owner@example.test",
    query: "",
    amount: "12.5",
    colour: "#b41472",
    volume: "35",
    notes: "Initial note",
    password: "",
    plan: "basic",
    alerts: False,
    pinned: False,
    revealed: False,
    locked: False,
    submissions: 0,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Primary(msg) -> Model(..model, primary: update_form(model.primary, msg))
    Secondary(msg) ->
      Model(..model, secondary: update_form(model.secondary, msg))
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn update_form(model: FormState, msg: FormMsg) -> FormState {
  case msg {
    SetTitle(value) -> FormState(..model, title: value)
    SetEmail(value) -> FormState(..model, email: value)
    SetQuery(value) -> FormState(..model, query: value)
    SetAmount(value) -> FormState(..model, amount: value)
    SetColour(value) -> FormState(..model, colour: value)
    SetVolume(value) -> FormState(..model, volume: value)
    SetNotes(value) -> FormState(..model, notes: value)
    SetPassword(value) -> FormState(..model, password: value)
    SetPlan(value) -> FormState(..model, plan: value)
    SetAlerts(value) -> FormState(..model, alerts: value)
    TogglePin -> FormState(..model, pinned: !model.pinned)
    ToggleReveal -> FormState(..model, revealed: !model.revealed)
    ToggleLock -> FormState(..model, locked: !model.locked)
    Submitted -> FormState(..model, submissions: model.submissions + 1)
    Reset -> initial()
  }
}

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("forms-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Meridian native forms")]),
        button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
        form("primary", model.primary) |> element.map(Primary),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent form"),
      ],
      [
        h.h2([], [h.text("Independent dark instance")]),
        form("secondary", model.secondary) |> element.map(Secondary),
      ],
    ),
  ])
}

fn form(prefix: String, model: FormState) -> Element(FormMsg) {
  h.form(
    [
      a.id(prefix <> "-form"),
      a.class("fixture-form"),
      e.on_submit(fn(_) { Submitted }),
    ],
    [
      h.fieldset([a.class("fixture-fieldset")], [
        h.legend([], [h.text("Plan")]),
        h.div([a.class("fixture-row")], [
          radio.view("Basic", [
            a.name("plan"),
            a.value("basic"),
            a.checked(model.plan == "basic"),
            a.required(True),
            e.on_input(SetPlan),
          ]),
          radio.view("Team", [
            a.name("plan"),
            a.value("team"),
            a.checked(model.plan == "team"),
            e.on_input(SetPlan),
          ]),
          radio.view("Unavailable plan", [
            a.name("plan"),
            a.value("unavailable"),
            a.disabled(True),
          ]),
        ]),
      ]),
      h.div([a.class("fixture-row")], [
        toggle_switch.view("Email alerts", [
          a.name("alerts"),
          a.value("enabled"),
          a.checked(model.alerts),
          e.on_check(SetAlerts),
        ]),
        toggle_switch.view("Unavailable switch", [
          a.name("disabled-switch"),
          a.checked(True),
          a.disabled(True),
        ]),
        toggle_button.view(model.pinned, [e.on_click(TogglePin)], [
          h.text("Pin project"),
        ]),
        h.input([
          a.type_("hidden"),
          a.name("pinned"),
          a.value(case model.pinned {
            True -> "true"
            False -> "false"
          }),
        ]),
      ]),
      field.fluid([a.class("fixture-columns")], [
        field.floating(
          prefix <> "-title",
          "Project title",
          [],
          field.input([
            a.id(prefix <> "-title"),
            a.name("title"),
            a.placeholder(" "),
            a.value(model.title),
            a.required(True),
            e.on_input(SetTitle),
          ]),
        ),
        field.inset(
          prefix <> "-email",
          "Contact email",
          [],
          field.input([
            a.id(prefix <> "-email"),
            a.name("email"),
            a.type_("email"),
            a.value(model.email),
            a.autocomplete("email"),
            e.on_input(SetEmail),
          ]),
        ),
        field.floating(
          prefix <> "-scope",
          "Project scope",
          [],
          field.select([a.id(prefix <> "-scope"), a.name("scope")], [
            h.option([a.value("all")], "All projects"),
            h.option([a.value("open")], "Open projects"),
          ]),
        ),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-search")], [h.text("Search projects")]),
          field.icon(
            [],
            h.text("@"),
            field.input([
              a.id(prefix <> "-search"),
              a.name("query"),
              a.type_("search"),
              a.placeholder("Search projects"),
              a.value(model.query),
              e.on_input(SetQuery),
            ]),
          ),
        ]),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-reference")], [
            h.text("Read-only reference"),
          ]),
          field.trailing_icon(
            [],
            h.text("#"),
            field.input([
              a.id(prefix <> "-reference"),
              a.name("reference"),
              a.value("REF-001"),
              a.readonly(True),
            ]),
          ),
        ]),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-amount")], [h.text("Amount (EUR)")]),
          field.group([], [
            field.addon([], [h.text("EUR")]),
            field.number([
              a.id(prefix <> "-amount"),
              a.name("amount"),
              a.value(model.amount),
              a.min("0"),
              a.max("100"),
              a.step("0.5"),
              a.required(True),
              e.on_input(SetAmount),
            ]),
            button.view([e.on_click(SetAmount("25"))], [h.text("Use 25")]),
          ]),
        ]),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-disabled")], [h.text("Disabled code")]),
          field.input([
            a.id(prefix <> "-disabled"),
            a.name("disabled-code"),
            a.value("ignored"),
            a.disabled(True),
          ]),
        ]),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-colour")], [h.text("Theme colour")]),
          field.colour([
            a.id(prefix <> "-colour"),
            a.name("colour"),
            a.value(model.colour),
            e.on_input(SetColour),
          ]),
          h.code([], [h.text(model.colour)]),
        ]),
        h.div([a.class("fixture-field")], [
          h.label([a.for(prefix <> "-volume")], [h.text("Volume")]),
          slider.view([
            a.id(prefix <> "-volume"),
            a.name("volume"),
            a.min("0"),
            a.max("100"),
            a.step("5"),
            a.value(model.volume),
            e.on_input(SetVolume),
          ]),
          h.span([], [h.text("Current volume: " <> model.volume)]),
        ]),
      ]),
      h.div([a.class("fixture-field")], [
        h.label([a.for(prefix <> "-notes")], [h.text("Notes")]),
        field.textarea(
          [
            a.id(prefix <> "-notes"),
            a.name("notes"),
            a.rows(3),
            e.on_input(SetNotes),
          ],
          model.notes,
        ),
      ]),
      password.view(
        prefix <> "-password",
        "Account password",
        model.revealed,
        ToggleReveal,
        [
          a.name("password"),
          a.value(model.password),
          a.autocomplete("current-password"),
          a.disabled(model.locked),
          e.on_input(SetPassword),
        ],
      ),
      h.label([], [
        h.span([], [h.text("Appointment date")]),
        date_picker.view([
          a.name("date"),
          a.default_value("2024-02-28"),
          a.min("2024-02-27"),
          a.max("2024-03-03"),
          a.required(True),
        ]),
      ]),
      h.label([], [
        h.span([], [h.text("Appointment month")]),
        date_picker.month([
          a.name("month"),
          a.default_value("2024-02"),
          a.min("2024-02"),
          a.max("2024-08"),
          a.step("2"),
        ]),
      ]),
      h.label([], [
        h.span([], [h.text("Appointment time")]),
        date_picker.time([
          a.name("time"),
          a.default_value("10:15"),
          a.min("09:00"),
          a.max("17:00"),
          a.step("900"),
        ]),
      ]),
      h.label([], [
        h.span([], [h.text("Appointment date and time")]),
        date_picker.date_time([
          a.name("date-time"),
          a.default_value("2024-02-29T10:15"),
          a.min("2024-02-28T09:00"),
          a.max("2024-03-02T17:00"),
          a.step("900"),
        ]),
      ]),
      h.div([a.class("fixture-row")], [
        button.view([e.on_click(ToggleLock)], [
          h.text(case model.locked {
            True -> "Unlock password field"
            False -> "Lock password field"
          }),
        ]),
        button.view([e.on_click(Reset)], [h.text("Reset fields")]),
        button.primary([a.type_("submit")], [h.text("Submit form")]),
      ]),
      h.p([a.id(prefix <> "-submissions")], [
        h.text("Submissions: " <> int.to_string(model.submissions)),
      ]),
    ],
  )
}
