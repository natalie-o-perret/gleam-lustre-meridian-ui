import gleam/list
import gleam/option.{None, Some}
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
import meridian_ui/message
import meridian_ui/order_list
import meridian_ui/org_chart
import meridian_ui/orientation
import meridian_ui/paginator
import meridian_ui/pick_list
import meridian_ui/scheduler
import meridian_ui/selection
import meridian_ui/slider
import meridian_ui/table
import meridian_ui/task_board
import meridian_ui/terminal
import meridian_ui/text_editor
import meridian_ui/timeline
import meridian_ui/toast
import meridian_ui/tree
import meridian_ui/virtual_scroller

pub fn paging_clamps_shrinking_sets_and_zero_sizes_without_losing_last_page_test() {
  paginator.pages(11, 5) |> should.equal(3)
  paginator.pages(0, 0) |> should.equal(1)
  paginator.clamp(9, 3, 2) |> should.equal(1)
  paginator.slice([1, 2, 3], 9, 2) |> should.equal([3])
}

pub fn paging_has_a_labelled_selector_and_svg_navigation_without_huge_option_lists_test() {
  let html =
    paginator.view("Pages", 10, 2, 1, fn(_) { Nil }, []) |> element.to_string
  html |> string.contains("Go to page") |> should.be_true
  html |> string.contains("<datalist") |> should.be_true
  html |> string.contains("aria-label=\"Next page\"") |> should.be_true
  html |> string.contains("data-tooltip=\"First page\"") |> should.be_true
  html |> string.contains("meridian-icon") |> should.be_true
  let large =
    paginator.view("Pages", 100_000, 1, 0, fn(_) { Nil }, [])
    |> element.to_string
  large |> string.contains("type=\"text\"") |> should.be_true
  large |> string.contains("data-meridian-pages=\"100000\"") |> should.be_true
  should.be_true(string.length(large) < 10_000)
}

