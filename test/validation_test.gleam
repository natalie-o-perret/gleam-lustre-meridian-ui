import gleam/string
import gleeunit/should
import lustre/element
import lustre/element/html as h
import meridian_ui/validation

pub fn validation_links_only_matching_fields_and_escapes_error_text_test() {
  let errors = [validation.FieldError("email", "Use an <email>.")]
  let html =
    h.div(validation.attributes("email", errors), [
      validation.message("email", errors),
    ])
    |> element.to_string
  html |> string.contains("aria-invalid=\"true\"") |> should.be_true
  html |> string.contains("aria-describedby=\"email-error\"") |> should.be_true
  html |> string.contains("id=\"email-error\"") |> should.be_true
  html |> string.contains("Use an &lt;email&gt;.") |> should.be_true
  validation.attributes("other", errors) |> should.equal([])
  validation.message("other", errors) |> element.to_string |> should.equal("")
}
