import assert from "node:assert/strict";
import { test } from "node:test";
import { codeCopyFixture } from "./code_copy_fixture.mjs";

test("copy feedback expires at 3000ms and a repeat copy resets the expiry", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const copied = [];
  const fixture = codeCopyFixture(async (text) => copied.push(text));
  t.after(fixture.abort);
  await fixture.click();
  assert.deepEqual(copied, [fixture.viewer.dataset.codeSource]);
  assert.equal(fixture.label.textContent, "Copied");
  assert.ok(fixture.classes.has("primary-button"));
  assert.equal(fixture.status.textContent, "Copied.");
  t.mock.timers.tick(2999);
  assert.equal(fixture.label.textContent, "Copied");
  await fixture.click();
  t.mock.timers.tick(1);
  assert.equal(fixture.label.textContent, "Copied");
  t.mock.timers.tick(2998);
  assert.equal(fixture.button.dataset.copied, "true");
  t.mock.timers.tick(1);
  assert.equal(fixture.label.textContent, "Copy");
  assert.equal(fixture.status.textContent, "");
  assert.equal(fixture.statusClasses.size, 0);
  assert.equal(fixture.classes.size, 0);
  assert.equal(fixture.button.dataset.copied, undefined);
});

test("clipboard denial keeps manual copy instructions without success styling", async (t) => {
  const fixture = codeCopyFixture(async () => {
    throw new Error("denied");
  });
  t.after(fixture.abort);
  await fixture.click();
  assert.equal(fixture.label.textContent, "Copy");
  assert.match(
    fixture.status.textContent,
    /Copy unavailable\. Select and copy the code\./,
  );
  assert.equal(fixture.classes.size, 0);
});

test("stale clipboard results cannot overwrite newer feedback", async (t) => {
  const pending = [];
  const fixture = codeCopyFixture(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  );
  t.after(fixture.abort);
  const first = fixture.click();
  const second = fixture.click();
  pending[1].resolve();
  await second;
  pending[0].reject(new Error("old denial"));
  await first;
  assert.equal(fixture.status.textContent, "Copied.");
  assert.equal(fixture.label.textContent, "Copied");
});
