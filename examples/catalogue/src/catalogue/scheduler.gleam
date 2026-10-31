import catalogue/common
import gleam/dict
import gleam/list
import gleam/string
import lustre/attribute as a
import lustre/element.{type Element}
import lustre/element/html as h
import lustre/event as e
import meridian_ui/date_picker
import meridian_ui/scheduler

pub type Model {
  Model(
    events: List(scheduler.Event),
    selected: String,
    date: String,
    props: common.Properties,
  )
}

pub type Msg {
  Calendar(scheduler.Action)
  Start(String)
  End(String)
  Properties(common.Properties)
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
        scheduler.Event(
          "standup",
          "Team check-in",
          "2026-11-12T11:30:00",
          "2026-11-12T12:00:00",
          False,
          False,
          scheduler.Never,
        ),
        scheduler.Event(
          "handover",
          "Support handover",
          "2026-11-12T14:00:00",
          "2026-11-12T14:30:00",
          False,
          False,
          scheduler.Never,
        ),
      ],
      "Choose an event or date.",
      "2026-11-12",
      dict.new(),
    ),
    update,
    Properties,
    scheduler_example,
  )
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Properties(props) ->
      Model(
        ..model,
        props: dict.merge(model.props, props),
        date: common.property(props, "date", model.date),
      )
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
  let assert Ok(review) =
    list.find(model.events, fn(event) { event.id == "review" })
  let options =
    scheduler.Options(
      common.number(model.props, "firstDay", 1),
      common.flag(model.props, "weekends", True),
      common.flag(model.props, "weekNumbers", False),
      common.flag(model.props, "now", True),
      common.property(model.props, "slot", "00:30:00"),
      common.property(model.props, "dayStart", "00:00:00"),
      common.property(model.props, "dayEnd", "24:00:00"),
      common.number(model.props, "limit", 3),
      common.flag(model.props, "readonly", False),
    )
  common.stack([
    scheduler.view_with(
      "project-calendar",
      "Project calendar",
      scheduler.Config(
        case common.property(model.props, "view", "month") {
          "week" -> scheduler.Week
          "day" -> scheduler.Day
          "agenda" -> scheduler.Agenda
          _ -> scheduler.Month
        },
        model.date,
        common.property(model.props, "zone", "Europe/Dublin"),
        common.items(
          model.props,
          list.map(model.events, fn(event) {
            case event.id {
              "review" -> {
                let all_day = common.flag(model.props, "allDay", event.all_day)
                scheduler.Event(
                  ..event,
                  title: common.property(model.props, "title", event.title),
                  all_day: all_day,
                  start: case all_day {
                    True -> string.slice(event.start, 0, 10)
                    False -> event.start
                  },
                  end: case all_day {
                    True -> ""
                    False -> event.end
                  },
                  editable: !options.readonly
                    && common.flag(model.props, "editable", event.editable),
                )
              }
              "planning" ->
                scheduler.Event(
                  ..event,
                  recurrence: case common.flag(model.props, "recurring", True) {
                    True ->
                      scheduler.Weekly(
                        common.number(model.props, "interval", 1),
                        [0],
                      )
                    False -> scheduler.Never
                  },
                )
              _ -> event
            }
          }),
        ),
      ),
      options,
      Calendar,
      [],
    ),
    h.p([], [
      h.text(
        "Drag the review to another day, or use the shared date and time pickers.",
      ),
    ]),
    common.row([
      common.field(
        "Review start",
        date_picker.date_time([
          a.disabled(options.readonly),
          a.value(string.slice(review.start, 0, 19)),
          e.on_input(Start),
        ]),
      ),
      common.field(
        "Review end",
        date_picker.date_time([
          a.disabled(options.readonly),
          a.value(string.slice(review.end, 0, 19)),
          e.on_input(End),
        ]),
      ),
    ]),
    h.p([a.role("status")], [h.text(model.selected)]),
  ])
}
