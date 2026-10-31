import gleam/dynamic/decode
import gleam/list
import gleam/string
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/field
import meridian_ui/icon
import meridian_ui/tooltip

pub type Entry {
  Entry(command: String, output: String)
}

pub type Model {
  Model(draft: String, entries: List(Entry), history: List(String), cursor: Int)
}

pub type Action {
  Edit(String)
  Submit
  Previous
  Next
  Output(String, String)
  Clear
}

/// Commands are text sent to an application handler, never evaluated as code.
pub fn update(model: Model, action: Action) -> Model {
  case action {
    Edit(value) -> Model(..model, draft: value, cursor: -1)
    Submit ->
      case string.trim(model.draft) {
        "" -> model
        command ->
          Model(
            "",
            list.append(model.entries, [Entry(command, "")]),
            [command, ..model.history],
            -1,
          )
      }
    Previous -> recall(model, model.cursor + 1)
    Next ->
      case model.cursor <= 0 {
        True -> Model(..model, draft: "", cursor: -1)
        False -> recall(model, model.cursor - 1)
      }
    Output(command, output) ->
      Model(
        ..model,
        entries: list.append(model.entries, [Entry(command, output)]),
      )
    Clear -> Model(..model, entries: [])
  }
}

fn recall(model: Model, index: Int) -> Model {
  case model.history |> list.drop(index) |> list.first {
    Ok(command) -> Model(..model, draft: command, cursor: index)
    Error(_) -> model
  }
}

pub fn view(
  label: String,
  model: Model,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view_with(label, ">", False, model, on_action, attrs)
}

/// The caller handles submitted commands. Height and wrapping use ordinary CSS.
pub fn view_with(
  label: String,
  prompt: String,
  readonly: Bool,
  model: Model,
  on_action: fn(Action) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.section([a.class("meridian-terminal"), a.aria_label(label), ..attrs], [
    h.header([a.class("meridian-terminal-header")], [
      icon.view(icon.Terminal, []),
      h.span([], [h.text(label)]),
    ]),
    h.div(
      [a.role("log"), a.aria_label(label <> " output"), a.tabindex(0)],
      list.map(model.entries, fn(entry) {
        h.div([], [
          h.p([a.class("meridian-terminal-command")], [
            h.span([a.class("meridian-terminal-prompt"), a.aria_hidden(True)], [
              h.text(prompt),
            ]),
            h.text(entry.command),
          ]),
          case entry.output {
            "" -> element.none()
            _ -> h.pre([], [h.text(entry.output)])
          },
        ])
      }),
    ),
    h.form([event.on_submit(fn(_) { on_action(Submit) })], [
      h.label([], [
        h.span([a.class("meridian-terminal-prompt"), a.aria_hidden(True)], [
          h.text(prompt),
        ]),
        field.input([
          a.aria_label("Command"),
          a.readonly(readonly),
          a.value(model.draft),
          a.autocomplete("off"),
          a.spellcheck(False),
          event.on_input(fn(value) { on_action(Edit(value)) }),
          event.advanced("keydown", {
            use key <- decode.field("key", decode.string)
            use composing <- decode.field("isComposing", decode.bool)
            case key, composing, readonly {
              "ArrowUp", False, False ->
                decode.success(event.handler(on_action(Previous), True, False))
              "ArrowDown", False, False ->
                decode.success(event.handler(on_action(Next), True, False))
              _, _, _ ->
                decode.failure(
                  event.handler(on_action(Next), False, False),
                  "history key",
                )
            }
          }),
        ]),
      ]),
      button.icon(
        [
          a.type_("submit"),
          a.aria_label("Run"),
          a.disabled(readonly),
          tooltip.hint("Run command"),
        ],
        [icon.view(icon.Play, [])],
      ),
    ]),
  ])
}
