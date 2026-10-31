import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import meridian_ui/date_picker

pub fn date_and_time_variants_keep_native_attributes_and_shared_styling_test() {
  list.each(
    [
      #("date", date_picker.view),
      #("time", date_picker.time),
      #("datetime-local", date_picker.date_time),
      #("month", date_picker.month),
    ],
    fn(variant) {
      let html =
        variant.1([
          a.name("appointment"),
          a.required(True),
          a.disabled(True),
          a.step("60"),
        ])
        |> element.to_string
      html |> string.contains("meridian-date-input") |> should.be_true
      html |> string.contains("type=\"" <> variant.0 <> "\"") |> should.be_true
      html |> string.contains("name=\"appointment\"") |> should.be_true
      html |> string.contains("required") |> should.be_true
      html |> string.contains("disabled") |> should.be_true
      html |> string.contains("step=\"60\"") |> should.be_true
    },
  )
}

pub fn range_actions_preserve_the_other_endpoint_and_expose_cross_bounds_test() {
  date_picker.update(
    #("2026-11-01", "2026-11-15"),
    date_picker.Start("2026-11-03"),
  )
  |> should.equal(#("2026-11-03", "2026-11-15"))
  date_picker.update(
    #("2026-11-03", "2026-11-15"),
    date_picker.End("2026-11-20"),
  )
  |> should.equal(#("2026-11-03", "2026-11-20"))
  let html =
    date_picker.range(
      "Stay",
      "stay",
      "2026-11-03",
      "2026-11-20",
      True,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("name=\"stay-start\"") |> should.be_true
  html |> string.contains("name=\"stay-end\"") |> should.be_true
  html |> string.contains("max=\"2026-11-20\"") |> should.be_true
  html |> string.contains("min=\"2026-11-03\"") |> should.be_true
}
