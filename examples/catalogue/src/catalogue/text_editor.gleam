import catalogue/common
import gleam/dict
import gleam/result
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/code_block
import meridian_ui/disclosure
import meridian_ui/field
import meridian_ui/text_editor
import meridian_ui/toggle_switch

pub type Model {
  Model(
    document: text_editor.Document,
    readonly: Bool,
    props: common.Properties,
    markdown: String,
    status: String,
  )
}

pub type Msg {
  Document(text_editor.Document)
  Readonly(Bool)
  Properties(common.Properties)
  Markdown(String)
  ImportMarkdown
  ExportMarkdown
}

pub fn start(_component: String) {
  common.start(
    Model(
      text_editor.text("Make room for your next idea."),
      False,
      dict.new(),
      "# Next idea\n\nWrite **bold** notes, a [link](https://example.com), or a list:\n\n- Review the design\n- Write a focused test\n",
      "",
    ),
    update,
    Properties,
    text_editor_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        readonly: common.flag(props, "readonly", model.readonly),
        document: case
          dict.has_key(props, "text") || dict.has_key(props, "sample")
        {
          True -> {
            let props = dict.merge(model.props, props)
            let text = text_editor.text(common.property(props, "text", ""))
            case common.property(props, "sample", "text") {
              "plan" ->
                text_editor.parse(
                  "{\"type\":\"doc\",\"content\":[{\"type\":\"heading\",\"attrs\":{\"level\":2},\"content\":[{\"type\":\"text\",\"text\":\"Project plan\"}]},{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Build something useful.\",\"marks\":[{\"type\":\"strong\"}]}]}]}",
                )
                |> result.unwrap(text)
              "list" ->
                text_editor.parse(
                  "{\"type\":\"doc\",\"content\":[{\"type\":\"bullet_list\",\"content\":[{\"type\":\"list_item\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Review the design\"}]}]},{\"type\":\"list_item\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Write a focused test\"}]}]}]}]}",
                )
                |> result.unwrap(text)
              "markdown" ->
                text_editor.parse_markdown(model.markdown)
                |> result.unwrap(text)
              _ -> text
            }
          }
          False -> model.document
        },
      )
    Document(value) -> Model(..model, document: value)
    Readonly(value) -> Model(..model, readonly: value)
    Markdown(value) -> Model(..model, markdown: value, status: "")
    ImportMarkdown ->
      case text_editor.parse_markdown(model.markdown) {
        Ok(document) ->
          Model(..model, document: document, status: "Markdown imported.")
        Error(error) -> Model(..model, status: error)
      }
    ExportMarkdown ->
      case text_editor.to_markdown(model.document) {
        Ok(markdown) ->
          Model(..model, markdown: markdown, status: "Markdown exported.")
        Error(error) -> Model(..model, status: error)
      }
  }
}

pub fn text_editor_example(model: Model) -> Element(Msg) {
  common.stack([
    toggle_switch.view("Read-only editor", [
      a.checked(model.readonly),
      e.on_check(Readonly),
    ]),
    text_editor.view(
      "project-notes",
      "Project notes",
      model.document,
      model.readonly,
      Document,
      [
        a.style(
          "max-inline-size",
          common.property(model.props, "width", "960") <> "px",
        ),
      ],
    ),
    code_block.view_language(
      "Document JSON",
      code_block.Json,
      pretty_json(text_editor.to_json(model.document)),
      [a.id("document-json")],
    ),
    h.details([], [
      disclosure.summary("Markdown", []),
      common.stack([
        h.p([], [
          h.text(
            "Import or export CommonMark. JSON preserves text colours, underline, strike through and tables that Markdown cannot represent.",
          ),
        ]),
        common.field(
          "Markdown source",
          field.textarea(
            [
              a.rows(8),
              e.on_input(Markdown),
            ],
            model.markdown,
          ),
        ),
        common.row([
          button.view([e.on_click(ImportMarkdown), a.disabled(model.readonly)], [
            h.text("Import Markdown"),
          ]),
          button.view([e.on_click(ExportMarkdown)], [h.text("Export Markdown")]),
        ]),
        h.p([a.role("status")], [h.text(model.status)]),
      ]),
    ]),
  ])
}

@external(javascript, "../catalogue_docs_ffi.mjs", "prettyJson")
fn pretty_json(value: String) -> String