pub fn organisation_lists_keep_explicit_semantics_without_visual_bullets_test() {
  let html =
    org_chart.view(
      "Teams",
      [],
      [Node("design", "Design", False, [Node("tokens", "Tokens", False, [])])],
      fn(node) { h.text(node.label) },
    )
    |> element.to_string
  html |> string.contains("role=\"region\"") |> should.be_true
  html |> string.split("role=\"list\"") |> list.length |> should.equal(3)
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

pub fn tree_appearance_options_are_independent_and_keep_selection_test() {
  let html =
    tree.view(
      "Teams",
      selection.Single,
      tree.Model([], ["one"]),
      fn(_) { Nil },
      tree.appearance(False, True, False),
      [Node("one", "One", False, [])],
    )
    |> element.to_string
  html |> string.contains("data-tree-lines=\"false\"") |> should.be_true
  html |> string.contains("data-tree-boxes=\"true\"") |> should.be_true
  html |> string.contains("data-tree-animate=\"false\"") |> should.be_true
  html |> string.contains("aria-selected=\"true\"") |> should.be_true
}

pub fn tables_sort_filter_and_page_without_editing_source_data_test() {
  let column = table.Column("name", "Name", Some(string.compare), h.text)
  let model =
    table.Model("a", Some(table.Sort("name", table.Descending)), [], 0, 10)
  table.rows(["Blair", "Alex", "Cat"], model, fn(value) { value }, [column])
  |> should.equal(["Cat", "Blair", "Alex"])
  table.update(model, table.Search("other")).page |> should.equal(0)
  table.update(model, table.Select("one")).selected |> should.equal(["one"])
  let unsorted = table.Model("", None, [], 2, 10)
  let ascending = table.update(unsorted, table.SortBy("name"))
  ascending.sort |> should.equal(Some(table.Sort("name", table.Ascending)))
  let descending = table.update(ascending, table.SortBy("name"))
  descending.sort |> should.equal(Some(table.Sort("name", table.Descending)))
  let restored = table.update(descending, table.SortBy("name"))
  restored.sort |> should.equal(None)
  restored.page |> should.equal(0)
  table.rows(["Cat", "Alex", "Blair"], restored, fn(value) { value }, [column])
  |> should.equal(["Cat", "Alex", "Blair"])
}

pub fn remote_table_requests_exclude_selection_and_reset_offsets_on_query_changes_test() {
  let model = table.Model("project", None, [], 2, 25)
  table.request(model) |> should.equal(table.Request("project", None, 50, 25))
  table.request(table.update(model, table.Select("one")))
  |> should.equal(table.request(model))
  table.request(table.update(model, table.Search("other")))
  |> should.equal(table.Request("other", None, 0, 25))
  table.request(table.update(model, table.Size(10)))
  |> should.equal(table.Request("project", None, 0, 10))
  table.request(table.Model("", None, [], -1, 0))
  |> should.equal(table.Request("", None, 0, 1))
}

pub fn remote_tables_render_server_rows_without_filtering_sorting_or_slicing_them_again_test() {
  let html =
    table.remote(
      "Remote",
      table.Model(
        "no local match",
        Some(table.Sort("name", table.Descending)),
        [],
        3,
        1,
      ),
      200,
      False,
      None,
      fn(_) { Nil },
      [],
      ["Alpha", "Bravo"],
      fn(row) { row },
      [table.ServerColumn("name", "Name", True, h.text)],
    )
    |> element.to_string
  html |> string.contains("Alpha") |> should.be_true
  html |> string.contains("Bravo") |> should.be_true
  html |> string.contains("Page 4 of 200") |> should.be_true
  html |> string.contains("aria-sort=\"descending\"") |> should.be_true
  html |> string.contains("Rows per page") |> should.be_true
  let loading =
    table.remote(
      "Remote",
      table.Model("", None, [], 0, 10),
      0,
      True,
      None,
      fn(_) { Nil },
      [],
      [],
      fn(row: String) { row },
      [],
    )
    |> element.to_string
  loading |> string.contains("aria-busy=\"true\"") |> should.be_true
  loading |> string.contains("Loading Remote...") |> should.be_true
  loading |> string.contains("No results") |> should.be_false
  let failed =
    table.remote(
      "Remote",
      table.Model("", None, [], 0, 10),
      0,
      False,
      Some("<failed>"),
      fn(_) { Nil },
      [],
      [],
      fn(row: String) { row },
      [],
    )
    |> element.to_string
  failed |> string.contains("role=\"alert\"") |> should.be_true
  failed |> string.contains("&lt;failed&gt;") |> should.be_true
  failed |> string.contains("No results") |> should.be_false
}

pub fn reference_tables_keep_native_headers_custom_cells_and_scroll_access_test() {
  let html =
    table.read_only("Properties", [], ["<label>"], fn(row) { row }, [
      table.Column("name", "Field", None, h.text),
    ])
    |> element.to_string
  html |> string.contains("class=\"meridian-table-scroll\"") |> should.be_true
  html |> string.contains("tabindex=\"0\"") |> should.be_true
  html |> string.contains("scope=\"col\"") |> should.be_true
  html |> string.contains("&lt;label&gt;") |> should.be_true
  html |> string.contains("type=\"checkbox\"") |> should.be_false
  html |> string.contains("meridian-paginator") |> should.be_false
}

pub fn timeline_templates_keep_native_list_semantics_and_custom_slots_test() {
  let html =
    timeline.view_with(
      "Events",
      orientation.Horizontal,
      timeline.Alternate,
      [],
      ["<event>"],
      fn(value) { h.strong([], [h.text(value)]) },
      fn(_) { h.time([], [h.text("Today")]) },
      fn(_) { h.span([], [h.text("Marker")]) },
    )
    |> element.to_string
  html |> string.contains("role=\"list\"") |> should.be_true
  html |> string.contains("data-alignment=\"alternate\"") |> should.be_true
  html |> string.contains("data-orientation=\"horizontal\"") |> should.be_true
  html |> string.contains("&lt;event&gt;") |> should.be_true
  html |> string.contains("meridian-timeline-opposite") |> should.be_true
}

pub fn positioned_toasts_keep_timeout_and_optional_dismissal_test() {
  let html =
    toast.view_with(
      "Notices",
      toast.TopRight,
      False,
      [toast.Notice("one", message.Info, "<notice>", 2500)],
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("data-toast-position=\"top-right\"") |> should.be_true
  html |> string.contains("data-timeout=\"2500\"") |> should.be_true
  html |> string.contains("&lt;notice&gt;") |> should.be_true
  html |> string.contains("<button") |> should.be_false
}

pub fn scheduler_options_are_explicit_and_invalid_ranges_render_an_alert_test() {
  let options = scheduler.default_options()
  options.first_day |> should.equal(1)
  options.slot_duration |> should.equal("00:30:00")
  let config = scheduler.Config(scheduler.Month, "2026-11-12", "UTC", [])
  let html =
    scheduler.view_with(
      "calendar",
      "Calendar",
      config,
      options,
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  html |> string.contains("firstDay&quot;:1") |> should.be_true
  html |> string.contains("slotDuration&quot;:&quot;00:30:00") |> should.be_true
  html |> string.contains("data-meridian-picker=\"date\"") |> should.be_true
  let invalid =
    scheduler.view_with(
      "calendar",
      "Calendar",
      config,
      scheduler.Options(..options, day_start: "18:00:00", day_end: "08:00:00"),
      fn(_) { Nil },
      [],
    )
    |> element.to_string
  invalid |> string.contains("role=\"alert\"") |> should.be_true
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

pub fn editor_markdown_preserves_structure_and_code_languages_test() {
  let assert Ok(document) =
    text_editor.parse_markdown(
      "# Notes\n\n**Bold** and *italic*.\n\n- One\n- Two\n\n```gleam\nNil\n```\n",
    )
  let json = text_editor.to_json(document)
  list.each(
    ["heading", "strong", "em", "bullet_list", "code_block", "gleam"],
    fn(value) { json |> string.contains(value) |> should.be_true },
  )
  let assert Ok(markdown) = text_editor.to_markdown(document)
  text_editor.parse_markdown(markdown) |> should.equal(Ok(document))
  let assert Ok(literal) =
    text_editor.parse_markdown(
      "<script>alert(1)</script>\n\n[x](javascript:alert(1))",
    )
  text_editor.to_json(literal)
  |> string.contains("\"type\":\"link\"")
  |> should.be_false
}

pub fn editor_colours_are_validated_and_markdown_never_silently_drops_them_test() {
  let assert Ok(document) =
    text_editor.parse(
      "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Coloured\",\"marks\":[{\"type\":\"text_colour\",\"attrs\":{\"colour\":\"#123456\"}}]}]}]}",
    )
  text_editor.parse(text_editor.to_json(document)) |> should.equal(Ok(document))
  text_editor.to_markdown(document) |> should.be_error
  text_editor.parse(
    "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Bad\",\"marks\":[{\"type\":\"text_colour\",\"attrs\":{\"colour\":\"red;background:url(x)\"}}]}]}]}",
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
