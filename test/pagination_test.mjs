import assert from "node:assert/strict";
import { test } from "node:test";
import { pageSuggestions } from "../src/meridian_ui/pagination_ffi.mjs";

test("page autocomplete offers bounded prefix matches without allocating every page", () => {
  assert.deepEqual(pageSuggestions(3, ""), ["1", "2", "3"]);
  assert.deepEqual(pageSuggestions(3, "2"), ["2"]);
  const large = pageSuggestions(1_000_000, "123");
  assert.equal(large.length, 12);
  assert.ok(large.includes("123"));
  assert.ok(large.includes("1234"));
  assert.ok(
    large.every(
      (value) => value.startsWith("123") && Number(value) <= 1_000_000,
    ),
  );
  for (const value of ["0", "-1", "word", "99999999"])
    assert.deepEqual(pageSuggestions(10, value), []);
  assert.deepEqual(pageSuggestions(Infinity, "1"), []);
});
