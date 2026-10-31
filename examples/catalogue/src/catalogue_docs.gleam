import gleam/list
import lustre
import lustre/attribute as a
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/code_block
import meridian_ui/disclosure
import meridian_ui/orientation
import meridian_ui/panel
import meridian_ui/tabs

type Source {
  Loading
  Ready(String)
  Failed
}

type File {
  File(id: String, label: String, source: Source)
}

type Model {
  Model(active: String, expanded: Bool, status: String, files: List(File))
}

type Msg {
  Select(String)
  Toggle
  Copy
  Copied(String)
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
          Model("example", True, "", [
            File("example", "Example", Ready(snippet)),
            File("module", "Full module", Loading),
            File("helpers", "Helpers", Loading),
          ]),
          effect.from(fn(dispatch) {
            load(
              "./source/" <> family <> ".gleam",
              fn(source) { dispatch(Loaded("module", source)) },
              fn() { dispatch(LoadFailed("module")) },
            )
            load(
              "./source/common.gleam",
              fn(source) { dispatch(Loaded("helpers", source)) },
              fn() { dispatch(LoadFailed("helpers")) },
            )
          }),
        )
      },
      update,
      view,
    )
  let assert Ok(runtime) = lustre.start(app, "#" <> id, Nil)
  fn() { lustre.send(runtime, lustre.shutdown()) }
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    Select(id) -> #(Model(..model, active: id, status: ""), effect.none())
    Toggle -> #(Model(..model, expanded: !model.expanded), effect.none())
    Copied(status) -> #(Model(..model, status: status), effect.none())
    Loaded(id, text) -> #(set_source(model, id, Ready(text)), effect.none())
    LoadFailed(id) -> #(set_source(model, id, Failed), effect.none())
    Copy ->
      case active_source(model) {
        Ready(source) -> #(
          model,
          effect.from(fn(dispatch) {
            copy(source, fn(status) { dispatch(Copied(status)) })
          }),
        )
        _ -> #(model, effect.none())
      }
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

fn active_source(model: Model) -> Source {
  case list.find(model.files, fn(file) { file.id == model.active }) {
    Ok(file) -> file.source
    Error(_) -> Failed
  }
}

fn view(model: Model) -> Element(Msg) {
  panel.collapsible(
    "source-section",
    "Gleam example",
    model.expanded,
    Toggle,
    [a.class("docs-source")],
    [
      button.view(
        [
          a.id("copy-source"),
          e.on_click(Copy),
          a.disabled(case active_source(model) {
            Ready(_) -> False
            _ -> True
          }),
        ],
        [h.text("Copy code")],
      ),
    ],
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
              Loading -> h.p([a.role("status")], [h.text("Loading source...")])
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
      h.p([a.id("copy-status"), a.role("status"), a.class("docs-copy-status")], [
        h.text(model.status),
      ]),
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

@external(javascript, "./catalogue_docs_ffi.mjs", "load")
fn load(path: String, loaded: fn(String) -> Nil, failed: fn() -> Nil) -> Nil

@external(javascript, "./catalogue_docs_ffi.mjs", "copy")
fn copy(source: String, done: fn(String) -> Nil) -> Nil
