import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/field
import meridian_ui/password
import meridian_ui/radio
import meridian_ui/slider
import meridian_ui/toggle_button
import meridian_ui/toggle_switch

pub fn radios_preserve_group_values_and_native_constraints_test() {
  let html =
    radio.view("Team <plan>", [
      a.name("plan"),
      a.value("team"),
      a.checked(True),
      a.required(True),
      a.disabled(True),
    ])
    |> element.to_string
  html |> string.contains("type=\"radio\"") |> should.be_true
  html |> string.contains("name=\"plan\"") |> should.be_true
  html |> string.contains("value=\"team\"") |> should.be_true
  html |> string.contains("checked") |> should.be_true
  html |> string.contains("required") |> should.be_true
  html |> string.contains("disabled") |> should.be_true
  html |> string.contains("Team &lt;plan&gt;") |> should.be_true
}

pub fn switches_keep_checkbox_form_behaviour_and_hide_only_the_decoration_test() {
  let html =
    toggle_switch.view("Email alerts", [
      a.name("alerts"),
      a.value("enabled"),
      a.checked(True),
    ])
    |> element.to_string
  html |> string.contains("type=\"checkbox\"") |> should.be_true
  html |> string.contains("role=\"switch\"") |> should.be_true
  html |> string.contains("name=\"alerts\"") |> should.be_true
  html |> string.contains("value=\"enabled\"") |> should.be_true
  html |> string.contains("aria-hidden=\"true\"") |> should.be_true
  html |> string.contains("Email alerts") |> should.be_true
}

pub fn toggle_buttons_have_lowercase_pressed_state_and_do_not_submit_test() {
  list.each([#(True, "true"), #(False, "false")], fn(state) {
    let html =
      toggle_button.view(state.0, [], [h.text("Pin project")])
      |> element.to_string
    html
    |> string.contains("aria-pressed=\"" <> state.1 <> "\"")
    |> should.be_true
    html |> string.contains("type=\"button\"") |> should.be_true
    html |> string.contains(">Pin project</button>") |> should.be_true
  })
}

pub fn sliders_keep_native_bounds_steps_and_values_test() {
  let html =
    slider.view([
      a.aria_label("Volume"),
      a.name("volume"),
      a.min("0"),
      a.max("100"),
      a.step("5"),
      a.value("35"),
    ])
    |> element.to_string
  list.each(
    [
      "type=\"range\"",
      "name=\"volume\"",
      "min=\"0\"",
      "max=\"100\"",
      "step=\"5\"",
      "value=\"35\"",
    ],
    fn(attribute) { html |> string.contains(attribute) |> should.be_true },
  )
}

pub fn number_and_colour_inputs_do_not_parse_or_reformat_values_test() {
  let number =
    field.number([
      a.name("amount"),
      a.value("12.50"),
      a.min("0"),
      a.max("100"),
      a.step("0.5"),
      a.required(True),
    ])
    |> element.to_string
  number |> string.contains("type=\"number\"") |> should.be_true
  number |> string.contains("value=\"12.50\"") |> should.be_true
  number |> string.contains("step=\"0.5\"") |> should.be_true
  let colour =
    field.colour([a.name("tint"), a.value("#b41472")]) |> element.to_string
  colour |> string.contains("type=\"color\"") |> should.be_true
  colour |> string.contains("value=\"#b41472\"") |> should.be_true
}

pub fn textarea_preserves_multiline_text_and_escapes_closing_tags_test() {
  let html =
    field.textarea(
      [a.name("notes"), a.readonly(True), a.rows(4)],
      "First line\n</textarea><script>no()</script>",
    )
    |> element.to_string
  html |> string.starts_with("<textarea") |> should.be_true
  html |> string.contains("name=\"notes\"") |> should.be_true
  html |> string.contains("rows=\"4\"") |> should.be_true
  html |> string.contains("readonly") |> should.be_true
  html
  |> string.contains(
    "First line\n&lt;/textarea&gt;&lt;script&gt;no()&lt;/script&gt;",
  )
  |> should.be_true
}

pub fn groups_keep_addons_and_buttons_as_semantic_children_test() {
  let html =
    field.fluid([], [
      field.group([a.aria_label("Amount")], [
        field.addon([], [h.text("EUR")]),
        field.number([a.aria_label("Amount"), a.name("amount")]),
        button.view([], [h.text("Apply")]),
      ]),
    ])
    |> element.to_string
  html |> string.contains("meridian-fluid") |> should.be_true
  html |> string.contains("meridian-input-group") |> should.be_true
  html |> string.contains("meridian-input-addon") |> should.be_true
  html |> string.contains(">EUR</span>") |> should.be_true
  html |> string.contains("type=\"button\"") |> should.be_true
}

pub fn floating_and_inset_labels_reference_the_real_control_test() {
  list.each(
    [
      field.floating(
        "title",
        "Project <title>",
        [],
        field.input([a.id("title"), a.placeholder(" ")]),
      ),
      field.inset("title", "Project <title>", [], field.input([a.id("title")])),
    ],
    fn(control) {
      let html = control |> element.to_string
      html |> string.contains("for=\"title\"") |> should.be_true
      html |> string.contains("id=\"title\"") |> should.be_true
      html |> string.contains("Project &lt;title&gt;") |> should.be_true
    },
  )
}

pub fn icon_fields_hide_decorations_without_hiding_the_control_test() {
  list.each(
    [
      field.icon([], h.text("@"), field.input([a.aria_label("Email")])),
      field.trailing_icon([], h.text("@"), field.input([a.aria_label("Email")])),
    ],
    fn(control) {
      let html = control |> element.to_string
      html |> string.contains("meridian-field-icon") |> should.be_true
      html |> string.contains("aria-hidden=\"true\"") |> should.be_true
      html |> string.contains("aria-label=\"Email\"") |> should.be_true
    },
  )
}

pub fn password_visibility_preserves_identity_values_and_button_relationship_test() {
  list.each([#(False, "password", "Show"), #(True, "text", "Hide")], fn(state) {
    let html =
      password.view("account-password", "Account password", state.0, Nil, [
        a.name("password"),
        a.value("demo <value>"),
        a.autocomplete("current-password"),
      ])
      |> element.to_string
    html |> string.contains("type=\"" <> state.1 <> "\"") |> should.be_true
    html
    |> string.contains("aria-label=\"" <> state.2 <> " Account password\"")
    |> should.be_true
    html
    |> string.contains("aria-controls=\"account-password\"")
    |> should.be_true
    html |> string.contains("for=\"account-password\"") |> should.be_true
    html |> string.contains("value=\"demo &lt;value&gt;\"") |> should.be_true
    html
    |> string.contains("autocomplete=\"current-password\"")
    |> should.be_true
    html |> string.contains("type=\"button\"") |> should.be_true
    html |> string.contains("<svg") |> should.be_true
    html |> string.contains("aria-hidden=\"true\"") |> should.be_true
  })
}

pub fn disabled_password_fields_disable_the_reveal_button_too_test() {
  let html =
    password.view("locked", "Locked password", False, Nil, [a.disabled(True)])
    |> element.to_string
  html |> string.split(" disabled") |> list.length |> should.equal(3)
}
