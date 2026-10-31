import assert from "node:assert/strict";
import { test } from "node:test";
import { accepts } from "../src/meridian_ui/upload_ffi.mjs";

test("file acceptance handles case-insensitive extensions, exact MIME types and families", () => {
  const text = { name: "Notes.TXT", type: "text/plain" };
  assert.equal(accepts(text, ".txt"), true);
  assert.equal(accepts(text, "image/png, text/plain"), true);
  assert.equal(accepts(text, "text/*"), true);
  assert.equal(accepts(text, "image/*"), false);
  assert.equal(accepts(text, ".tx"), false);
  assert.equal(accepts(text, ""), true);
});
