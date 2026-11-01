import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/disclosure
import meridian_ui/internal/code_source
import meridian_ui/internal/code_tools

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
  let lines = code_source.lines(source, language)
  h.details(
    [
      a.class("meridian-code-viewer"),
      a.open(True),
      a.data("code-source", source),
    ],
    [
      disclosure.summary(label, []),
      code_tools.view(label, list.any(lines, fn(line) { line.2 != "" })),
      code_source.view(label, language, source, lines, attrs),
    ],
  )
}
