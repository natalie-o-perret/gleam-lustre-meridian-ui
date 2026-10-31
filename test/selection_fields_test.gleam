import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import meridian_ui/input_otp
import meridian_ui/input_tags
import meridian_ui/listbox
import meridian_ui/rating
import meridian_ui/select_button
import meridian_ui/selection

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
