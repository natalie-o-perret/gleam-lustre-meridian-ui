import gleam/list
import gleam/option.{Some}
import gleam/string
import gleeunit/should
import lustre/element
import lustre/element/html as h
import meridian_ui/carousel
import meridian_ui/charts
import meridian_ui/command_menu
import meridian_ui/filter_service
import meridian_ui/hierarchy.{Node}
import meridian_ui/menu
import meridian_ui/order_list
import meridian_ui/paginator
import meridian_ui/pick_list
import meridian_ui/scheduler
import meridian_ui/selection
import meridian_ui/slider
import meridian_ui/table
import meridian_ui/task_board
import meridian_ui/terminal
import meridian_ui/text_editor
import meridian_ui/tree
import meridian_ui/virtual_scroller

pub fn paging_clamps_shrinking_sets_and_zero_sizes_without_losing_last_page_test() {
  paginator.pages(11, 5) |> should.equal(3)
  paginator.pages(0, 0) |> should.equal(1)
  paginator.clamp(9, 3, 2) |> should.equal(1)
  paginator.slice([1, 2, 3], 9, 2) |> should.equal([3])
}

pub fn filtering_preserves_unicode_and_combines_predicates_test() {
  filter_service.text("Éire 中文", "eire", filter_service.Contains)
  |> should.be_true
  filter_service.text("Éire 中文", "中文", filter_service.EndsWith)
  |> should.be_true
  filter_service.filter([1, 2, 3], filter_service.All, [
    fn(value) { value > 1 },
    fn(value) { value < 3 },
  ])
  |> should.equal([2])
  filter_service.filter([1, 2, 3], filter_service.Any, [])
  |> should.equal([1, 2, 3])
}

