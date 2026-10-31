import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchingSuggestions,
  setupAutocompletes,
} from "../src/meridian_ui/autocomplete_ffi.mjs";

test("autocomplete matches values and descriptions without case/accents or disabled options", () => {
  const options = [
    { value: "Éire", label: "Dublin team", disabled: false },
    { value: "Gleam", label: "Typed and friendly", disabled: false },
    { value: "Hidden", label: "Dublin team", disabled: true },
  ];
  assert.deepEqual(matchingSuggestions(options, " EIRE "), [options[0]]);
  assert.deepEqual(matchingSuggestions(options, "TYPED"), [options[1]]);
  assert.deepEqual(matchingSuggestions(options, "dublin"), [options[0]]);
  assert.deepEqual(matchingSuggestions(options, "<script>"), []);
});

test("autocomplete leaves the native datalist untouched without the popover API", () => {
  const root = { ownerDocument: { defaultView: {} } };
  assert.doesNotThrow(() =>
    setupAutocompletes(root, new AbortController().signal)(),
  );
});
