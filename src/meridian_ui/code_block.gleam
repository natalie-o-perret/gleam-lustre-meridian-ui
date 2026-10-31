import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/disclosure
import meridian_ui/icon
import meridian_ui/tooltip

pub type Language {
  Gleam
  Json
  Toml
  Html
}

/// Numbered, selectable Gleam source with lexical highlighting. No HTML is evaluated.
pub fn view(
  label: String,
  source: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  view_language(label, Gleam, source, attrs)
}

/// Highlight source without evaluating markup. Gleam also supports declaration folding.
pub fn view_language(
  label: String,
  language: Language,
  source: String,
  attrs: List(Attribute(msg)),
) -> Element(msg) {
  let language = case language {
    Gleam -> "gleam"
    Json -> "json"
    Toml -> "toml"
    Html -> "html"
  }
  let lines = lines(source, language)
  let foldable = list.any(lines, fn(line) { line.2 != "" })
  h.details(
    [
      a.class("meridian-code-viewer"),
      a.open(True),
      a.data("code-source", source),
    ],
    [
      disclosure.summary(label, []),
      h.div(
        [
          a.class("meridian-code-tools"),
          a.role("group"),
          a.aria_label(label <> " actions"),
        ],
        [
          code_action("copy", "Copy code", icon.Copy),
          case foldable {
            True ->
              code_action("collapse", "Collapse all code blocks", icon.Minimize)
            False -> element.none()
          },
          case foldable {
            True ->
              code_action("expand", "Expand all code blocks", icon.Maximize)
            False -> element.none()
          },
          h.span([a.class("meridian-code-status"), a.role("status")], []),
        ],
      ),
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
              a.data("line-numbers", line_numbers(source)),
            ],
            list.index_map(lines, fn(line, index) {
              h.span([a.data("code-number", int.to_string(index))], [
                h.span(
                  [
                    a.aria_hidden(True),
                    a.data("number", int.to_string(index + 1)),
                  ],
                  [],
                ),
                case line.2 {
                  "" -> element.none()
                  name ->
                    button.icon(
                      [
                        a.data("code-fold", int.to_string(index)),
                        a.data("code-end", int.to_string(line.1)),
                        a.data("code-label", name),
                        a.aria_label("Collapse " <> name),
                        a.aria_expanded(True),
                        tooltip.hint("Collapse " <> name),
                      ],
                      [icon.view(icon.ChevronDown, [])],
                    )
                },
              ])
            }),
          ),
          h.code(
            [a.data("language", language)],
            list.index_map(lines, fn(line, index) {
              h.span(
                [a.data("code-line", int.to_string(index))],
                list.map(line.0, fn(token) {
                  case token.0 {
                    "" -> h.text(token.1)
                    kind ->
                      h.span([a.class("meridian-code-" <> kind)], [
                        h.text(token.1),
                      ])
                  }
                }),
              )
            }),
          ),
        ],
      ),
    ],
  )
}

fn code_action(
  action: String,
  label: String,
  glyph: icon.Icon,
) -> Element(msg) {
  button.icon(
    [a.data("code-action", action), a.aria_label(label), tooltip.hint(label)],
    [icon.view(glyph, [])],
  )
}

@external(javascript, "./code_block_ffi.mjs", "lines")
fn lines(
  source: String,
  language: String,
) -> List(#(List(#(String, String)), Int, String))

@external(javascript, "./code_block_ffi.mjs", "lineNumbers")
fn line_numbers(source: String) -> String
