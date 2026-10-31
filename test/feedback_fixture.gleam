import gleam/dynamic.{type Dynamic}
import gleam/int
import gleam/option.{None, Some}
import lustre
import lustre/attribute as a
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/avatar
import meridian_ui/button
import meridian_ui/chip
import meridian_ui/divider
import meridian_ui/message
import meridian_ui/progress
import meridian_ui/skeleton
import meridian_ui/spinner

pub type Model {
  Model(value: Int, loading: Bool, notice: Bool, selected: Bool, dark: Bool)
}

pub type Msg {
  ChangeProgress(Int)
  FinishLoading
  Dismiss
  Remove
  ToggleTheme
  Reset
}

pub fn main() {
  let app =
    lustre.application(fn(_) { #(initial(), effect.none()) }, update, view)
  let assert Ok(_) = lustre.start(app, "#feedback-fixture", Nil)
  Nil
}

fn initial() -> Model {
  Model(42, True, True, True, False)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  let model = case msg {
    ChangeProgress(value) -> Model(..model, value: value)
    FinishLoading -> Model(..model, loading: False)
    Dismiss -> Model(..model, notice: False)
    Remove -> Model(..model, selected: False)
    ToggleTheme -> Model(..model, dark: !model.dark)
    Reset -> initial()
  }
  let target = case msg {
    Dismiss -> Some("#messages-region")
    Remove -> Some("#people-region")
    FinishLoading -> Some("#loading-region")
    _ -> None
  }
  let focus = case target {
    None -> effect.none()
    Some(selector) ->
      effect.after_paint(fn(_, root) { focus_region(root, selector) })
  }
  #(model, focus)
}

@external(javascript, "./feedback_fixture_ffi.mjs", "focusRegion")
fn focus_region(root: Dynamic, selector: String) -> Nil

fn view(model: Model) -> Element(Msg) {
  h.div([], [
    h.main(
      [
        a.id("component-demo"),
        a.class("meridian-ui fixture"),
        a.data("theme", case model.dark {
          True -> "dark"
          False -> "light"
        }),
      ],
      [
        h.h1([], [h.text("Meridian loading and feedback")]),
        h.div([a.class("fixture-row")], [
          button.view([e.on_click(ToggleTheme)], [h.text("Toggle theme")]),
          button.view([e.on_click(Reset)], [h.text("Reset preview")]),
        ]),
        h.section([a.aria_label("Progress")], [
          h.h2([], [h.text("Progress")]),
          h.label([], [
            h.text("Progress value"),
            h.input([
              a.type_("range"),
              a.min("-50"),
              a.max("150"),
              a.value(int.to_string(model.value)),
              e.on_input(fn(value) {
                ChangeProgress(case int.parse(value) {
                  Ok(n) -> n
                  Error(_) -> 0
                })
              }),
            ]),
          ]),
          progress.view("Upload", Some(model.value), [a.id("known-progress")]),
          progress.view("Fetching records", None, []),
          h.div([a.class("fixture-row")], [
            spinner.view("Processing", Some(model.value), [
              a.id("known-spinner"),
            ]),
            spinner.view("Loading", None, [a.id("loading-spinner")]),
          ]),
        ]),
        h.section(
          [
            a.aria_label("Records"),
            a.aria_busy(model.loading),
            a.id("loading-region"),
            a.tabindex(-1),
          ],
          [
            h.h2([], [h.text("Loading placeholders")]),
            ..case model.loading {
              True -> [
                skeleton.circle([]),
                skeleton.view([a.style("width", "60%")]),
                skeleton.view([]),
                button.view([e.on_click(FinishLoading)], [
                  h.text("Finish loading"),
                ]),
              ]
              False -> [h.p([], [h.text("Records loaded")])]
            }
          ],
        ),
        divider.label("Feedback", []),
        h.section(
          [a.aria_label("Messages"), a.id("messages-region"), a.tabindex(-1)],
          [
            h.h2([], [h.text("Messages")]),
            message.view(message.Info, [], [
              h.text("A new version is available"),
            ]),
            message.view(message.Warning, [], [
              h.text("Your session expires soon"),
            ]),
            message.view(message.Danger, [a.role("alert")], [
              h.text("Check the required fields"),
            ]),
            ..case model.notice {
              True -> [
                message.dismissible(message.Success, Dismiss, [], [
                  h.text("Changes saved"),
                ]),
              ]
              False -> []
            }
          ],
        ),
        h.section(
          [
            a.aria_label("People and tags"),
            a.id("people-region"),
            a.tabindex(-1),
          ],
          [
            h.h2([], [h.text("Avatars and chips")]),
            h.div([a.class("fixture-row")], [
              avatar.group("Project owners", [], [
                avatar.label("Alex Taylor", "AT", []),
                avatar.image("./avatar.svg", "Jamie Morgan", []),
                avatar.label("Sam Rivera", "SR", [
                  a.style("border-radius", "9px"),
                ]),
              ]),
              divider.vertical([]),
              chip.view([], [h.text("Engineering")]),
              ..case model.selected {
                True -> [
                  chip.removable("Design", Remove, [], [h.text("Design")]),
                ]
                False -> []
              }
            ]),
          ],
        ),
        divider.view([]),
      ],
    ),
    h.aside(
      [
        a.id("other-instance"),
        a.class("meridian-ui fixture"),
        a.data("theme", "dark"),
        a.aria_label("Independent theme"),
      ],
      [
        h.h2([], [h.text("Independent dark instance")]),
        chip.view([], [h.text("Separate palette")]),
      ],
    ),
  ])
}
