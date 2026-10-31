import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/field
import meridian_ui/fieldset
import meridian_ui/panel
import meridian_ui/scroll_area

pub fn panels_keep_headings_actions_and_escaped_content_test() {
  let html =
    panel.view(
      "Project <details>",
      [a.id("project")],
      [button.view([], [h.text("Action")])],
      [h.text("Safe <content>")],
    )
    |> element.to_string
  html |> string.starts_with("<section") |> should.be_true
  html |> string.contains("id=\"project\"") |> should.be_true
  html |> string.contains("Project &lt;details&gt;</h2>") |> should.be_true
  html |> string.contains("meridian-panel-actions") |> should.be_true
  html |> string.contains("type=\"button\"") |> should.be_true
  html |> string.contains("Safe &lt;content&gt;") |> should.be_true
}

pub fn collapsible_panels_link_native_buttons_and_retained_regions_test() {
  list.each([#(True, "true"), #(False, "false")], fn(state) {
    let html =
      panel.collapsible("project", "Details", state.0, Nil, [], [], [
        field.input([a.name("retained"), a.value("still here")]),
      ])
      |> element.to_string
    list.each(
      [
        "id=\"project-toggle\"",
        "aria-controls=\"project-content\"",
        "aria-expanded=\"" <> state.1 <> "\"",
        "id=\"project-content\"",
        "aria-labelledby=\"project-toggle\"",
        "role=\"region\"",
        "type=\"button\"",
        "name=\"retained\"",
        "value=\"still here\"",
      ],
      fn(attribute) { html |> string.contains(attribute) |> should.be_true },
    )
    html |> string.contains(" hidden") |> should.equal(!state.0)
  })
}

pub fn fieldsets_keep_native_legend_disabled_and_form_semantics_test() {
  let html =
    fieldset.view("Account <settings>", [a.disabled(True), a.form("account")], [
      field.input([a.name("region")]),
    ])
    |> element.to_string
  html |> string.starts_with("<fieldset") |> should.be_true
  html |> string.contains(" disabled") |> should.be_true
  html |> string.contains("form=\"account\"") |> should.be_true
  html
  |> string.contains("<legend>Account &lt;settings&gt;</legend>")
  |> should.be_true
  html |> string.contains("name=\"region\"") |> should.be_true
}

pub fn collapsible_fieldsets_keep_unique_relationships_and_legend_toggle_test() {
  list.each(["one", "two"], fn(id) {
    let html =
      fieldset.collapsible(id, "Advanced", False, Nil, [], [
        field.input([a.name("saved")]),
      ])
      |> element.to_string
    html |> string.contains("<legend><button") |> should.be_true
    html |> string.contains("id=\"" <> id <> "-toggle\"") |> should.be_true
    html
    |> string.contains("aria-controls=\"" <> id <> "-content\"")
    |> should.be_true
    html
    |> string.contains("aria-labelledby=\"" <> id <> "-toggle\"")
    |> should.be_true
    html |> string.contains("aria-expanded=\"false\"") |> should.be_true
    html |> string.contains(" hidden") |> should.be_true
    html |> string.contains("name=\"saved\"") |> should.be_true
  })
}

pub fn scroll_areas_are_labelled_keyboard_focusable_native_regions_test() {
  let html =
    scroll_area.view(
      "Recent <events>",
      [a.id("events"), a.style("max-block-size", "12rem")],
      [h.p([], [h.text("One event")])],
    )
    |> element.to_string
  list.each(
    [
      "meridian-scroll-area",
      "role=\"region\"",
      "aria-label=\"Recent &lt;events&gt;\"",
      "tabindex=\"0\"",
      "id=\"events\"",
      "max-block-size:12rem",
      "One event",
    ],
    fn(content) { html |> string.contains(content) |> should.be_true },
  )
}

pub fn empty_panel_actions_do_not_reserve_an_extra_header_gap_test() {
  panel.view("Details", [], [], [])
  |> element.to_string
  |> string.contains("meridian-panel-actions")
  |> should.be_false
}
