import { normalise } from "./filter_ffi.mjs";
import {
  positionOverlay,
  watchViewport,
  viewportBounds,
} from "./overlays_ffi.mjs";

export function matchingSuggestions(options, query) {
  query = normalise(query.trim());
  return options.filter(
    (option) =>
      !option.disabled &&
      option.value &&
      normalise(`${option.value} ${option.label}`).includes(query),
  );
}

export function setupAutocompletes(root, signal) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (typeof view.HTMLElement?.prototype.showPopover !== "function")
    return () => {};
  const ready = new Map();
  const attrs = [
    "list",
    "role",
    "aria-autocomplete",
    "aria-expanded",
    "aria-controls",
    "aria-activedescendant",
  ];
  const owned = (input) =>
    input?.matches?.("input[data-meridian-autocomplete]") &&
    input.closest(".meridian-ui") === root;
  const usable = (input) =>
    owned(input) &&
    !input.matches(":disabled, [readonly]") &&
    !input.closest("[hidden], [inert]");
  let current;
  let next = 0;
  const element = (tag, className, text = "") => {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const close = () => {
    if (!current) return;
    const { input, popup, status } = current;
    current = undefined;
    if (popup.matches(":popover-open")) popup.hidePopover();
    popup.remove();
    status.remove();
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-controls");
    input.removeAttribute("aria-activedescendant");
  };
  const activate = (index) => {
    if (!current || !current.options.length) return;
    current.index = (index + current.options.length) % current.options.length;
    for (const [offset, option] of [...current.popup.children].entries()) {
      option.setAttribute("aria-selected", String(offset === current.index));
      if (offset === current.index) {
        current.input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  };
  const choose = (index) => {
    if (!current || !usable(current.input)) return;
    const { input, options } = current;
    if (!options[index]) return;
    input.value = options[index].value;
    input.dispatchEvent(new view.Event("input", { bubbles: true }));
    input.dispatchEvent(new view.Event("change", { bubbles: true }));
    close();
    input.focus({ preventScroll: true });
  };
  const render = () => {
    if (!current) return;
    const { input, popup, status } = current;
    const list = doc.getElementById(input.dataset.meridianAutocomplete);
    if (!usable(input) || !input.isConnected || !list) return close();
    const options = matchingSuggestions(
      [...list.options].map((option) => ({
        value: option.value,
        label: option.label,
        disabled: option.disabled,
      })),
      input.value,
    );
    if (
      input.hasAttribute("data-meridian-pages") &&
      options.length === 1 &&
      options[0].value === input.value
    )
      return close();
    const key = JSON.stringify([input.value, options]);
    if (current.key === key) return;
    current.key = key;
    current.options = options;
    current.index = -1;
    input.removeAttribute("aria-activedescendant");
    popup.replaceChildren(
      ...options.map((option, index) => {
        const row = element("div", "meridian-autocomplete-option");
        row.id = `${popup.id}-${index}`;
        row.dataset.suggestionIndex = String(index);
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", "false");
        row.append(
          element("span", "meridian-autocomplete-value", option.value),
        );
        if (option.label && option.label !== option.value)
          row.append(
            element("span", "meridian-autocomplete-description", option.label),
          );
        return row;
      }),
    );
    if (!options.length) {
      const empty = element(
        "div",
        "meridian-autocomplete-empty",
        "No matching suggestions",
      );
      empty.setAttribute("role", "option");
      empty.setAttribute("aria-disabled", "true");
      popup.append(empty);
    }
    status.textContent = options.length
      ? `${options.length} suggestions available. Use Up and Down to choose.`
      : "No matching suggestions.";
    popup.style.inlineSize = `${input.getBoundingClientRect().width}px`;
    if (popup.matches(":popover-open")) positionOverlay(popup, input, view);
  };
  const open = (input) => {
    if (!usable(input) || !ready.has(input)) return;
    if (current?.input === input) return render();
    close();
    const popup = element(
      "div",
      "meridian-popover meridian-autocomplete-popup",
    );
    popup.id = `${root.id}-autocomplete-${++next}`;
    popup.setAttribute("popover", "manual");
    popup.setAttribute("role", "listbox");
    popup.setAttribute("aria-label", "Suggestions");
    popup.dir = view.getComputedStyle(input).direction;
    const status = element("span", "sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-atomic", "true");
    current = { input, popup, status, options: [], index: -1 };
    popup.addEventListener("mousedown", (event) => event.preventDefault());
    popup.addEventListener("pointermove", (event) => {
      const row = event.target.closest("[data-suggestion-index]");
      if (row) activate(Number(row.dataset.suggestionIndex));
    });
    popup.addEventListener("click", (event) => {
      const row = event.target.closest("[data-suggestion-index]");
      if (row) choose(Number(row.dataset.suggestionIndex));
    });
    (input.closest("dialog") ?? root).append(popup, status);
    render();
    if (current?.popup !== popup) return;
    input.setAttribute("aria-controls", popup.id);
    input.setAttribute("aria-expanded", "true");
    popup.showPopover();
    positionOverlay(popup, input, view);
  };
  for (const type of ["focusin", "click", "input", "compositionend"])
    root.addEventListener(
      type,
      (event) => {
        if (owned(event.target) && !event.isComposing) open(event.target);
      },
      { signal },
    );
  root.addEventListener(
    "compositionstart",
    (event) => {
      if (owned(event.target)) close();
    },
    { signal },
  );
  root.addEventListener(
    "focusout",
    () =>
      queueMicrotask(() => {
        if (current && doc.activeElement !== current.input) close();
      }),
    { signal },
  );
  view.addEventListener("blur", close, { signal });
  try {
    let host = view.frameElement?.ownerDocument.defaultView;
    while (host) {
      host.document.addEventListener("pointerdown", close, {
        signal,
        capture: true,
      });
      host = host.frameElement?.ownerDocument.defaultView;
    }
  } catch {
    // Cross-origin embeds keep their own focus and viewport dismissal.
  }
  doc.addEventListener(
    "pointerdown",
    (event) => {
      if (
        current &&
        event.target !== current.input &&
        !current.popup.contains(event.target)
      )
        close();
    },
    { signal, capture: true },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const input = event.target;
      if (!usable(input) || event.isComposing || event.ctrlKey || event.metaKey)
        return;
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        open(input);
        if (!current) return;
        event.preventDefault();
        event.stopPropagation();
        activate(
          current.index < 0
            ? event.key === "ArrowDown"
              ? 0
              : current.options.length - 1
            : current.index + (event.key === "ArrowDown" ? 1 : -1),
        );
      } else if (current?.input === input) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (event.key === "Enter" && current.index >= 0) {
          event.preventDefault();
          event.stopPropagation();
          choose(current.index);
        } else if (["Home", "End"].includes(event.key) && current.index >= 0) {
          event.preventDefault();
          event.stopPropagation();
          activate(event.key === "Home" ? 0 : current.options.length - 1);
        } else if (event.key === "Tab") close();
      }
    },
    { signal, capture: true },
  );
  watchViewport(
    view,
    () => {
      if (current) {
        const bounds = current.input.getBoundingClientRect();
        const area = viewportBounds(view);
        if (
          bounds.bottom <= area.top ||
          bounds.top >= area.bottom ||
          bounds.right <= area.left ||
          bounds.left >= area.right
        )
          return close();
        current.popup.style.inlineSize = `${bounds.width}px`;
        positionOverlay(current.popup, current.input, view);
      }
    },
    signal,
  );
  const restore = (input, original) => {
    for (const [name, value] of original) {
      if (value === null) input.removeAttribute(name);
      else input.setAttribute(name, value);
    }
    ready.delete(input);
  };
  signal.addEventListener(
    "abort",
    () => {
      close();
      for (const [input, original] of ready) restore(input, original);
    },
    { once: true },
  );
  return () => {
    if (current && (!current.input.isConnected || !owned(current.input)))
      close();
    for (const [input, original] of ready)
      if (!input.isConnected || !owned(input)) restore(input, original);
    for (const input of root.querySelectorAll(
      "input[data-meridian-autocomplete]",
    )) {
      if (
        !owned(input) ||
        !doc.getElementById(input.dataset.meridianAutocomplete)
      )
        continue;
      if (!ready.has(input)) {
        ready.set(
          input,
          attrs.map((name) => [name, input.getAttribute(name)]),
        );
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-expanded", "false");
      }
      input.removeAttribute("list");
    }
    render();
  };
}
