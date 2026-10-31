import catalogue/common
import gleam/list
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/field
import meridian_ui/scheduler

pub type Model {
  Model(events: List(scheduler.Event), selected: String, date: String)
}

pub type Msg {
  Calendar(scheduler.Action)
  Start(String)
  End(String)
}

pub fn start(_component: String) {
  common.start(
    Model(
      [
        scheduler.Event(
          "review",
          "Design review",
          "2026-11-12T10:00:00",
          "2026-11-12T11:00:00",
          False,
          True,
          scheduler.Never,
        ),
        scheduler.Event(
          "planning",
          "Weekly planning",
          "2026-11-02T09:00:00",
          "2026-11-02T10:00:00",
          False,
          False,
          scheduler.Weekly(1, [0]),
        ),
      ],
      "Choose an event or date.",
      "2026-11-12",
    ),
    update,
    scheduler_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Calendar(scheduler.Select(id)) -> Model(..model, selected: id)
    Calendar(scheduler.Pick(date)) -> Model(..model, date: date, selected: date)
    Calendar(scheduler.ChangeEvent(change)) ->
      Model(..model, events: scheduler.change(model.events, change))
    Start(value) ->
      Model(
        ..model,
        events: list.map(model.events, fn(event) {
          case event.id {
            "review" -> scheduler.Event(..event, start: value)
            _ -> event
          }
        }),
      )
    End(value) ->
      Model(
        ..model,
        events: list.map(model.events, fn(event) {
          case event.id {
            "review" -> scheduler.Event(..event, end: value)
            _ -> event
          }
        }),
      )
  }
}

pub fn scheduler_example(model: Model) -> Element(Msg) {
  common.stack([
    scheduler.view(
      "project-calendar",
      "Project calendar",
      scheduler.Config(
        scheduler.Month,
        model.date,
        "Europe/Dublin",
        model.events,
      ),
      Calendar,
      [],
    ),
    h.p([], [
      h.text(
        "Drag the review to another day, or use the native date and time fields.",
      ),
    ]),
    common.row([
      common.field(
        "Review start",
        field.input([
          a.type_("datetime-local"),
          a.default_value("2026-11-12T10:00"),
          e.on_input(Start),
        ]),
      ),
      common.field(
        "Review end",
        field.input([
          a.type_("datetime-local"),
          a.default_value("2026-11-12T11:00"),
          e.on_input(End),
        ]),
      ),
    ]),
    h.p([a.role("status")], [h.text(model.selected)]),
  ])
}
