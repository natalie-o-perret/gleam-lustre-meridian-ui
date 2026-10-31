export function pageSuggestions(count, query) {
  if (!Number.isSafeInteger(count) || count < 1 || !/^\d*$/.test(query))
    return [];
  if (!query)
    return Array.from({ length: Math.min(12, count) }, (_, index) =>
      String(index + 1),
    );
  const prefix = Number(query);
  if (!Number.isSafeInteger(prefix) || prefix < 1 || prefix > count) return [];
  const values = [];
  for (
    let scale = 1;
    prefix * scale <= count && values.length < 12;
    scale *= 10
  )
    for (
      let value = prefix * scale;
      value <= Math.min(count, (prefix + 1) * scale - 1) && values.length < 12;
      value++
    )
      values.push(String(value));
  return values;
}

export function setupPagination(root, signal) {
  const doc = root.ownerDocument;
  const cached = new WeakMap();
  let next = 0;
  const sync = (input) => {
    const count = Number(input.dataset.meridianPages);
    const list = input
      .closest(".meridian-page-selector")
      ?.querySelector("datalist");
    if (!list) return;
    const page = input.dataset.meridianPage;
    let state = cached.get(input);
    if (!state || state.page !== page) {
      input.value = page;
      state = { page };
      cached.set(input, state);
    }
    const key = `${count}\n${input.value}`;
    if (state.key === key) return;
    state.key = key;
    if (!list.id) {
      let id;
      do {
        id = `${root.id}-page-suggestions-${++next}`;
      } while (doc.getElementById(id));
      list.id = id;
    }
    input.setAttribute("list", list.id);
    input.dataset.meridianAutocomplete = list.id;
    input.setAttribute("aria-autocomplete", "list");
    const invalid =
      input.value !== "" &&
      (!/^[1-9]\d*$/.test(input.value) || Number(input.value) > count);
    input.setCustomValidity(invalid ? `Choose a page from 1 to ${count}.` : "");
    input.setAttribute("aria-invalid", String(invalid));
    list.replaceChildren(
      ...pageSuggestions(count, input.value).map((value) => {
        const option = doc.createElement("option");
        option.value = value;
        return option;
      }),
    );
  };
  root.addEventListener(
    "input",
    (event) => {
      if (
        event.target.matches?.("input[data-meridian-pages]") &&
        event.target.closest(".meridian-ui") === root
      )
        sync(event.target);
    },
    { signal },
  );
  return () => {
    for (const input of root.querySelectorAll("input[data-meridian-pages]"))
      if (input.closest(".meridian-ui") === root) sync(input);
  };
}
