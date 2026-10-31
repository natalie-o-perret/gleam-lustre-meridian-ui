import gleam/list
import gleam/option.{None, Some}
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/badge
import meridian_ui/input_otp
import meridian_ui/input_tags
import meridian_ui/listbox
import meridian_ui/rating
import meridian_ui/select
import meridian_ui/select_button
import meridian_ui/selection

pub fn fractional_ratings_keep_native_values_constraints_and_clear_semantics_test() {
  let html =
    rating.range(
      "Quality",
      "quality",
      Some(2.5),
      0.0,
      5.0,
      0.5,
      True,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("value=\"2.5\"") |> should.be_true
  html |> string.contains("aria-label=\"2.5 stars\"") |> should.be_true
  html |> string.contains(" checked") |> should.be_true
  html |> string.contains(" required") |> should.be_true
  html |> string.split("type=\"radio\"") |> list.length |> should.equal(12)
  let empty =
    rating.range(
      "Quality",
      "quality",
      None,
      1.0,
      5.0,
      0.5,
      False,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  empty |> string.contains(" checked") |> should.be_false
  empty |> string.contains("Clear rating") |> should.be_true
  rating.range(
    "Quality",
    "quality",
    None,
    5.0,
    1.0,
    0.0,
    False,
    fn(_) { Nil },
    [],
  )
  |> element.to_string
  |> string.contains("role=\"alert\"")
  |> should.be_true
}

pub fn offset_fractional_ratings_keep_the_first_click_target_at_least_24_pixels_test() {
  let html =
    rating.range(
      "Quality",
      "quality",
      Some(0.2),
      0.2,
      5.0,
      1.0,
      False,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("--rating-unit:120.0px") |> should.be_true
  html |> string.contains("value=\"0.2\"") |> should.be_true
}

pub fn select_templates_keep_native_values_and_filtered_selection_test() {
  let html =
    select.view_with(
      "Team",
      "missing",
      "design",
      fn(_) { Nil },
      fn(_) { Nil },
      [a.name("team")],
      [select.Option("design", "Design <team>", False)],
      fn(option) { badge.view(badge.Accent, [], [h.text(option.label)]) },
    )
    |> element.to_string
  html |> string.contains("value=\"design\"") |> should.be_true
  html |> string.contains("selected") |> should.be_true
  html |> string.contains("hidden") |> should.be_true
  html |> string.contains("badge-accent") |> should.be_true
  html |> string.contains("Design &lt;team&gt;") |> should.be_true
}

pub fn listboxes_keep_native_multiple_values_constraints_and_selection_test() {
  let html =
    listbox.view(
      "Owners",
      1,
      selection.Multiple,
      fn(_) { Nil },
      [a.name("owners"), a.required(True), a.disabled(True)],
      [
        listbox.option("one", "One <owner>", True, False),
        listbox.option("two", "Two", False, True),
      ],
    )
    |> element.to_string
  list.each(
    [
      "aria-label=\"Owners\"",
      "size=\"2\"",
      " multiple",
      " required",
      " disabled",
      " selected",
      "name=\"owners\"",
      "One &lt;owner&gt;",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
}

pub fn segmented_selection_preserves_radio_checkbox_and_required_semantics_test() {
  let choices = [
    select_button.Choice("one", "First", False),
    select_button.Choice("two", "Second", False),
  ]
  let single =
    select_button.view(
      "View",
      "view",
      selection.Single,
      True,
      [],
      fn(_) { Nil },
      [],
      choices,
    )
    |> element.to_string
  single |> string.contains("role=\"radiogroup\"") |> should.be_true
  single |> string.split("type=\"radio\"") |> list.length |> should.equal(3)
  single |> string.contains("required") |> should.be_true
  single |> string.contains("Clear selection") |> should.be_false
  let multiple =
    select_button.view(
      "Views",
      "views",
      selection.Multiple,
      True,
      [],
      fn(_) { Nil },
      [],
      choices,
    )
    |> element.to_string
  multiple
  |> string.split("type=\"checkbox\"")
  |> list.length
  |> should.equal(3)
  multiple |> string.split(" required") |> list.length |> should.equal(2)
  selection.toggle(["one"], "two", selection.Single) |> should.equal(["two"])
  selection.toggle(["one"], "two", selection.Multiple)
  |> should.equal(["one", "two"])
  []
  |> select_button.update(select_button.Toggle("one"), selection.Multiple)
  |> select_button.update(select_button.Toggle("two"), selection.Multiple)
  |> should.equal(["one", "two"])
}

pub fn rating_uses_named_native_radios_and_optional_clear_without_fake_slider_roles_test() {
  let html =
    rating.view("Project rating", "rating", 3, 5, False, fn(_) { Nil }, [])
    |> element.to_string
  html |> string.contains("role=\"radiogroup\"") |> should.be_true
  html |> string.contains("aria-label=\"1 star\"") |> should.be_true
  html |> string.contains("aria-label=\"5 stars\"") |> should.be_true
  html |> string.split(" checked") |> list.length |> should.equal(2)
  html |> string.contains("Clear rating") |> should.be_true
  html
  |> string.split("class=\"meridian-rating-star\"")
  |> list.length
  |> should.equal(6)
  rating.display("Read-only rating", 20, 5, [])
  |> element.to_string
  |> string.contains("Read-only rating: 5 of 5")
  |> should.be_true
}

pub fn otp_preserves_native_string_editing_and_autofill_with_exact_constraints_test() {
  let html =
    input_otp.view(6, input_otp.Digits, [
      a.aria_label("Verification code"),
      a.name("code"),
      a.value("001234"),
    ])
    |> element.to_string
  list.each(
    [
      "autocomplete=\"one-time-code\"",
      "inputmode=\"numeric\"",
      "minlength=\"6\"",
      "maxlength=\"6\"",
      "pattern=\"[0-9]{6}\"",
      "value=\"001234\"",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
}

pub fn tags_trim_deduplicate_remove_and_keep_drafts_without_parsing_user_content_test() {
  let model = input_tags.Model(["One"], "draft")
  input_tags.add(model, "  é <项目>  ")
  |> should.equal(input_tags.Model(["One", "é <项目>"], ""))
  input_tags.add(model, " One ") |> should.equal(input_tags.Model(["One"], ""))
  input_tags.add(model, "   ") |> should.equal(input_tags.Model(["One"], ""))
  input_tags.remove(model, "One") |> should.equal(input_tags.Model([], "draft"))
  input_tags.Model([], "")
  |> input_tags.update(input_tags.Add("One"))
  |> input_tags.update(input_tags.Add("Two"))
  |> input_tags.update(input_tags.Edit("Three"))
  |> input_tags.update(input_tags.Remove("One"))
  |> should.equal(input_tags.Model(["Two"], "Three"))
  let html =
    input_tags.view("tags", "Labels", "labels", True, model, fn(_) { Nil }, [])
    |> element.to_string
  html |> string.contains("aria-label=\"Remove One\"") |> should.be_true
  html |> string.contains("Remove Remove") |> should.be_false
  html |> string.contains("value=\"draft\"") |> should.be_true
  html |> string.split(" name=\"labels\"") |> list.length |> should.equal(3)
}
