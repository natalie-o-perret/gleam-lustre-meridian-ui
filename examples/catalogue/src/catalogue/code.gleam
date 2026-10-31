import catalogue/common
import lustre/element.{type Element}
import meridian_ui/code_block

pub fn start(_component: String) {
  common.start(Nil, fn(model, _) { model }, code_block_example)
}

pub fn code_block_example(_model: Nil) -> Element(Nil) {
  code_block.view(
    "Gleam greeting",
    "import gleam/io\n\n// A small, typed greeting\npub fn main() {\n  let name = \"Meridian\"\n  io.println(\"Hello, \" <> name)\n}\n",
    [],
  )
}
