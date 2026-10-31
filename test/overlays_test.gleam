import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/confirm_dialog
import meridian_ui/confirm_popup
import meridian_ui/dialog
import meridian_ui/drawer
import meridian_ui/popover

pub fn dialogs_use_native_top_layer_lifecycle_without_pretending_open_attribute_is_modal_test() {
  let html =
    dialog.view("edit", "Edit <project>", True, Nil, [], [
      h.text("Retained content"),
    ])
    |> element.to_string
  html |> string.starts_with("<dialog") |> should.be_true
  list.each(
    [
      "aria-labelledby=\"edit-title\"",
      "id=\"edit-title\"",
      "data-open=\"true\"",
      "data-modal=\"true\"",
      "Edit &lt;project&gt;",
      "Retained content",
      "type=\"button\"",
    ],
    fn(text) { html |> string.contains(text) |> should.be_true },
  )
  html |> string.contains(" open") |> should.be_false
  dialog.nonmodal("edit", "Edit", True, Nil, [], [])
  |> element.to_string
  |> string.contains("data-modal=\"false\"")
  |> should.be_true
}

pub fn confirmation_dialogs_and_popups_expose_alertdialog_and_safe_initial_focus_test() {
  list.each(
    [
      confirm_dialog.view("delete", "Delete project?", True, Nil, Nil, [], [
        h.text("This cannot be undone."),
      ]),
      confirm_popup.view("delete", "Delete project?", True, Nil, Nil, [], [
        h.text("This cannot be undone."),
      ]),
    ],
    fn(control) {
      let html = element.to_string(control)
      html |> string.contains("role=\"alertdialog\"") |> should.be_true
      html |> string.contains("role=\"dialog\"") |> should.be_false
      html |> string.contains("autofocus") |> should.be_true
      html |> string.contains(">Cancel</button>") |> should.be_true
      html |> string.contains(">Confirm</button>") |> should.be_true
    },
  )
}

pub fn drawers_cover_every_logical_side_without_copying_navigation_shell_state_test() {
  list.each(
    [
      #(drawer.Start, "start"),
      #(drawer.Left, "left"),
      #(drawer.Right, "right"),
      #(drawer.End, "end"),
      #(drawer.Top, "top"),
      #(drawer.Bottom, "bottom"),
    ],
    fn(side) {
      let html =
        drawer.view("navigation", "Navigation", side.0, True, Nil, [], [
          h.text("Drawer content"),
        ])
        |> element.to_string
      html |> string.contains("meridian-drawer") |> should.be_true
      html
      |> string.contains("data-side=\"" <> side.1 <> "\"")
      |> should.be_true
      html |> string.contains("data-modal=\"true\"") |> should.be_true
    },
  )
}

pub fn popovers_preserve_native_light_dismissal_and_explicit_menu_roles_test() {
  let html =
    popover.view("actions", "Actions", False, Nil, [a.role("menu")], [])
    |> element.to_string
  html |> string.contains("popover=\"auto\"") |> should.be_true
  html |> string.contains("role=\"menu\"") |> should.be_true
  html |> string.contains("role=\"dialog\"") |> should.be_false
  let trigger =
    popover.trigger(
      "actions",
      "Open actions",
      True,
      Nil,
      [a.attribute("aria-haspopup", "menu")],
      [h.text("Actions")],
    )
    |> element.to_string
  trigger |> string.contains("aria-haspopup=\"menu\"") |> should.be_true
  trigger |> string.contains("aria-haspopup=\"dialog\"") |> should.be_false
  trigger |> string.contains("aria-controls=\"actions\"") |> should.be_true
  trigger
  |> string.contains("data-meridian-opener=\"actions\"")
  |> should.be_true
}
