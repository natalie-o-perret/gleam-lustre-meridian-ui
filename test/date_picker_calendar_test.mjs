import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarDates } from "../src/meridian_ui/date_picker_ffi.mjs";

test("calendar grids retain leap days, adjacent months and years below 100", () => {
  const leap = calendarDates(2024, 2, 1);
  assert.equal(leap.length, 42);
  assert.equal(new Set(leap).size, 42);
  assert.equal(leap[0], "2024-01-29");
  assert.equal(leap[41], "2024-03-10");
  assert.ok(leap.includes("2024-02-29"));
  assert.ok(!calendarDates(1900, 2).includes("1900-02-29"));
  assert.ok(calendarDates(2000, 2).includes("2000-02-29"));
  assert.equal(calendarDates(1, 1, 1)[0], "0001-01-01");
  assert.equal(calendarDates(2026, 11, 0)[0], "2026-11-01");
  for (const args of [
    [0, 1, 0],
    [2026, 13, 0],
    [2026, 1, 7],
    [NaN, 1, 0],
  ])
    assert.deepEqual(calendarDates(...args), []);
});
