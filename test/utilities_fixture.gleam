import gleam/int
import gleam/list
import lustre
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/animate_on_scroll
import meridian_ui/badge
import meridian_ui/block_ui
import meridian_ui/button
import meridian_ui/carousel
import meridian_ui/compare
import meridian_ui/field
import meridian_ui/file_upload
import meridian_ui/focus_trap
import meridian_ui/gallery
import meridian_ui/inplace
import meridian_ui/message
import meridian_ui/meter_group
import meridian_ui/orientation
import meridian_ui/ripple
import meridian_ui/scroll_area
import meridian_ui/scroll_top
import meridian_ui/terminal
import meridian_ui/timeline
import meridian_ui/toast
import meridian_ui/url

pub type Model {
  Model(
    blocked: Bool,
    editing: Bool,
    name: String,
    draft: String,
    trapped: Bool,
    nested: Bool,
    notices: List(toast.Notice),
    next_notice: Int,
    terminal: terminal.Model,
    slide: Int,
    preview: Bool,
    compared: Int,
    files: List(file_upload.File),
    errors: List(String),
    dark: Bool,
  )
}

pub type Msg {
  Block(Bool)
  Edit
  Save
  Cancel
  Draft(String)
  Trap(Bool)
  Nested(Bool)
  Notify
  Dismiss(String)
  Terminal(terminal.Action)
  Slide(Int)
  Preview(Bool)
  Compare(Int)
  Files(file_upload.Selection)
  ToggleTheme
}

pub fn main() {
  let app =
    lustre.simple(
      fn(_) {
        Model(
          False,
          False,
          "Project",
          "",
          False,
          False,
          [],
          0,
          terminal.Model("", [], [], -1),
          0,
          False,
          50,
          [],
          [],
          False,
        )
      },
      update,
      view,
    )
  let assert Ok(_) = lustre.start(app, "#utilities-fixture", Nil)
  Nil
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Block(value) -> Model(..model, blocked: value)
    Edit -> Model(..model, editing: True, draft: model.name)
    Save -> Model(..model, editing: False, name: model.draft)
    Cancel -> Model(..model, editing: False)
    Draft(value) -> Model(..model, draft: value)
    Trap(value) -> Model(..model, trapped: value)
    Nested(value) -> Model(..model, nested: value)
    Notify ->
      Model(
        ..model,
        next_notice: model.next_notice + 1,
        notices: list.append(model.notices, [
          toast.Notice(
            int.to_string(model.next_notice),
            message.Info,
            "Saved " <> int.to_string(model.next_notice),
            1500,
          ),
        ]),
      )
    Dismiss(id) -> Model(..model, notices: toast.remove(model.notices, id))
    Terminal(terminal.Submit) -> {
      let state = terminal.update(model.terminal, terminal.Submit)
      Model(
        ..model,
        terminal: terminal.update(
          state,
          terminal.Output("result", "Received: " <> model.terminal.draft),
        ),
      )
    }
    Terminal(action) ->
      Model(..model, terminal: terminal.update(model.terminal, action))
    Slide(value) -> Model(..model, slide: value)
    Preview(value) -> Model(..model, preview: value)
    Compare(value) -> Model(..model, compared: value)
    Files(selected) ->
      Model(..model, files: selected.files, errors: selected.errors)
    ToggleTheme -> Model(..model, dark: !model.dark)
  }
}

fn view(model: Model) -> Element(Msg) {
  let assert Ok(image) = url.parse("/test/avatar.svg")
  h.main(
    [
      a.id("utilities-demo"),
      a.class("meridian-ui fixture"),
      a.data("theme", case model.dark {
        True -> "dark"
        False -> "light"
      }),
    ],
    [
      h.h1([], [h.text("Utilities and media")]),
      button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
      h.section([], [
        block_ui.view("Saving project", model.blocked, [], [
          button.view([e.on_click(Block(True))], [h.text("Begin blocked work")]),
        ]),
        button.view([e.on_click(Block(False))], [h.text("Finish blocked work")]),
        inplace.view(
          "project",
          model.editing,
          Edit,
          Cancel,
          [],
          [h.p([a.id("saved-name")], [h.text(model.name)])],
          [
            h.label([], [
              h.span([], [h.text("Project editor")]),
              field.input([a.value(model.draft), e.on_input(Draft)]),
            ]),
            button.view([e.on_click(Save)], [h.text("Save project")]),
          ],
        ),
        button.view([e.on_click(Trap(True))], [h.text("Activate focus trap")]),
        focus_trap.view("Focus area", model.trapped, [], [
          button.view([], [h.text("First trapped action")]),
          button.view([e.on_click(Nested(True))], [
            h.text("Activate nested trap"),
          ]),
          focus_trap.view("Nested focus area", model.nested, [], [
            button.view([e.on_click(Nested(False))], [
              h.text("Release nested trap"),
            ]),
          ]),
          button.view([e.on_click(Trap(False))], [h.text("Release focus trap")]),
        ]),
        button.view([], [h.text("Outside trap action")]),
        button.view([e.on_click(Notify)], [h.text("Notify")]),
        toast.view("Notifications", model.notices, Dismiss, []),
        button.view([ripple.enabled()], [h.text("Ripple action")]),
        badge.counter("Unread", 125, 99, []),
        badge.dot("New updates", []),
        meter_group.view("Storage", 100, [], [
          meter_group.Meter("Used", 40, badge.Accent),
          meter_group.Meter("Reserved", 20, badge.Warning),
        ]),
        timeline.view("History", orientation.Vertical, [], [
          timeline.Event("Created", "2026-10-31", "Today", [
            h.text("Project created"),
          ]),
        ]),
        terminal.view("Command console", model.terminal, Terminal, []),
      ]),
      h.section([], [
        carousel.view("Highlights", model.slide, Slide, [], [
          h.div([], [
            h.p([], [h.text("First highlight")]),
            button.view([], [h.text("Slide action")]),
          ]),
          h.p([], [h.text("Second highlight")]),
        ]),
        gallery.view(
          "gallery-preview",
          "Team gallery",
          model.slide,
          model.preview,
          Slide,
          Preview(True),
          Preview(False),
          [],
          [
            gallery.Image(image, "Alex avatar", "First image"),
            gallery.Image(image, "Blair avatar", "Second image"),
          ],
        ),
        compare.view(
          "Image comparison",
          image,
          "Before",
          image,
          "After",
          model.compared,
          Compare,
          [],
        ),
        file_upload.view("Attachments", ".txt,text/plain", 64, True, Files, []),
        h.ul(
          [a.id("selected-files")],
          list.map(model.files, fn(file) {
            h.li([], [
              h.text(
                file_upload.name(file)
                <> ": "
                <> int.to_string(file_upload.size(file)),
              ),
            ])
          }),
        ),
        h.ul(
          [a.id("file-errors"), a.aria_live("polite")],
          list.map(model.errors, fn(error) { h.li([], [h.text(error)]) }),
        ),
        scroll_area.view(
          "Scroll example",
          [a.id("example-scroll"), a.style("block-size", "10rem")],
          [
            h.div([a.style("block-size", "30rem")], [h.text("Top of container")]),
            scroll_top.view("example-scroll", "Back to container top", []),
          ],
        ),
        animate_on_scroll.view([], [h.p([], [h.text("Revealed content")])]),
        scroll_top.view("", "Back to page top", []),
      ]),
    ],
  )
}
