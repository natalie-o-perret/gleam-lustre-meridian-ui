import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

/// Numbered, selectable Gleam source with lexical highlighting. No HTML is evaluated.
pub fn view(
  label: String,
  source: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  h.pre(
    [
      a.class("meridian-code-block"),
      a.aria_label(label),
      a.tabindex(0),
      a.dir("ltr"),
      ..attrs
    ],
    [
      h.span(
        [
          a.class("meridian-code-gutter"),
          a.aria_hidden(True),
          a.data("line-numbers", line_numbers(source)),
        ],
        [],
      ),
      h.code(
        [a.data("language", "gleam")],
        list.map(tokens(source), fn(token) {
          case token.0 {
            "" -> h.text(token.1)
            kind ->
              h.span([a.class("meridian-code-" <> kind)], [h.text(token.1)])
          }
        }),
      ),
    ],
  )
}

@external(javascript, "./code_block_ffi.mjs", "tokens")
fn tokens(source: String) -> List(#(String, String))

@external(javascript, "./code_block_ffi.mjs", "lineNumbers")
fn line_numbers(source: String) -> String
