import gleam/int
import gleam/list
import lustre/attribute as a
import lustre/element
import lustre/element/html as h
import meridian_ui/button
import meridian_ui/icon
import meridian_ui/tooltip

pub fn view(
  label,
  language,
  source,
  lines: List(#(List(#(String, String)), Int, String)),
  attrs,
) {
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
              [a.aria_hidden(True), a.data("number", int.to_string(index + 1))],
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
                  h.span([a.class("meridian-code-" <> kind)], [h.text(token.1)])
              }
            }),
          )
        }),
      ),
    ],
  )
}

@external(javascript, "../code_block_ffi.mjs", "lines")
pub fn lines(
  source: String,
  language: String,
) -> List(#(List(#(String, String)), Int, String))

@external(javascript, "../code_block_ffi.mjs", "lineNumbers")
fn line_numbers(source: String) -> String