pub fn order_and_transfer_preserve_item_data_and_disabled_state_test() {
  let one = order_list.Item("one", "One", False, [h.text("Retain content")])
  let two = order_list.Item("two", "Two", False, [])
  let locked = order_list.Item("locked", "Locked", True, [])
  order_list.move([one, two, locked], "one", 99)
  |> should.equal([two, locked, one])
  order_list.move([one, two, locked], "locked", 0)
  |> should.equal([one, two, locked])
  pick_list.transfer([one, locked], [two], "one")
  |> should.equal(#([locked], [two, one]))
  pick_list.transfer([one], [one], "one") |> should.equal(#([one], [one]))
}

pub fn virtual_windows_cover_visible_rows_and_keep_spacer_height_exact_test() {
  virtual_scroller.window(100, 20, virtual_scroller.Viewport(200, 100), 2)
  |> should.equal(virtual_scroller.Window(8, 17, 160, 1660))
  virtual_scroller.window(0, 0, virtual_scroller.Viewport(-10, 0), -1)
  |> should.equal(virtual_scroller.Window(0, 0, 0, 0))
  virtual_scroller.window(3, 20, virtual_scroller.Viewport(999, 20), 0)
  |> should.equal(virtual_scroller.Window(2, 3, 40, 0))
}

pub fn tree_and_menu_actions_apply_to_the_latest_state_test() {
  tree.Model([], [])
  |> tree.update(tree.Expand("team"), selection.Multiple)
  |> tree.update(tree.Select("one"), selection.Multiple)
  |> tree.update(tree.Select("two"), selection.Multiple)
  |> should.equal(tree.Model(["team"], ["one", "two"]))
  menu.update(["one"], menu.Toggle("two")) |> should.equal(["one", "two"])
  menu.update(["one"], menu.Invoke(Nil)) |> should.equal([])
  let html =
    tree.view(
      "Projects",
      selection.Single,
      tree.Model([], []),
      fn(_) { Nil },
      [],
      [Node("one", "One", False, [])],
    )
    |> element.to_string
  html |> string.contains("role=\"treeitem\"") |> should.be_true
}

pub fn tables_sort_filter_and_page_without_editing_source_data_test() {
  let column = table.Column("name", "Name", Some(string.compare), h.text)
  let model =
    table.Model("a", Some(table.Sort("name", table.Descending)), [], 0, 10)
  table.rows(["Blair", "Alex", "Cat"], model, fn(value) { value }, [column])
  |> should.equal(["Cat", "Blair", "Alex"])
  table.update(model, table.Search("other")).page |> should.equal(0)
  table.update(model, table.Select("one")).selected |> should.equal(["one"])
}

pub fn task_board_moves_preserve_cards_and_reject_invalid_or_disabled_changes_test() {
  let card = task_board.Card("one", "One", "Keep metadata", False)
  let columns = [
    task_board.Column("todo", "Todo", [card]),
    task_board.Column("done", "Done", []),
  ]
  task_board.update(columns, task_board.Move("one", "todo", "done", 99))
  |> should.equal(
    Ok([
      task_board.Column("todo", "Todo", []),
      task_board.Column("done", "Done", [card]),
    ]),
  )
  task_board.update(columns, task_board.Move("missing", "todo", "done", 0))
  |> should.be_error
  task_board.update(columns, task_board.Add("todo", card)) |> should.be_error
  task_board.update(columns, task_board.Rename("one", "  "))
  |> should.be_error
}

pub fn terminal_history_and_async_output_remain_plain_text_test() {
  let model =
    terminal.Model("whoami", [], [], -1)
    |> terminal.update(terminal.Submit)
    |> terminal.update(terminal.Previous)
  model.draft |> should.equal("whoami")
  terminal.update(model, terminal.Next).draft |> should.equal("")
  terminal.update(model, terminal.Output("whoami", "<script>not code</script>"))
  |> terminal.view("Terminal", _, fn(_) { Nil }, [])
  |> element.to_string
  |> string.contains("&lt;script&gt;not code&lt;/script&gt;")
  |> should.be_true
}

pub fn dual_ranges_never_cross_and_carousels_wrap_at_both_edges_test() {
  slider.update(slider.Bounds(20, 80), slider.Lower(99), 0, 100)
  |> should.equal(slider.Bounds(80, 80))
  slider.update(slider.Bounds(20, 80), slider.Upper(-1), 0, 100)
  |> should.equal(slider.Bounds(20, 20))
  carousel.next(0, 3, -1) |> should.equal(2)
  carousel.next(2, 3, 1) |> should.equal(0)
  carousel.next(0, 0, 1) |> should.equal(0)
}

pub fn editor_json_import_rejects_executable_urls_and_invalid_document_shapes_test() {
  let document = text_editor.text("Hello <world>\nÉire")
  text_editor.parse(text_editor.to_json(document)) |> should.equal(Ok(document))
  text_editor.parse("{\"type\":\"paragraph\"}") |> should.be_error
  text_editor.parse(
    "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"bad\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"javascript:alert(1)\"}}]}]}]}",
  )
  |> should.be_error
}

pub fn chart_markup_keeps_an_accessible_non_graphical_alternative_test() {
  charts.view(
    "chart",
    charts.Config("Requests", ["Mon", "Tue"], [
      charts.Series("Count", charts.Bar, charts.Values([1.0, 2.0])),
    ]),
    fn(_) { Nil },
    [],
  )
  |> element.to_string
  |> string.contains("Chart data")
  |> should.be_true
  command_menu.filter(
    [command_menu.Command("one", "Éire", "team", False, Nil)],
    "eire",
  )
  |> list.length
  |> should.equal(1)
}

pub fn advanced_widgets_validate_boundary_configuration_test() {
  charts.validate(
    charts.Config("Invalid", [], [
      charts.Series("Heat", charts.Heatmap, charts.Values([1.0])),
    ]),
  )
  |> should.be_error
  charts.validate(
    charts.Config("Valid", ["A"], [
      charts.Series("Heat", charts.Heatmap, charts.Cells([#(0, 0, 1.0)])),
    ]),
  )
  |> should.equal(Ok(Nil))
  scheduler.validate(
    scheduler.Config(scheduler.Month, "2026-10-31", "Not/AZone", []),
  )
  |> should.be_error
  scheduler.validate(scheduler.Config(scheduler.Month, "2026-10-31", "UTC", []))
  |> should.equal(Ok(Nil))
  scheduler.validate(
    scheduler.Config(scheduler.Month, "2026-10-31", "UTC", [
      scheduler.Event(
        "one",
        "Review",
        "2026-10-31T12:00:00Z",
        "2026-10-31T11:00:00Z",
        False,
        False,
        scheduler.Never,
      ),
    ]),
  )
  |> should.be_error
}

pub fn recurring_duration_uses_its_named_zone_across_a_clock_change_test() {
  let config =
    scheduler.Config(scheduler.Month, "2026-10-24", "Europe/Dublin", [
      scheduler.Event(
        "night",
        "Night shift",
        "2026-10-24T23:00:00",
        "2026-10-25T02:00:00",
        False,
        False,
        scheduler.Weekly(1, [5]),
      ),
    ])
  scheduler.view("night", "Night calendar", config, fn(_) { Nil }, [])
  |> element.to_string
  |> string.contains("14400000")
  |> should.be_true
  scheduler.validate(scheduler.Config(scheduler.Month, "2026-02-30", "UTC", []))
  |> should.be_error
}

pub fn scheduler_changes_preserve_all_day_transitions_and_other_event_data_test() {
  let item =
    scheduler.Event(
      "one",
      "Review",
      "2026-10-12T10:00:00Z",
      "2026-10-12T11:00:00Z",
      False,
      True,
      scheduler.Never,
    )
  scheduler.change(
    [item],
    scheduler.Change("one", "2026-10-13", "2026-10-14", True),
  )
  |> should.equal([
    scheduler.Event(
      ..item,
      start: "2026-10-13",
      end: "2026-10-14",
      all_day: True,
    ),
  ])
}
