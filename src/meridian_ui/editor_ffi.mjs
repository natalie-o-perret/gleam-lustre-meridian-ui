import * as pm from "./internal/vendor/editor.mjs";
import { Ok, Error as GleamError } from "../gleam.mjs";
import { allowed } from "./url_ffi.mjs";
import { mountEngine } from "./engine_mount_ffi.mjs";

const safeUrl = (value) => typeof value === "string" && allowed(value);
const safeImage = (value) =>
  safeUrl(value) &&
  ["http:", "https:"].includes(
    new URL(value, "https://meridian.invalid").protocol,
  );
const requireUrl = (value) => {
  if (!safeUrl(value)) throw new TypeError("Unsafe link URL");
};
const requireImage = (value) => {
  if (!safeImage(value)) throw new TypeError("Unsafe image URL");
};
let nodes = pm.addListNodes(
  pm.basicSchema.spec.nodes,
  "paragraph block*",
  "block",
);
nodes = nodes.update("heading", {
  ...nodes.get("heading"),
  attrs: {
    level: {
      default: 1,
      validate(value) {
        if (!Number.isInteger(value) || value < 1 || value > 6)
          throw new TypeError("Invalid heading level");
      },
    },
  },
});
nodes = nodes.update("image", {
  ...nodes.get("image"),
  attrs: { ...nodes.get("image").attrs, src: { validate: requireImage } },
  parseDOM: [
    {
      tag: "img[src]",
      getAttrs(dom) {
        const src = dom.getAttribute("src");
        return safeImage(src)
          ? {
              src,
              alt: dom.getAttribute("alt") ?? "",
              title: dom.getAttribute("title"),
            }
          : false;
      },
    },
  ],
});
nodes = nodes.append(
  pm.tableNodes({ tableGroup: "block", cellContent: "block+" }),
);
const schema = new pm.Schema({
  nodes,
  marks: pm.basicSchema.spec.marks
    .update("link", {
      ...pm.basicSchema.spec.marks.get("link"),
      attrs: {
        href: { validate: requireUrl },
        title: { default: null, validate: "string|null" },
      },
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom) {
            const href = dom.getAttribute("href");
            return safeUrl(href)
              ? { href, title: dom.getAttribute("title") }
              : false;
          },
        },
      ],
      toDOM(mark) {
        return [
          "a",
          {
            href: mark.attrs.href,
            title: mark.attrs.title,
            rel: "noopener noreferrer",
          },
          0,
        ];
      },
    })
    .append({
      underline: {
        parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
        toDOM() {
          return ["u", 0];
        },
      },
      strike: {
        parseDOM: [{ tag: "s" }, { tag: "del" }],
        toDOM() {
          return ["s", 0];
        },
      },
    }),
});

function documentNode(value) {
  const node = schema.nodeFromJSON(JSON.parse(value));
  if (node.type !== schema.topNodeType)
    throw new TypeError("Expected a document");
  node.check();
  return node;
}
export function fromText(value) {
  return JSON.stringify({
    type: "doc",
    content: value.split("\n").map((text) => ({
      type: "paragraph",
      ...(text ? { content: [{ type: "text", text }] } : {}),
    })),
  });
}
export function parse(value) {
  try {
    return new Ok(JSON.stringify(documentNode(value).toJSON()));
  } catch (error) {
    return new GleamError(`Invalid editor document: ${error.message}`);
  }
}
export function html(value) {
  const wrapper = document.createElement("div");
  wrapper.append(
    pm.DOMSerializer.fromSchema(schema).serializeFragment(
      documentNode(value).content,
    ),
  );
  return wrapper.innerHTML;
}

function insertTable(state, dispatch) {
  const cell = () => schema.nodes.table_cell.createAndFill();
  const row = () => schema.nodes.table_row.create(null, [cell(), cell()]);
  const table = schema.nodes.table.create(null, [row(), row()]);
  if (dispatch) dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
  return true;
}

