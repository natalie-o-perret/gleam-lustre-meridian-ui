import gleam/list
import gleam/string
import gleeunit
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/badge
import meridian_ui/button
import meridian_ui/card
import meridian_ui/checkbox
import meridian_ui/field
import meridian_ui/shell
import meridian_ui/theme
import meridian_ui/tooltip

pub fn main() {
  gleeunit.main()
}

pub fn theme_cycle_and_system_override_test() {
  theme.next("light") |> should.equal("dark")
  theme.next("dark") |> should.equal("system")
  theme.next("system") |> should.equal("light")
  theme.is_dark("system", True) |> should.be_true
  theme.is_dark("system", False) |> should.be_false
  theme.is_dark("light", True) |> should.be_false
  theme.is_dark("dark", False) |> should.be_true
}

pub fn button_preserves_native_attributes_and_merges_classes_test() {
  let html =
    button.primary(
      [
        a.class("save"),
        a.disabled(True),
        tooltip.hint("Save changes"),
      ],
      [h.text("Save")],
    )
    |> element.to_string
  html |> string.contains("type=\"button\"") |> should.be_true
  html |> string.contains("button primary-button save") |> should.be_true
  html |> string.contains("disabled") |> should.be_true
  html |> string.contains("data-tooltip=\"Save changes\"") |> should.be_true
  html |> string.contains(">Save</button>") |> should.be_true
  button.view([a.type_("submit")], [])
  |> element.to_string
  |> string.contains("type=\"submit\"")
  |> should.be_true
}

pub fn cards_keep_their_semantic_elements_test() {
  card.section([a.aria_label("Details")], [h.text("Content")])
  |> element.to_string
  |> string.starts_with("<section")
  |> should.be_true
  card.article([], [])
  |> element.to_string
  |> string.contains("panel meridian-card")
  |> should.be_true
  card.article([], [])
  |> element.to_string
  |> string.starts_with("<article")
  |> should.be_true
}

pub fn every_button_variant_preserves_explicit_submit_and_reset_types_test() {
  list.each(["submit", "reset"], fn(kind) {
    list.each(
      [
        button.view([a.type_(kind)], []),
        button.primary([a.type_(kind)], []),
        button.text([a.type_(kind)], []),
        button.icon([a.type_(kind)], []),
      ],
      fn(control) {
        let html = control |> element.to_string
        html |> string.contains("type=\"" <> kind <> "\"") |> should.be_true
        html |> string.contains("type=\"button\"") |> should.be_false
        html |> string.split("type=\"") |> list.length |> should.equal(2)
      },
    )
  })
}

pub fn badge_tones_are_not_project_statuses_test() {
  list.each(
    [
      #(badge.Success, "badge-success"),
      #(badge.Warning, "badge-warning"),
      #(badge.Danger, "badge-danger"),
      #(badge.Accent, "badge-accent"),
    ],
    fn(item) {
      let html = badge.view(item.0, [], [h.text("Ready")]) |> element.to_string
      html |> string.contains(item.1) |> should.be_true
      html |> string.contains(">Ready</span>") |> should.be_true
    },
  )
}

pub fn fields_and_checkbox_keep_native_labels_test() {
  let search =
    field.search("Find records", h.span([], []), [a.value("<query>")])
    |> element.to_string
  search |> string.contains("Find records") |> should.be_true
  search |> string.contains("type=\"search\"") |> should.be_true
  search |> string.contains("&lt;query&gt;") |> should.be_true
  let check =
    checkbox.view("Select row", "Select this record", [a.checked(True)])
    |> element.to_string
  check |> string.contains("type=\"checkbox\"") |> should.be_true
  check |> string.contains("aria-label=\"Select row\"") |> should.be_true
  check |> string.contains("checked") |> should.be_true
  check |> string.contains("aria-hidden=\"true\"") |> should.be_true
  field.select([a.aria_label("Category")], [h.option([a.value("one")], "One")])
  |> element.to_string
  |> string.contains("<option value=\"one\">One</option>")
  |> should.be_true
}

pub fn shell_ids_are_per_instance_and_the_drawer_is_modal_test() {
  list.each(["one", "two"], fn(id) {
    let menu = shell.menu_button(id, True, Nil, h.text("Menu"), h.text("Close"))
    let html =
      shell.view(
        id,
        True,
        True,
        Nil,
        [],
        shell.Content(
          topbar: [menu],
          sidebar: [shell.close_button(Nil, h.text("Close"))],
          main: [h.text("Content")],
          footer: [],
        ),
      )
      |> element.to_string
    html |> string.contains("id=\"" <> id <> "\"") |> should.be_true
    html |> string.contains("id=\"" <> id <> "-navigation\"") |> should.be_true
    html
    |> string.contains("aria-controls=\"" <> id <> "-navigation\"")
    |> should.be_true
    html |> string.contains("href=\"#" <> id <> "-main\"") |> should.be_true
    html |> string.contains("role=\"dialog\"") |> should.be_true
    html |> string.contains("aria-modal=\"true\"") |> should.be_true
    html
    |> string.contains("<main id=\"" <> id <> "-main\" inert tabindex=\"-1\"")
    |> should.be_true
  })
}

pub fn rich_select_options_preserve_values_and_badges_test() {
  let html =
    field.select([a.aria_label("Status")], [
      field.option([a.value("blocked"), a.selected(True)], [
        badge.view(badge.Danger, [], [h.text("Blocked")]),
      ]),
    ])
    |> element.to_string
  html
  |> string.contains("<selectedcontent></selectedcontent>")
  |> should.be_true
  html |> string.contains("tabindex=\"-1\"") |> should.be_true
  html |> string.contains("value=\"blocked\"") |> should.be_true
  html |> string.contains("badge-danger") |> should.be_true
  html |> string.contains(">Blocked</span></option>") |> should.be_true
}
