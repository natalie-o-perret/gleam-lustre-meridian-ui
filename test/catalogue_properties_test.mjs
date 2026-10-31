import assert from "node:assert/strict";
import { test } from "node:test";
import {
  propertiesFor,
  validateProperties,
} from "../site/catalogue-properties.mjs";

test("preview property messages reject unknown names, types, choices and bounds", () => {
  const { properties, examples } = propertiesFor("button");
  assert.deepEqual(
    validateProperties(properties, examples[0].values),
    examples[0].values,
  );
  for (const values of [
    null,
    [],
    { disabled: true },
    { disabled: "yes" },
    { unknown: "value" },
    { variant: "unknown" },
    { label: "x".repeat(10001) },
  ])
    assert.equal(validateProperties(properties, values), null);
  const count = propertiesFor("paginator").properties;
  for (const value of ["-1", "1.5", "Infinity", "99999999"])
    assert.equal(validateProperties(count, { total: value }), null);
  assert.throws(() => propertiesFor("missing"), /Missing preview properties/);
});
