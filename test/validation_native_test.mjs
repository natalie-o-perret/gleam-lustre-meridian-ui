import assert from "node:assert/strict";
import { test } from "node:test";
import { check } from "../build/dev/javascript/meridian_ui/meridian_ui/validation_ffi.mjs";

test("validation keeps native messages, skips barred controls and rejects missing forms or field IDs", (t) => {
  const original = globalThis.document;
  t.after(() => {
    if (original) globalThis.document = original;
    else delete globalThis.document;
  });
  assert.equal(check("missing").isOk(), false);
  const form = {
    localName: "form",
    elements: [
      { willValidate: false },
      { willValidate: true, validity: { valid: true } },
      {
        id: "email",
        willValidate: true,
        validity: { valid: false },
        validationMessage: "Enter an email.",
      },
    ],
  };
  globalThis.document = { getElementById: () => form };
  const result = check("form");
  assert.equal(result.isOk(), true);
  assert.deepEqual(
    [...result[0]].map((error) => [error.field, error.message]),
    [["email", "Enter an email."]],
  );
  form.elements[2].id = "";
  assert.equal(check("form").isOk(), false);
  form.localName = "div";
  assert.equal(check("form").isOk(), false);
});
