import gleam/dynamic/decode
import gleam/list
import gleam/result
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event
import meridian_ui/button
import meridian_ui/orientation
import meridian_ui/toolbar

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
    toolbar.view(
      label <> " formatting",
      orientation.Horizontal,
      [],
      list.map(
        [
          #("strong", "Bold"),
          #("em", "Italic"),
          #("underline", "Underline"),
          #("strike", "Strike through"),
          #("code", "Code"),
          #("paragraph", "Paragraph"),
          #("heading", "Heading"),
          #("bullet", "Bullet list"),
          #("ordered", "Numbered list"),
          #("quote", "Quote"),
          #("undo", "Undo"),
          #("redo", "Redo"),
          #("table", "Insert table"),
          #("row", "Add row"),
          #("column", "Add column"),
          #("delete-table", "Delete table"),
        ],
        fn(command) {
          button.view(
            [
              toolbar.item(),
              a.data("editor-command", command.0),
              a.disabled(readonly),
              case command.0 {
                "strong" | "em" | "underline" | "strike" | "code" ->
                  a.aria_pressed("false")
                _ -> a.none()
              },
            ],
            [h.text(command.1)],
          )
        },
      ),
    ),
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

@external(javascript, "./editor_ffi.mjs", "html")
fn html(value: String) -> String

@external(javascript, "./editor_ffi.mjs", "mount")
pub fn mount(id: String) -> fn() -> Nil
