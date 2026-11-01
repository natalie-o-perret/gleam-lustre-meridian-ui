import assert from "node:assert/strict";
import { test } from "node:test";
import { codeCopyFixture } from "./code_copy_fixture.mjs";

test("source replacement, removal and disposal invalidate pending clipboard writes", async () => {
  for (const change of [
    (fixture) => {
      fixture.viewer.dataset.codeSource = "new source";
      fixture.sync();
    },
    (fixture) => {
      fixture.viewer.isConnected = false;
      fixture.sync();
    },
    (fixture) => fixture.abort(),
  ]) {
    let resolve;
    const fixture = codeCopyFixture(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const copy = fixture.click();
    change(fixture);
    resolve();
    await copy;
    assert.equal(fixture.label.textContent, "Copy");
    assert.equal(fixture.status.textContent, "");
    assert.equal(fixture.classes.size, 0);
    fixture.abort();
  }
});

test("disposal cancels success expiry, and disabled copy controls do nothing", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let writes = 0;
  const fixture = codeCopyFixture(async () => {
    writes++;
  });
  fixture.button.disabled = true;
  await fixture.click();
  assert.equal(writes, 0);
  fixture.button.disabled = false;
  await fixture.click();
  fixture.abort();
  fixture.label.textContent = "Disposed";
  t.mock.timers.tick(3000);
  assert.equal(fixture.label.textContent, "Disposed");
  assert.equal(fixture.status.textContent, "");
});
