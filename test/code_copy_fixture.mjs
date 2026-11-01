import { setupCodeCopy } from "../src/meridian_ui/code_copy_ffi.mjs";

export function codeCopyFixture(writeText = async () => {}) {
  const controller = new AbortController();
  const label = { textContent: "Copy" };
  const status = { textContent: "" };
  const classes = new Set();
  let click;
  const root = {
    ownerDocument: {
      defaultView: {
        setTimeout,
        clearTimeout,
        navigator: { clipboard: { writeText } },
      },
    },
    addEventListener: (_, handler) => {
      click = handler;
    },
    contains: (viewer) => viewer.isConnected,
  };
  const button = {
    dataset: {},
    disabled: false,
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
    },
    matches: () => button.disabled,
    querySelector: () => label,
    closest: (selector) =>
      selector === ".meridian-ui"
        ? root
        : selector === ".meridian-code-viewer"
          ? viewer
          : button,
  };
  const code = { dataset: { language: "gleam" } };
  const viewer = {
    dataset: { codeSource: "pub fn main() { Nil }" },
    isConnected: true,
    closest: () => root,
    querySelector: (selector) =>
      selector === "code"
        ? code
        : selector === ".meridian-code-status"
          ? status
          : button,
  };
  const sync = setupCodeCopy(root, controller.signal);
  return {
    viewer,
    button,
    label,
    status,
    classes,
    sync,
    click: () => click({ target: button }),
    abort: () => controller.abort(),
  };
}
