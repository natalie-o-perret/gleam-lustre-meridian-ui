import { IMask } from "./internal/vendor/mask.mjs";

const mounted = new WeakMap();
export function mount(id) {
  const input = document.getElementById(id);
  if (!input || input.tagName !== "INPUT")
    throw new Error(`Mask input not found: ${id}`);
  mounted.get(input)?.();
  const view = input.ownerDocument.defaultView;
  const mask = IMask(input, { mask: input.dataset.maskPattern, lazy: true });
  let updating = false;
  const sync = () => {
    if (!input.isConnected) {
      dispose();
      return;
    }
    updating = true;
    mask.updateOptions({ mask: input.dataset.maskPattern });
    if (mask.value !== input.dataset.maskValue)
      mask.value = input.dataset.maskValue;
    updating = false;
  };
  mask.on("accept", () => {
    if (!updating)
      input.dispatchEvent(
        new view.CustomEvent("meridian-mask", {
          bubbles: true,
          detail: {
            masked: mask.value,
            raw: mask.unmaskedValue,
            complete: mask.masked.isComplete,
          },
        }),
      );
  });
  const observer = new view.MutationObserver(sync);
  observer.observe(input.ownerDocument, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-mask-pattern", "data-mask-value"],
  });
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    mask.destroy();
    mounted.delete(input);
  }
  sync();
  mounted.set(input, dispose);
  return dispose;
}
