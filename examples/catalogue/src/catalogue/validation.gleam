import catalogue/common
import gleam/dict
import gleam/list
import lustre/attribute as a
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/button
import meridian_ui/field
import meridian_ui/validation

pub type Model {
  Model(
    email: String,
    password: String,
    confirmation: String,
    errors: List(validation.FieldError),
    status: String,
    props: common.Properties,
  )
}

pub type Msg {
  Email(String)
  Password(String)
  Confirmation(String)
  Submit
  Checked(Result(List(validation.FieldError), String))
  Properties(common.Properties)
}

pub fn start(_component: String) {
  common.start_with_effect(
    Model("", "", "", [], "", dict.new()),
    update,
    Properties,
    form_validation_example,
  )
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    Submit -> #(
      model,
      effect.from(fn(dispatch) {
        dispatch(Checked(validation.check("validation-form")))
      }),
    )
    _ -> #(
      case msg {
        Email(value) ->
          Model(
            ..model,
            email: value,
            errors: list.filter(model.errors, fn(error) {
              error.field != "validation-email"
            }),
            status: "",
          )
        Password(value) ->
          Model(
            ..model,
            password: value,
            errors: list.filter(model.errors, fn(error) {
              error.field == "validation-email"
            }),
            status: "",
          )
        Confirmation(value) ->
          Model(
            ..model,
            confirmation: value,
            errors: list.filter(model.errors, fn(error) {
              error.field != "validation-confirmation"
            }),
            status: "",
          )
        Checked(Ok(errors)) -> {
          let errors = case
            model.confirmation != "" && model.password != model.confirmation
          {
            True ->
              list.append(errors, [
                validation.FieldError(
                  "validation-confirmation",
                  "The passwords must match.",
                ),
              ])
            False -> errors
          }
          Model(..model, errors: errors, status: case errors {
            [] -> "This example is valid. Nothing was sent."
            _ -> "Fix the highlighted fields."
          })
        }
        Checked(Error(error)) -> Model(..model, status: error)
        Properties(props) ->
          Model(
            ..model,
            props: dict.merge(model.props, props),
            email: common.property(props, "email", model.email),
            errors: [],
            status: "",
          )
        Submit -> model
      },
      effect.none(),
    )
  }
}

pub fn form_validation_example(model: Model) -> Element(Msg) {
  let disabled = common.flag(model.props, "disabled", False)
  h.form(
    [
      a.id("validation-form"),
      a.class("meridian-form"),
      a.novalidate(True),
      e.on_submit(fn(_) { Submit }),
    ],
    [
      h.p([], [
        h.text(
          "Native required, email and length constraints, plus a caller-owned password match rule. This example never sends or stores your values. Use dummy passwords.",
        ),
      ]),
      h.div([], [
        field.floating(
          "validation-email",
          "Email",
          [],
          field.input([
            a.id("validation-email"),
            a.type_("email"),
            a.name("email"),
            a.autocomplete("off"),
            a.placeholder(" "),
            a.value(model.email),
            a.required(common.flag(model.props, "required", True)),
            a.disabled(disabled),
            e.on_input(Email),
            ..validation.attributes("validation-email", model.errors)
          ]),
        ),
        validation.message("validation-email", model.errors),
      ]),
      h.div([], [
        field.floating(
          "validation-password",
          "Password",
          [],
          field.input([
            a.id("validation-password"),
            a.type_("password"),
            a.name("password"),
            a.autocomplete("new-password"),
            a.placeholder(" "),
            a.value(model.password),
            a.required(True),
            a.minlength(common.number(model.props, "minimum", 10)),
            a.disabled(disabled),
            e.on_input(Password),
            ..validation.attributes("validation-password", model.errors)
          ]),
        ),
        validation.message("validation-password", model.errors),
      ]),
      h.div([], [
        field.floating(
          "validation-confirmation",
          "Confirm password",
          [],
          field.input([
            a.id("validation-confirmation"),
            a.type_("password"),
            a.name("confirmation"),
            a.autocomplete("new-password"),
            a.placeholder(" "),
            a.value(model.confirmation),
            a.required(True),
            a.disabled(disabled),
            e.on_input(Confirmation),
            ..validation.attributes("validation-confirmation", model.errors)
          ]),
        ),
        validation.message("validation-confirmation", model.errors),
      ]),
      button.primary([a.type_("submit"), a.disabled(disabled)], [
        h.text("Validate form"),
      ]),
      h.p([a.role("status")], [h.text(model.status)]),
    ],
  )
}
