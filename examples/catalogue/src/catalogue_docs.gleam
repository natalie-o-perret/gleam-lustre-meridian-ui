import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/option.{None}
import gleam/result
import lustre
import lustre/attribute as a
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/code_block
import meridian_ui/disclosure
import meridian_ui/icon
import meridian_ui/orientation
import meridian_ui/panel
import meridian_ui/table
import meridian_ui/tabs

type Source {
  Unloaded
  Loading
  Ready(String)
  Failed
}

pub fn theme_markup(preference: String) -> String {
  icon.view(
    case preference {
      "light" -> icon.Sun
      "dark" -> icon.Moon
      _ -> icon.Monitor
    },
    [],
  )
  |> element.to_string
}

pub fn github_markup() -> String {
  icon.view(icon.GitHub, []) |> element.to_string
}

pub fn icon_choice_markup(value: String) -> String {
  let glyph = case value {
    "search" -> icon.view(icon.Search, [])
    "mail" -> icon.view(icon.Mail, [])
    "user" -> icon.view(icon.User, [])
    "check" -> icon.view(icon.Check, [])
    "add" -> icon.view(icon.Plus, [])
    "download" -> icon.view(icon.Download, [])
    "arrow" -> icon.view(icon.ArrowRight, [])
    _ -> element.none()
  }
  h.span([a.class("docs-icon-option")], [glyph, h.text(value)])
  |> element.to_string
}

pub fn code_markup(label: String, source: String) -> String {
  code_block.view(label, source, []) |> element.to_string
}

pub fn snippet_markup(
  label: String,
  language: String,
  source: String,
) -> String {
  code_block.view_language(
    label,
    case language {
      "toml" -> code_block.Toml
      "html" -> code_block.Html
      "json" -> code_block.Json
      _ -> code_block.Gleam
    },
    source,
    [],
  )
  |> element.to_string
}

type File {
  File(id: String, label: String, source: Source)
}

type Model {
  Model(active: String, expanded: Bool, files: List(File))
}

type Msg {
  Select(String)
  Toggle
  Loaded(String, String)
  LoadFailed(String)
}

pub fn start_source(
  id: String,
  snippet: String,
  family: String,
) -> fn() -> Nil {
  let app =
    lustre.application(
      fn(_) {
        #(
          Model("example", True, [
            File("example", "Example", Ready(snippet)),
            File("module", "Full module", Unloaded),
            File("helpers", "Helpers", Unloaded),
          ]),
          effect.none(),
        )
      },
      fn(model, msg) { update(model, msg, family) },
      view,
    )
  let assert Ok(runtime) = lustre.start(app, "#" <> id, Nil)
  fn() { lustre.send(runtime, lustre.shutdown()) }
}

fn update(
  model: Model,
  msg: Msg,
  family: String,
) -> #(Model, effect.Effect(Msg)) {
  case msg {
    Select(id) -> {
      let model = Model(..model, active: id)
      case
        list.any(model.files, fn(file) {
          file.id == id && file.source == Unloaded
        })
      {
        False -> #(model, effect.none())
        True -> #(
          set_source(model, id, Loading),
          effect.from(fn(dispatch) {
            load(
              "./source/"
                <> case id {
                "helpers" -> "common"
                _ -> family
              }
                <> ".gleam",
              fn(source) { dispatch(Loaded(id, source)) },
              fn() { dispatch(LoadFailed(id)) },
            )
          }),
        )
      }
    }
    Toggle -> #(Model(..model, expanded: !model.expanded), effect.none())
    Loaded(id, text) -> #(set_source(model, id, Ready(text)), effect.none())
    LoadFailed(id) -> #(set_source(model, id, Failed), effect.none())
  }
}

fn set_source(model: Model, id: String, source: Source) -> Model {
  Model(
    ..model,
    files: list.map(model.files, fn(file) {
      case file.id == id {
        True -> File(..file, source: source)
        False -> file
      }
    }),
  )
}

fn view(model: Model) -> Element(Msg) {
  panel.collapsible(
    "source-section",
    "Gleam example",
    model.expanded,
    Toggle,
    [a.class("docs-source")],
    [],
    [
      h.p([a.class("docs-source-note muted")], [
        h.text(
          "The example uses the model, messages and shared helpers in the other tabs.",
        ),
      ]),
      tabs.view(
        "source-files",
        "Gleam source files",
        model.active,
        orientation.Horizontal,
        tabs.Automatic,
        [],
        list.map(model.files, fn(file) {
          tabs.Tab(file.id, file.label, False, Select(file.id), [], [
            case file.source {
              Ready(source) ->
                code_block.view(file.label <> " source", source, [
                  a.id(case file.id {
                    "example" -> "example-code"
                    _ -> file.id <> "-code"
                  }),
                ])
              Unloaded | Loading ->
                h.p([a.role("status")], [h.text("Loading source...")])
              Failed ->
                h.p([a.role("alert")], [
                  h.text(
                    "Source could not be loaded. Use the GitHub link above.",
                  ),
                ])
            },
          ])
        }),
      ),
    ],
  )
}

pub fn toggle_markup(id: String, label: String, expanded: Bool) -> String {
  disclosure.toggle(id, label, expanded, [
    a.class("docs-toggle"),
    a.data("meridian-item", "true"),
  ])
  |> element.to_string
}

pub fn panel_markup(id: String, label: String, expanded: Bool) -> String {
  panel.collapsible(id, label, expanded, Nil, [], [], []) |> element.to_string
}

pub fn table_markup(label: String, headers: Dynamic, rows: Dynamic) -> String {
  let assert Ok(headers) = decode.run(headers, decode.list(decode.string))
  let assert Ok(rows) =
    decode.run(rows, decode.list(decode.list(decode.string)))
  table.read_only(
    label,
    [],
    list.index_map(rows, fn(row, index) { #(int.to_string(index), row) }),
    fn(row: #(String, List(String))) { row.0 },
    list.index_map(headers, fn(header, index) {
      table.Column(header, header, None, fn(row: #(String, List(String))) {
        h.text(row.1 |> list.drop(index) |> list.first |> result.unwrap(""))
      })
    }),
  )
  |> element.to_string
}

@external(javascript, "./catalogue_docs_ffi.mjs", "load")
fn load(path: String, loaded: fn(String) -> Nil, failed: fn() -> Nil) -> Nil