export function mount(id) {
  return mountEngine(id, "data-editor", (element, view) => {
    const container = element.closest(".meridian-editor");
    let readonly = element.dataset.readonly === "true";
    const commands = {
      strong: pm.toggleMark(schema.marks.strong),
      em: pm.toggleMark(schema.marks.em),
      underline: pm.toggleMark(schema.marks.underline),
      strike: pm.toggleMark(schema.marks.strike),
      code: pm.toggleMark(schema.marks.code),
      paragraph: pm.setBlockType(schema.nodes.paragraph),
      heading: pm.setBlockType(schema.nodes.heading, { level: 2 }),
      bullet: pm.wrapInList(schema.nodes.bullet_list),
      ordered: pm.wrapInList(schema.nodes.ordered_list),
      quote: pm.wrapIn(schema.nodes.blockquote),
      undo: pm.undo,
      redo: pm.redo,
      table: insertTable,
      row: pm.addRowAfter,
      column: pm.addColumnAfter,
      "delete-table": pm.deleteTable,
    };
    const bindings = {
      "Mod-b": commands.strong,
      "Mod-i": commands.em,
      "Mod-u": commands.underline,
      "Mod-z": pm.undo,
      "Mod-y": pm.redo,
      "Shift-Mod-z": pm.redo,
      Enter: pm.splitListItem(schema.nodes.list_item),
      Tab: pm.goToNextCell(1),
      "Shift-Tab": pm.goToNextCell(-1),
    };
    const updateToolbar = () => {
      for (const control of container.querySelectorAll(
        "[data-editor-command]",
      )) {
        const name = control.dataset.editorCommand;
        control.disabled = readonly || !commands[name](editor.state);
        if (schema.marks[name]) {
          const { from, to, empty, $from } = editor.state.selection;
          const active = empty
            ? schema.marks[name].isInSet(
                editor.state.storedMarks ?? $from.marks(),
              )
            : editor.state.doc.rangeHasMark(from, to, schema.marks[name]);
          control.setAttribute("aria-pressed", String(Boolean(active)));
        }
      }
    };
    const editor = new pm.EditorView(element, {
      state: pm.EditorState.create({
        schema,
        doc: documentNode(element.dataset.editor),
        plugins: [
          pm.history(),
          pm.keymap(bindings),
          pm.keymap(pm.baseKeymap),
          pm.gapCursor(),
          pm.dropCursor(),
          pm.columnResizing(),
          pm.tableEditing(),
        ],
      }),
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": element.dataset.editorLabel,
        "aria-readonly": String(readonly),
        class: "meridian-rich-text",
      },
      editable: () => !readonly,
      dispatchTransaction(transaction) {
        editor.updateState(editor.state.apply(transaction));
        updateToolbar();
        if (transaction.docChanged)
          element.dispatchEvent(
            new view.CustomEvent("meridian-document", {
              bubbles: true,
              detail: { json: JSON.stringify(editor.state.doc.toJSON()) },
            }),
          );
      },
      transformPastedHTML(value) {
        const parser = new view.DOMParser();
        const document = parser.parseFromString(value, "text/html");
        for (const node of document.querySelectorAll(
          "script,style,iframe,object,embed,svg,math,template,form,input,button,textarea",
        ))
          node.remove();
        for (const node of document.querySelectorAll("*"))
          for (const attr of [...node.attributes]) {
            if (
              attr.name.startsWith("on") ||
              ["style", "srcdoc", "id", "name"].includes(attr.name) ||
              (attr.name === "href" && !safeUrl(attr.value)) ||
              (attr.name === "src" && !safeImage(attr.value))
            )
              node.removeAttribute(attr.name);
          }
        return document.body.innerHTML;
      },
    });
    const click = (event) => {
      const control = event.target.closest?.("[data-editor-command]");
      if (!control || control.disabled || readonly) return;
      event.preventDefault();
      editor.dispatch(pm.closeHistory(editor.state.tr));
      commands[control.dataset.editorCommand](
        editor.state,
        editor.dispatch,
        editor,
      );
      editor.focus();
    };
    const preserve = (event) => {
      if (event.target.closest?.("[data-editor-command]"))
        event.preventDefault();
    };
    container.addEventListener("click", click);
    container.addEventListener("mousedown", preserve);
    const observer = new view.MutationObserver(() => {
      readonly = element.dataset.readonly === "true";
      editor.setProps({
        editable: () => !readonly,
        attributes: {
          ...editor.props.attributes,
          "aria-readonly": String(readonly),
        },
      });
      updateToolbar();
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-readonly"],
    });
    updateToolbar();
    return {
      update(config, theme, direction) {
        const next = schema.nodeFromJSON(config);
        next.check();
        if (!editor.state.doc.eq(next))
          editor.dispatch(
            editor.state.tr
              .replaceWith(0, editor.state.doc.content.size, next.content)
              .setMeta("addToHistory", false),
          );
        editor.dom.dir = direction;
        updateToolbar();
      },
      destroy() {
        observer.disconnect();
        container.removeEventListener("click", click);
        container.removeEventListener("mousedown", preserve);
        editor.destroy();
      },
    };
  });
}
