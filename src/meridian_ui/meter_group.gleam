import gleam/int
import gleam/list
import lustre/attribute.{type Attribute} as a
import lustre/element.{type Element}
import lustre/element/html as h
import meridian_ui/badge

pub type Meter {
  Meter(label: String, value: Int, tone: badge.Tone)
}

pub fn view(
  label: String,
  maximum: Int,
  attrs: List(Attribute(msg)),
  meters: List(Meter),
) -> Element(msg) {
  let maximum = int.max(maximum, 1)
  let total =
    list.fold(meters, 0, fn(total, meter) { total + int.max(meter.value, 0) })
  let #(remaining, segments) =
    list.map_fold(meters, maximum, fn(remaining, meter) {
      let value = int.clamp(meter.value, 0, remaining)
      #(
        remaining - value,
        h.span(
          [
            a.class("meridian-meter-segment"),
            a.hidden(value == 0),
            a.data("tone", tone(meter.tone)),
            a.style("flex-grow", int.to_string(value)),
          ],
          [],
        ),
      )
    })
  h.div(
    [
      a.class("meridian-meter-group"),
      a.role("group"),
      a.aria_label(label),
      ..attrs
    ],
    [
      h.div(
        [a.class("meridian-meter-track"), a.aria_hidden(True)],
        list.append(segments, [
          h.span([a.style("flex-grow", int.to_string(remaining))], []),
        ]),
      ),
      h.p([], [
        h.text(
          "Total: " <> int.to_string(total) <> " of " <> int.to_string(maximum),
        ),
      ]),
      h.ul(
        [],
        list.map(meters, fn(meter) {
          h.li([], [
            badge.view(meter.tone, [], [
              h.text(
                meter.label <> ": " <> int.to_string(int.max(meter.value, 0)),
              ),
            ]),
            h.meter(
              [
                a.class("sr-only"),
                a.aria_label(meter.label),
                a.min("0"),
                a.max(int.to_string(maximum)),
                a.value(int.to_string(int.clamp(meter.value, 0, maximum))),
              ],
              [],
            ),
          ])
        }),
      ),
    ],
  )
}

fn tone(tone: badge.Tone) -> String {
  case tone {
    badge.Success -> "success"
    badge.Warning -> "warning"
    badge.Danger -> "danger"
    badge.Accent -> "accent"
  }
}
