import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calendarDates,
  nowValue,
  validTimeZone,
  timeZones,
  localTimeZone,
} from "../src/meridian_ui/date_picker_ffi.mjs";

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

test("Now uses the selected IANA zone and native step base without converting entered values", () => {
  const now = Date.parse("2026-11-12T10:22:33Z");
  assert.equal(nowValue("time", "UTC", "1", "", now), "10:22:33");
  assert.equal(nowValue("time", "Asia/Tokyo", "1", "", now), "19:22:33");
  assert.equal(
    nowValue("datetime-local", "America/New_York", "1", "", now),
    "2026-11-12T05:22:33",
  );
  assert.equal(nowValue("time", "UTC", "60", "09:00:15", now), "10:22:15");
  assert.equal(nowValue("time", "UTC", "0.5", "", now + 750), "10:22:34");
  assert.equal(nowValue("time", "UTC", "any", "", now + 125), "10:22:33.125");
  assert.ok(timeZones().includes(localTimeZone()));
  assert.ok(timeZones().includes("UTC"));
  assert.ok(validTimeZone("Europe/Dublin"));
  assert.ok(!validTimeZone("not/a-timezone"));
});
