import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/accordion
import meridian_ui/orientation.{Horizontal, Vertical}
import meridian_ui/splitter
import meridian_ui/stepper
import meridian_ui/tabs
import meridian_ui/toolbar

pub fn accordion_state_supports_exclusive_multiple_and_duplicate_cleanup_test() {
  accordion.toggle([], "one", False) |> should.equal(["one"])
  accordion.toggle(["one"], "two", False) |> should.equal(["two"])
  accordion.toggle(["one"], "two", True) |> should.equal(["one", "two"])
  accordion.toggle(["one", "one", "two"], "one", True) |> should.equal(["two"])
}

pub fn accordion_uses_real_headings_disabled_buttons_and_labelled_regions_test() {
  let html =
    accordion.view(
      "faq",
      "Project questions",
      False,
      ["one", "two"],
      fn(_) { Nil },
      [],
      [
        accordion.Panel("one", "First <question>", False, [h.text("Answer one")]),
        accordion.Panel("two", "Locked", True, [h.text("Answer two")]),
      ],
    )
    |> element.to_string
  list.each(
    [
      "aria-label=\"Project questions\"",
      "data-meridian-keys=\"accordion\"",
      "id=\"faq-one-toggle\"",
      "aria-labelledby=\"faq-one-toggle\"",
      "First &lt;question&gt;",
      " disabled",
      "Answer two",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
  html
  |> string.split("aria-expanded=\"true\"")
  |> list.length
  |> should.equal(2)
  html |> string.split(" hidden") |> list.length |> should.equal(2)
}

pub fn tabs_select_only_an_enabled_panel_and_keep_all_panels_in_dom_test() {
  let html =
    tabs.view("settings", "Settings", "locked", Vertical, tabs.Manual, [], [
      tabs.Tab("one", "Account", False, Nil, [], [h.text("Keep my account")]),
      tabs.Tab("locked", "Locked", True, Nil, [], [h.text("Locked data")]),
    ])
    |> element.to_string
  list.each(
    [
      "role=\"tablist\"",
      "aria-orientation=\"vertical\"",
      "data-activation=\"manual\"",
      "aria-controls=\"settings-panel-one\"",
      "aria-labelledby=\"settings-tab-one\"",
      "role=\"tabpanel\"",
      "Keep my account",
      "Locked data",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
  html
  |> string.split("aria-selected=\"true\"")
  |> list.length
  |> should.equal(2)
  html |> string.split(" hidden") |> list.length |> should.equal(2)
}

pub fn linear_steps_require_every_preceding_step_to_be_complete_test() {
  let initial = [
    stepper.Step("account", "Account", False, False, Nil, []),
    stepper.Step("review", "Review", False, False, Nil, []),
  ]
  stepper.can_enter(initial, "account", True) |> should.be_true
  stepper.can_enter(initial, "review", True) |> should.be_false
  stepper.can_enter(initial, "review", False) |> should.be_true
  stepper.can_enter(initial, "missing", False) |> should.be_false
  let completed = [
    stepper.Step("account", "Account", True, False, Nil, []),
    stepper.Step("review", "Review", False, False, Nil, []),
  ]
  stepper.can_enter(completed, "review", True) |> should.be_true
  let html =
    stepper.view("setup", "Setup", "account", Horizontal, True, [], completed)
    |> element.to_string
  html |> string.contains("1. Account (complete)") |> should.be_true
  html |> string.contains("aria-current=\"step\"") |> should.be_true
}

pub fn splitter_bounds_and_collapsed_panes_are_safe_test() {
  splitter.clamp(-10, 10, 90) |> should.equal(10)
  splitter.clamp(110, 10, 90) |> should.equal(90)
  splitter.clamp(50, 80, 20) |> should.equal(80)
  let html =
    splitter.view(
      "work",
      "Resize workspace",
      Horizontal,
      0,
      100,
      0,
      fn(_) { Nil },
      [],
      [h.text("First")],
      [h.text("Second")],
    )
    |> element.to_string
  list.each(
    [
      "role=\"separator\"",
      "aria-label=\"Resize workspace\"",
      "aria-orientation=\"vertical\"",
      "aria-valuenow=\"0\"",
      "aria-controls=\"work-first work-second\"",
      " inert",
      "aria-hidden=\"true\"",
      "First",
      "Second",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
}

pub fn toolbar_marks_controls_without_overriding_their_native_roles_test() {
  let html =
    toolbar.view("Project actions", Horizontal, [], [
      h.button([a.type_("button"), toolbar.item()], [h.text("Save")]),
    ])
    |> element.to_string
  html |> string.contains("role=\"toolbar\"") |> should.be_true
  html |> string.contains("aria-label=\"Project actions\"") |> should.be_true
  html |> string.contains("data-meridian-item=\"true\"") |> should.be_true
  html |> string.contains("role=\"menuitem\"") |> should.be_false
}
