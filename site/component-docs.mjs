import { validateProperties } from "./catalogue-properties.mjs";
import {
  panel_markup,
  table_markup,
  icon_choice_markup,
} from "../examples/catalogue/build/dev/javascript/meridian_catalogue/catalogue_docs.mjs";

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

function section(title, className, open = false, id = className) {
  const host = node("div");
  host.innerHTML = panel_markup(id, title, open);
  const panel = host.firstElementChild;
  panel.classList.add(className);
  panel
    .querySelector(".meridian-disclosure-toggle")
    .classList.add("docs-toggle");
  return panel;
}

function table(headers, rows) {
  const host = node("div");
  host.innerHTML = table_markup(`${headers[0]} reference`, headers, rows);
  const scroll = host.firstElementChild;
  scroll.classList.add("docs-api-scroll");
  scroll.querySelector("table").classList.add("docs-api-table");
  return scroll;
}

function onOpen(panel, render) {
  panel.querySelector(".docs-toggle").addEventListener(
    "click",
    () => {
      render(panel.querySelector(":scope > .meridian-panel-content"));
    },
    { once: true },
  );
}

export function componentDocs(entry, frame) {
  const properties = section("Properties & examples", "docs-properties", true);
  const content = properties.querySelector(":scope > .meridian-panel-content");
  content.classList.add("docs-properties-content");
  const examples = node("label", undefined, "docs-example-selector");
  examples.append(node("span", "Example"));
  const select = node("select", undefined, "input");
  entry.examples.forEach((example, index) => {
    const option = node("option", example.name);
    option.value = String(index);
    select.append(option);
  });
  const custom = node("option", "Custom");
  custom.value = "custom";
  custom.disabled = true;
  select.append(custom);
  examples.append(select);
  const reset = node("button", "Reset example", "button");
  reset.type = "button";
  const bar = node("div", undefined, "docs-properties-bar");
  bar.append(examples, reset);
  const form = node("form", undefined, "docs-controls");
  form.setAttribute("aria-label", `${entry.name} preview properties`);
  const values = { ...entry.examples[0].values };
  const controls = new Map();
  for (const property of entry.properties) {
    const label = node("label");
    label.append(node("span", property.label));
    const control = node(
      property.type === "choice"
        ? "select"
        : property.value.includes("\n")
          ? "textarea"
          : "input",
      undefined,
      "input",
    );
    control.name = property.name;
    if (property.type === "choice") {
      if (property.name === "icon") {
        const picker = node("button", undefined, "select-button");
        picker.type = "button";
        picker.tabIndex = -1;
        picker.append(node("selectedcontent"));
        control.append(picker);
      }
      for (const value of property.options) {
        const option = node("option", value);
        if (property.name === "icon")
          option.innerHTML = icon_choice_markup(value);
        option.value = value;
        control.append(option);
      }
    } else if (control.localName === "input") {
      control.type = property.type === "boolean" ? "checkbox" : property.type;
      if (property.type === "boolean")
        control.className = "docs-property-checkbox";
      if (property.type === "number") {
        control.min = property.min;
        control.max = property.max;
        control.step = String(property.step);
      }
    }
    if (property.type === "boolean")
      control.checked = property.value === "true";
    else control.value = property.value;
    control.addEventListener("change", () => {
      const next = {
        ...values,
        [property.name]:
          property.type === "boolean" ? String(control.checked) : control.value,
      };
      if (
        !control.validity.valid ||
        !validateProperties(entry.properties, next)
      )
        return;
      Object.assign(values, next);
      select.value = "custom";
      send({ [property.name]: next[property.name] });
    });
    controls.set(property.name, control);
    label.append(control);
    form.append(label);
  }
  const send = (changed = values) =>
    frame.contentWindow.postMessage(
      { type: "meridian-properties", component: entry.id, values: changed },
      location.origin,
    );
  let configuredRoot;
  frame.addEventListener("meridian-preview-ready", () => {
    const root = frame.contentDocument.getElementById("demo-root");
    if (root !== configuredRoot) {
      configuredRoot = root;
      send();
    }
  });
  const setValues = (next) => {
    Object.assign(values, next);
    for (const property of entry.properties) {
      const control = controls.get(property.name);
      if (property.type === "boolean")
        control.checked = values[property.name] === "true";
      else control.value = values[property.name];
    }
  };
  select.addEventListener("change", () => {
    const example = entry.examples[Number(select.value)];
    if (!example) return;
    setValues(example.values);
    send();
  });
  reset.addEventListener("click", () => {
    setValues(entry.examples[0].values);
    select.value = "0";
    delete frame.dataset.ready;
    frame.dataset.overlayOpen = "false";
    frame.dataset.overlayDialog = "false";
    frame.style.visibility = "hidden";
    frame.src = frame.src;
  });
  form.addEventListener("submit", (event) => event.preventDefault());
  content.append(
    bar,
    form,
    node(
      "p",
      "Controls configure this live example. The source below shows its default setup.",
      "muted",
    ),
  );

  const api = section("API reference", "docs-api");
  const reference = api.querySelector(":scope > .meridian-panel-content");
  reference.classList.add("docs-api-content");
  reference.append(
    node(
      "p",
      entry.module
        ? "Gleam arguments are explicit, not optional component props. Callback messages update caller-owned state. Native defaults can be overridden through attrs."
        : "This entry uses native HTML and Lustre, not a Meridian wrapper. Use ordinary Lustre attributes, events and child elements.",
    ),
  );
  reference.append(
    table(
      ["Preview property", "Control", "Example default"],
      entry.properties.map((property) => [
        property.label,
        property.type,
        property.value,
      ]),
    ),
  );
  for (const fn of entry.api?.functions ?? []) {
    const details = section(
      `${entry.module.split("/").at(-1)}.${fn.name}`,
      "docs-api-function",
      false,
      `docs-function-${fn.name}`,
    );
    onOpen(details, (body) => {
      if (fn.description) body.append(node("p", fn.description));
      body.append(
        table(
          ["Argument", "Type", "Default", "Purpose"],
          fn.arguments.map((arg) => [
            arg.name,
            arg.type,
            "Explicit",
            arg.kind === "event"
              ? "Caller-owned event/message"
              : arg.kind === "content"
                ? "Custom content or render callback"
                : arg.name === "attrs"
                  ? "Native Lustre attributes"
                  : "Required argument",
          ]),
        ),
      );
      body.append(node("p", `Returns ${fn.returns}`));
    });
    reference.append(details);
  }
  for (const type of entry.api?.types ?? []) {
    const details = section(
      type.name,
      "docs-api-function",
      false,
      `docs-type-${type.name}`,
    );
    onOpen(details, (body) => {
      if (type.description) body.append(node("p", type.description));
      for (const constructor of type.constructors) {
        if (constructor.name !== type.name || type.constructors.length > 1)
          body.append(node("h3", constructor.name));
        if (constructor.fields.length)
          body.append(
            table(
              ["Field", "Type"],
              constructor.fields.map((field) => [field.name, field.type]),
            ),
          );
      }
    });
    reference.append(details);
  }
  reference.append(
    node(
      "p",
      "Customisation: compose Lustre elements in children/content arguments, or use a render callback where listed. attrs accepts id, class, aria-* and attributes supported by the rendered HTML element. Keep interactive controls out of native option templates.",
    ),
  );
  return [properties, api];
}
