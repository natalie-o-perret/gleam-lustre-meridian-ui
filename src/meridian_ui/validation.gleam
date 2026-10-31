import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h

pub type FieldError {
  FieldError(field: String, message: String)
}

/// Read native constraints without showing the browser's validation bubble.
/// Add application-owned cross-field errors to the result. Validate again on the server.
@external(javascript, "./validation_ffi.mjs", "check")
pub fn check(form_id: String) -> Result(List(FieldError), String)

/// Merge these with the control's attributes. Keep other hints in aria-describedby too.
pub fn attributes(
  field: String,
  errors: List(FieldError),
) -> List(Attribute(msg)) {
  case list.any(errors, fn(error) { error.field == field }) {
    True -> [a.aria_invalid("true"), a.aria_describedby(field <> "-error")]
    False -> []
  }
}

pub fn message(field: String, errors: List(FieldError)) -> Element(msg) {
  case list.find(errors, fn(error) { error.field == field }) {
    Ok(error) ->
      h.p(
        [
          a.id(field <> "-error"),
          a.class("meridian-validation-error"),
          a.role("alert"),
        ],
        [h.text(error.message)],
      )
    Error(_) -> element.none()
  }
}
