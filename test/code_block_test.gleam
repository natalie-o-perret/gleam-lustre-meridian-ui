import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import meridian_ui/code_block

pub fn code_is_labelled_keyboard_scrollable_and_ltr_test() {
  let html =
    code_block.view("Example source", "pub fn main() { Nil }", [a.id("source")])
    |> element.to_string
  html |> string.contains("meridian-code-block") |> should.be_true
  html |> string.contains("aria-label=\"Example source\"") |> should.be_true
  html |> string.contains("tabindex=\"0\"") |> should.be_true
  html |> string.contains("dir=\"ltr\"") |> should.be_true
  html |> string.contains("id=\"source\"") |> should.be_true
  html |> string.contains("meridian-code-keyword") |> should.be_true
  html |> string.contains("meridian-code-function") |> should.be_true
  html |> string.contains("meridian-code-type") |> should.be_true
  html |> string.contains("meridian-code-gutter") |> should.be_true
  html |> string.contains("aria-hidden=\"true\"") |> should.be_true
  html |> string.contains("data-line-numbers=\"1\"") |> should.be_true
  html |> string.contains("<details") |> should.be_true
  html |> string.contains("open") |> should.be_true
  html |> string.contains("<summary") |> should.be_true
  html |> string.contains("data-code-copy-label") |> should.be_true
  html |> string.contains(">Copy</span>") |> should.be_true
  html |> string.contains("role=\"status\"") |> should.be_true
}

pub fn source_is_text_not_markup_test() {
  let html =
    code_block.view(
      "Untrusted text",
      "let html = \"<script>alert(1)</script>\" // <img src=x>",
      [],
    )
    |> element.to_string
  html |> string.contains("<script>") |> should.be_false
  html |> string.contains("<img") |> should.be_false
  html |> string.contains("&lt;script&gt;") |> should.be_true
  html |> string.contains("meridian-code-string") |> should.be_true
  html |> string.contains("meridian-code-comment") |> should.be_true
}

pub fn other_source_languages_keep_numbering_and_escape_html_test() {
  let html =
    code_block.view_language(
      "HTML example",
      code_block.Html,
      "<img src=\"x\">",
      [],
    )
    |> element.to_string
  html |> string.contains("data-language=\"html\"") |> should.be_true
  html |> string.contains("data-line-numbers=\"1\"") |> should.be_true
  html |> string.contains("meridian-code-keyword") |> should.be_true
  html |> string.contains("&lt;img") |> should.be_true
  html |> string.contains("<img") |> should.be_false
  html |> string.contains("data-code-action=\"collapse\"") |> should.be_false
}
