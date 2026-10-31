import gleam/list
import gleam/string
import gleeunit/should
import lustre/element
import lustre/element/html as h
import meridian_ui/badge
import meridian_ui/block_ui
import meridian_ui/focus_trap
import meridian_ui/inplace
import meridian_ui/meter_group
import meridian_ui/orientation
import meridian_ui/timeline
import meridian_ui/url

pub fn urls_reject_executable_schemes_and_obfuscated_input_test() {
  list.each(
    [
      "/projects?name=%E9",
      "#account",
      "../team",
      "https://example.com",
      "mailto:a@example.com",
      "tel:+353123",
    ],
    fn(value) {
      let assert Ok(parsed) = url.parse(value)
      url.to_string(parsed) |> should.equal(value)
    },
  )
  list.each(
    [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "vbscript:do()",
      "java\nscript:alert(1)",
      "",
      "https://a b",
    ],
    fn(value) { url.parse(value) |> should.be_error },
  )
}

pub fn utility_markup_preserves_native_inertness_labels_and_editor_nodes_test() {
  let blocked =
    block_ui.view("Saving", True, [], [h.button([], [h.text("Save")])])
    |> element.to_string
  blocked |> string.contains(" inert") |> should.be_true
  blocked |> string.contains("aria-busy=\"true\"") |> should.be_true
  let trap = focus_trap.view("Choices", True, [], []) |> element.to_string
  trap |> string.contains("aria-label=\"Choices\"") |> should.be_true
  let editor =
    inplace.view("name", False, Nil, Nil, [], [h.text("Current")], [h.input([])])
    |> element.to_string
  editor |> string.contains("<input") |> should.be_true
  editor |> string.contains("Edit name") |> should.be_true
  editor |> string.contains("Cancel") |> should.be_true
}

pub fn counters_keep_exact_accessible_counts_when_visual_count_is_capped_test() {
  let html = badge.counter("Unread", 125, 99, []) |> element.to_string
  html |> string.contains("99+") |> should.be_true
  html |> string.contains("Unread: 125") |> should.be_true
  badge.counter("Unread", -1, 0, [])
  |> element.to_string
  |> string.contains("Unread: 0")
  |> should.be_true
}

pub fn meters_and_timelines_expose_values_without_relying_on_colour_test() {
  let html =
    meter_group.view("Storage", 100, [], [
      meter_group.Meter("Used", 60, badge.Accent),
      meter_group.Meter("Reserved", 70, badge.Warning),
    ])
    |> element.to_string
  html |> string.contains("Total: 130 of 100") |> should.be_true
  html |> string.contains("flex-grow:40") |> should.be_true
  html |> string.contains("Reserved: 70") |> should.be_true
  html |> string.contains("role=\"list\"") |> should.be_true
  timeline.view("Activity", orientation.Vertical, [], [
    timeline.Event("Created", "2026-10-31", "Today", [h.text("Project created")]),
  ])
  |> element.to_string
  |> string.contains("datetime=\"2026-10-31\"")
  |> should.be_true
}
