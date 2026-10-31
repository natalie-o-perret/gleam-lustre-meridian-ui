import gleam/list
import gleam/string
import gleeunit/should
import lustre/attribute as a
import lustre/element
import meridian_ui/icon
import meridian_ui/tooltip

pub fn every_icon_has_a_unique_name_and_decorative_svg_test() {
  icon.all() |> list.length |> should.equal(128)
  icon.all()
  |> list.map(icon.name)
  |> list.unique
  |> list.length
  |> should.equal(128)
  list.each(icon.all(), fn(glyph) {
    let html = icon.view(glyph, [a.class("test-icon")]) |> element.to_string
    html
    |> string.contains(case glyph {
      icon.GitHub -> "viewBox=\"0 0 32 32\""
      _ -> "viewBox=\"0 0 24 24\""
    })
    |> should.be_true
    html |> string.contains("aria-hidden=\"true\"") |> should.be_true
    html |> string.contains("currentColor") |> should.be_true
    html |> string.contains("<path") |> should.be_true
    html |> string.contains("test-icon") |> should.be_true
  })
}

pub fn empty_tooltips_do_not_emit_a_hover_target_test() {
  let empty = icon.view(icon.Home, [tooltip.hint(" \n ")]) |> element.to_string
  empty |> string.contains("data-tooltip") |> should.be_false
  let labelled =
    icon.view(icon.Home, [tooltip.hint("  Home  ")]) |> element.to_string
  labelled |> string.contains("data-tooltip=\"Home\"") |> should.be_true
}
