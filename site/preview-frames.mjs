// WebKit suspends offscreen iframe frames even when their output is shown in the parent.
export function responsiveFrames(view) {
  const request = view.requestAnimationFrame;
  const cancel = view.cancelAnimationFrame;
  const pending = new Map();
  let next = 0;
  const clear = (id) => {
    const frame = pending.get(id);
    if (!frame) return;
    cancel.call(view, frame.frame);
    view.clearTimeout(frame.timer);
    pending.delete(id);
  };
  view.requestAnimationFrame = (callback) => {
    const id = --next;
    const run = (timestamp) => {
      if (!pending.has(id)) return;
      clear(id);
      callback(timestamp);
    };
    pending.set(id, {
      frame: request.call(view, run),
      timer: view.setTimeout(() => run(view.performance.now()), 100),
    });
    return id;
  };
  view.cancelAnimationFrame = (id) => {
    if (pending.has(id)) clear(id);
    else cancel.call(view, id);
  };
  return () => {
    for (const id of pending.keys()) clear(id);
    view.requestAnimationFrame = request;
    view.cancelAnimationFrame = cancel;
  };
}
