import gleam/option.{None, Some}
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import meridian_ui/autocomplete
import meridian_ui/cascade_select
import meridian_ui/date_picker
import meridian_ui/hierarchy.{Node}
import meridian_ui/knob

fn nodes() {
  [
    Node("projects", "Projects", False, [
      Node("one", "One", False, []),
      Node("locked", "Locked", True, []),
    ]),
    Node("two", "Two", False, []),
  ]
}

pub fn hierarchy_validation_paths_and_visible_order_test() {
  hierarchy.validate(nodes()) |> should.equal(Ok(Nil))
  hierarchy.validate([Node("", "Empty", False, [])]) |> should.be_error
  hierarchy.validate([Node("same", "A", False, [Node("same", "B", False, [])])])
  |> should.be_error
  hierarchy.find_path(nodes(), "one") |> should.equal(Some(["projects", "one"]))
  hierarchy.find_path(nodes(), "absent") |> should.equal(None)
  hierarchy.visible(nodes(), [])
  |> should.equal([
    Node("projects", "Projects", False, [
      Node("one", "One", False, []),
      Node("locked", "Locked", True, []),
    ]),
    Node("two", "Two", False, []),
  ])
  hierarchy.all(nodes())
  |> should.equal(hierarchy.visible(nodes(), ["projects"]))
}

pub fn cascade_paths_truncate_stale_children_and_only_submit_enabled_leaves_test() {
  cascade_select.choose(["projects", "one"], 0, "two") |> should.equal(["two"])
  cascade_select.choose(["projects", "one"], 1, "")
  |> should.equal(["projects"])
  []
  |> cascade_select.update(cascade_select.Choose(0, "projects"))
  |> cascade_select.update(cascade_select.Choose(1, "one"))
  |> should.equal(["projects", "one"])
  cascade_select.leaf_value(nodes(), ["projects"]) |> should.equal(None)
  cascade_select.leaf_value(nodes(), ["projects", "one"])
  |> should.equal(Some("one"))
  cascade_select.leaf_value(nodes(), ["projects", "locked"])
  |> should.equal(None)
  let html =
    cascade_select.view(
      "project",
      "Project",
      "project",
      ["projects", "one"],
      True,
      fn(_) { Nil },
      [],
      nodes(),
    )
    |> element.to_string
  html |> string.contains("Project: level 2") |> should.be_true
  html |> string.contains("type=\"hidden\" value=\"one\"") |> should.be_true
  html |> string.contains("required") |> should.be_true
}

pub fn autocomplete_keeps_browser_owned_suggestions_and_escaped_labels_test() {
  let html =
    autocomplete.view("owner", [a.aria_label("Owner")], [
      autocomplete.suggestion("A<lex", "Alex <team>"),
    ])
    |> element.to_string
  html |> string.contains("list=\"owner-suggestions\"") |> should.be_true
  html
  |> string.contains("<datalist id=\"owner-suggestions\"")
  |> should.be_true
  html |> string.contains("Alex &lt;team&gt;") |> should.be_true
}

pub fn date_ranges_keep_iso_values_and_link_both_native_constraints_test() {
  let html =
    date_picker.range(
      "Project dates",
      "dates",
      "2026-10-01",
      "2026-10-30",
      True,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("max=\"2026-10-30\"") |> should.be_true
  html |> string.contains("min=\"2026-10-01\"") |> should.be_true
  html |> string.contains("name=\"dates-start\"") |> should.be_true
  html |> string.contains("name=\"dates-end\"") |> should.be_true
  #("2026-01-01", "2026-02-01")
  |> date_picker.update(date_picker.Start("2026-01-10"))
  |> date_picker.update(date_picker.End("2026-02-10"))
  |> should.equal(#("2026-01-10", "2026-02-10"))
}

pub fn knobs_keep_a_real_native_range_instead_of_a_fake_painted_slider_test() {
  let html =
    knob.view("Volume", "35", fn(_) { Nil }, [
      a.min("0"),
      a.max("100"),
      a.step("5"),
      a.name("volume"),
    ])
    |> element.to_string
  html |> string.contains("type=\"range\"") |> should.be_true
  html |> string.contains("aria-label=\"Volume\"") |> should.be_true
  html |> string.contains("step=\"5\"") |> should.be_true
  html |> string.contains("name=\"volume\"") |> should.be_true
  html |> string.contains("aria-hidden=\"true\"") |> should.be_true
}
