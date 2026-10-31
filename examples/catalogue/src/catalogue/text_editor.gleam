import catalogue/common
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/text_editor
import meridian_ui/toggle_switch

pub type Model {
  Model(document: text_editor.Document, readonly: Bool)
}

pub type Msg {
  Document(text_editor.Document)
  Readonly(Bool)
}

pub fn start(_component: String) {
  common.start(
    Model(text_editor.text("Make room for your next idea."), False),
    update,
    text_editor_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Document(value) -> Model(..model, document: value)
    Readonly(value) -> Model(..model, readonly: value)
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
      [],
    ),
    h.details([], [
      h.summary([], [h.text("Document JSON")]),
      h.pre([a.id("document-json")], [
        h.text(text_editor.to_json(model.document)),
      ]),
    ]),
  ])
}
