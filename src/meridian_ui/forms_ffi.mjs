export function setupForms(root, signal) {
  const view = root.ownerDocument.defaultView;
  const messages = new WeakMap();
  const validateTagInput = (input) => {
    const message =
      input.required && !input.value.trim() ? "Enter at least one value." : "";
    if (
      !input.validity.customError ||
      input.validationMessage === messages.get(input)
    ) {
      input.setCustomValidity(message);
      messages.set(input, message);
    }
  };
  const owned = (element) => element?.closest?.(".meridian-ui") === root;
  const syncTagName = (input) => {
    const name = input.value.trim()
      ? input.closest("[data-meridian-tags]").dataset.name
      : "";
    if (input.name !== name) input.name = name;
  };
  const emit = (element, name, detail) =>
    element.dispatchEvent(
      new view.CustomEvent(name, { bubbles: true, detail }),
    );
  root.addEventListener(
    "change",
    (event) => {
      const select = event.target;
      if (owned(select) && select.dataset?.meridianListbox) {
        emit(select, "meridian-selection", {
          values: [...select.selectedOptions].map((option) => option.value),
        });
      }
    },
    { signal },
  );
  root.addEventListener(
    "input",
    (event) => {
      const input = event.target;
      if (owned(input) && input.dataset?.meridianTagInput) {
        syncTagName(input);
        validateTagInput(input);
      }
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const input = event.target;
      if (
        !owned(input) ||
        !input.dataset?.meridianTagInput ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        input.matches(":disabled, [readonly]")
      )
        return;
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        emit(input, "meridian-add", { value: input.value });
        input.value = "";
        syncTagName(input);
      } else if (event.key === "Backspace" && !input.value) {
        event.preventDefault();
        emit(input, "meridian-remove-last", {});
      }
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.(".meridian-chip-remove");
      const group = button?.closest("[data-meridian-tags]");
      if (group && owned(group))
        group
          .querySelector("[data-meridian-tag-input]")
          ?.focus({ preventScroll: true });
    },
    { signal },
  );
  return () => {
    for (const input of root.querySelectorAll("[data-meridian-tag-input]")) {
      if (owned(input) && input.dataset?.meridianTagInput) {
        syncTagName(input);
        validateTagInput(input);
      }
    }
  };
}
