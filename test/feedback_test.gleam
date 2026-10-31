import gleam/list
import gleam/option.{None, Some}
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/avatar
import meridian_ui/chip
import meridian_ui/divider
import meridian_ui/message
import meridian_ui/progress
import meridian_ui/skeleton
import meridian_ui/spinner

pub fn skeletons_are_decorative_and_allow_shapes_and_sizing_test() {
  let html =
    skeleton.circle([a.class("person"), a.style("width", "48px")])
    |> element.to_string
  html
  |> string.contains("meridian-skeleton meridian-skeleton-circle person")
  |> should.be_true
  html |> string.contains("aria-hidden=\"true\"") |> should.be_true
  html |> string.contains("width:48px") |> should.be_true
  html |> string.contains("tabindex") |> should.be_false
}

pub fn progress_uses_native_percentages_and_clamps_values_test() {
  list.each([#(-1, "0"), #(42, "42"), #(101, "100")], fn(item) {
    let html = progress.view("Upload", Some(item.0), []) |> element.to_string
    html |> string.starts_with("<progress") |> should.be_true
    html |> string.contains("max=\"100\"") |> should.be_true
    html |> string.contains("value=\"" <> item.1 <> "\"") |> should.be_true
    html |> string.contains("aria-label=\"Upload\"") |> should.be_true
    html |> string.contains(">" <> item.1 <> "%</progress>") |> should.be_true
  })
  let html = progress.view("Loading records", None, []) |> element.to_string
  html |> string.contains("role=\"progressbar\"") |> should.be_true
  html |> string.contains("aria-valuenow") |> should.be_false
}

pub fn spinner_exposes_progress_but_hides_its_svg_test() {
  list.each([#(-1, "0"), #(75, "75"), #(101, "100")], fn(item) {
    let html = spinner.view("Processing", Some(item.0), []) |> element.to_string
    html |> string.contains("role=\"progressbar\"") |> should.be_true
    html
    |> string.contains("aria-valuenow=\"" <> item.1 <> "\"")
    |> should.be_true
    html
    |> string.contains("stroke-dasharray=\"" <> item.1 <> " 100\"")
    |> should.be_true
    html |> string.contains("aria-hidden=\"true\"") |> should.be_true
    html |> string.contains("focusable=\"false\"") |> should.be_true
    html |> string.contains("indeterminate") |> should.be_false
  })
  let html = spinner.view("Loading", None, []) |> element.to_string
  html |> string.contains("meridian-spinner-indeterminate") |> should.be_true
  html |> string.contains("aria-valuenow") |> should.be_false
}

pub fn messages_keep_tone_live_region_and_native_dismissal_test() {
  list.each(
    [
      #(message.Info, "info"),
      #(message.Success, "success"),
      #(message.Warning, "warning"),
      #(message.Danger, "danger"),
    ],
    fn(item) {
      message.view(item.0, [], [h.text("Saved <record>")])
      |> element.to_string
      |> string.contains("meridian-message-" <> item.1)
      |> should.be_true
    },
  )
  let html =
    message.dismissible(message.Success, Nil, [], [h.text("Saved <record>")])
    |> element.to_string
  html |> string.contains("role=\"status\"") |> should.be_true
  html |> string.contains("Saved &lt;record&gt;") |> should.be_true
  html |> string.contains("aria-label=\"Dismiss message\"") |> should.be_true
  html |> string.contains("type=\"button\"") |> should.be_true
  let urgent =
    message.view(message.Danger, [a.role("alert")], []) |> element.to_string
  urgent |> string.contains("role=\"alert\"") |> should.be_true
  urgent |> string.contains("role=\"status\"") |> should.be_false
}

pub fn avatars_have_full_names_and_native_image_alternatives_test() {
  let html =
    avatar.group("Project owners", [], [
      avatar.label("Alex <Taylor>", "AT", []),
      avatar.image("/alex.png", "Alex Taylor", []),
    ])
    |> element.to_string
  html |> string.contains("role=\"group\"") |> should.be_true
  html |> string.contains("aria-label=\"Project owners\"") |> should.be_true
  html
  |> string.contains("aria-label=\"Alex &lt;Taylor&gt;\"")
  |> should.be_true
  html |> string.contains(">AT</span>") |> should.be_true
  html |> string.contains("alt=\"Alex Taylor\"") |> should.be_true
  html |> string.contains("src=\"/alex.png\"") |> should.be_true
}

pub fn chips_have_labelled_native_removal_without_submission_test() {
  let plain = chip.view([], [h.text("Design")]) |> element.to_string
  plain |> string.contains("<button") |> should.be_false
  let html =
    chip.removable("Design", Nil, [a.class("selected")], [h.text("Design")])
    |> element.to_string
  html |> string.contains("meridian-chip selected") |> should.be_true
  html |> string.contains("aria-label=\"Remove Design\"") |> should.be_true
  html |> string.contains("type=\"button\"") |> should.be_true
}

pub fn dividers_keep_separator_semantics_and_orientation_test() {
  divider.view([])
  |> element.to_string
  |> string.starts_with("<hr")
  |> should.be_true
  let vertical = divider.vertical([]) |> element.to_string
  vertical |> string.contains("role=\"separator\"") |> should.be_true
  vertical |> string.contains("aria-orientation=\"vertical\"") |> should.be_true
  let labelled = divider.label("Next section", []) |> element.to_string
  labelled |> string.contains("aria-label=\"Next section\"") |> should.be_true
  labelled |> string.contains("aria-hidden=\"true\"") |> should.be_true
}
