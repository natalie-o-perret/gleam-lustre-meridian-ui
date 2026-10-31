import gleam/dynamic/decode
import gleam/list
import gleam/result
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/field
import meridian_ui/icon
import meridian_ui/orientation
import meridian_ui/toolbar
import meridian_ui/tooltip

pub opaque type Document {
  Document(String)
}

pub fn text(value: String) -> Document {
  Document(from_text(value))
}

pub fn parse(value: String) -> Result(Document, String) {
  parse_json(value) |> result.map(Document)
}

pub fn to_json(document: Document) -> String {
  let Document(value) = document
  value
}

pub fn to_html(document: Document) -> String {
  let Document(value) = document
  html(value)
}

pub fn parse_markdown(value: String) -> Result(Document, String) {
  parse_markdown_json(value) |> result.map(Document)
}

/// CommonMark export rejects formatting it cannot preserve. Keep JSON for rich documents.
pub fn to_markdown(document: Document) -> Result(String, String) {
  let Document(value) = document
  markdown(value)
}

/// The editor owns selection, composition and history. The caller stores canonical
/// JSON documents. Imported JSON and pasted HTML are checked against its schema.
pub fn view(
  id: String,
  label: String,
  document: Document,
  readonly: Bool,
  on_change: fn(Document) -> msg,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.div([a.class("meridian-editor"), ..attrs], [
    toolbar.view(label <> " formatting", orientation.Horizontal, [], [
      field.input([
        a.type_("color"),
        a.class("meridian-colour"),
        a.aria_label("Text colour"),
        a.data("editor-colour", "true"),
        a.default_value("#b41472"),
        a.disabled(readonly),
      ]),
      button.icon(
        [
          toolbar.item(),
          a.data("editor-command", "clear-colour"),
          a.aria_label("Default text colour"),
          tooltip.hint("Default text colour"),
          a.disabled(readonly),
        ],
        [icon.view(icon.Palette, [])],
      ),
      ..list.map(
        [
          #("strong", "Bold", icon.Bold),
          #("em", "Italic", icon.Italic),
          #("underline", "Underline", icon.Underline),
          #("strike", "Strike through", icon.Strikethrough),
          #("code", "Code", icon.Code),
          #("paragraph", "Paragraph", icon.Paragraph),
          #("heading", "Heading", icon.Heading),
          #("bullet", "Bullet list", icon.BulletList),
          #("ordered", "Numbered list", icon.NumberedList),
          #("quote", "Quote", icon.Quote),
          #("undo", "Undo", icon.Undo),
          #("redo", "Redo", icon.Redo),
          #("table", "Insert table", icon.TableInsert),
          #("row", "Add row", icon.RowAdd),
          #("column", "Add column", icon.ColumnAdd),
          #("delete-table", "Delete table", icon.TableDelete),
        ],
        fn(command) {
          button.icon(
            [
              toolbar.item(),
              a.data("editor-command", command.0),
              a.aria_label(command.1),
              tooltip.hint(command.1),
              a.disabled(readonly),
              case command.0 {
                "strong" | "em" | "underline" | "strike" | "code" ->
                  a.aria_pressed("false")
                _ -> a.none()
              },
            ],
            [icon.view(command.2, [])],
          )
        },
      )
    ]),
    h.div(
      [
        a.id(id),
        a.class("meridian-editor-document"),
        a.data("editor", to_json(document)),
        a.data("readonly", case readonly {
          True -> "true"
          False -> "false"
        }),
        a.data("editor-label", label),
        event.on(
          "meridian-document",
          decode.at(["detail", "json"], decode.string)
            |> decode.map(fn(value) { on_change(Document(value)) }),
        )
          |> event.stop_propagation,
      ],
      [],
    ),
  ])
}

@external(javascript, "./editor_ffi.mjs", "fromText")
fn from_text(value: String) -> String

@external(javascript, "./editor_ffi.mjs", "parse")
fn parse_json(value: String) -> Result(String, String)

@external(javascript, "./editor_ffi.mjs", "parseMarkdown")
fn parse_markdown_json(value: String) -> Result(String, String)

@external(javascript, "./editor_ffi.mjs", "markdown")
fn markdown(value: String) -> Result(String, String)

@external(javascript, "./editor_ffi.mjs", "html")
fn html(value: String) -> String

@external(javascript, "./editor_ffi.mjs", "mount")
pub fn mount(id: String) -> fn() -> Nil
