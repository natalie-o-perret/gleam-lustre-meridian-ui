import catalogue/common
import gleam/dict
import lustre/element.{type Element}
import meridian_ui/code_block

pub fn start(_component: String) {
  common.start(
    dict.new(),
    fn(current, props) { dict.merge(current, props) },
    fn(props) { props },
    code_block_example,
  )
}

pub fn code_block_example(
  props: common.Properties,
) -> Element(common.Properties) {
  code_block.view_language(
    common.property(props, "label", "Gleam greeting"),
    case common.property(props, "language", "gleam") {
      "json" -> code_block.Json
      "toml" -> code_block.Toml
      "html" -> code_block.Html
      _ -> code_block.Gleam
    },
    common.property(
      props,
      "source",
      "import gleam/io\n\n// A small, typed greeting\npub fn main() {\n  let name = \"Meridian\"\n  io.println(\"Hello, \" <> name)\n}\n",
    ),
    [],
  )
}
