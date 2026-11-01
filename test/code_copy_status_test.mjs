import assert from "node:assert/strict";
import { test } from "node:test";
import { codeCopyFixture } from "./code_copy_fixture.mjs";

test("copy success is announced without duplicate visible text, but errors stay visible", async (t) => {
  let denied = false;
  const fixture = codeCopyFixture(async () => {
    if (denied) throw new Error("Clipboard denied");
  });
  t.after(fixture.abort);
  await fixture.click();
  assert.equal(fixture.label.textContent, "Copied");
  assert.equal(fixture.status.textContent, "Copied.");
  assert.ok(fixture.statusClasses.has("sr-only"));
  denied = true;
  await fixture.click();
  assert.equal(fixture.label.textContent, "Copy");
  assert.match(fixture.status.textContent, /Copy unavailable/);
  assert.equal(fixture.statusClasses.has("sr-only"), false);
});
