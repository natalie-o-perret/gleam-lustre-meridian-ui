export const name = (file) => file.name;
export const size = (file) => file.size;

export function accepts(file, accept) {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  return (
    !rules.length ||
    rules.some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith("/*")
          ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
          : file.type.toLowerCase() === rule,
    )
  );
}

export function setupUploads(root, signal) {
  const view = root.ownerDocument.defaultView;
  const owned = (node) => node?.closest?.(".meridian-ui") === root;
  const select = (input, files) => {
    const accepted = [];
    const errors = [];
    const maximum = Math.max(0, Number(input.dataset.maximum) || 0);
    for (const file of files) {
      if (!accepts(file, input.accept))
        errors.push(`${file.name}: unsupported file type`);
      else if (maximum && file.size > maximum)
        errors.push(`${file.name}: file is too large`);
      else if (!input.multiple && accepted.length)
        errors.push(`${file.name}: only one file is allowed`);
      else accepted.push(file);
    }
    const transfer = new view.DataTransfer();
    for (const file of accepted) transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(
      new view.CustomEvent("meridian-files", {
        bubbles: true,
        detail: { files: accepted, errors },
      }),
    );
  };
  root.addEventListener(
    "change",
    (event) => {
      const input = event.target;
      if (
        owned(input) &&
        input.type === "file" &&
        input.closest("[data-meridian-upload]")
      )
        select(input, [...input.files]);
    },
    { signal },
  );
  for (const type of ["dragover", "drop"])
    root.addEventListener(
      type,
      (event) => {
        const region = event.target.closest?.("[data-meridian-upload]");
        const input = region?.querySelector('input[type="file"]');
        if (!region || !owned(region) || !input || input.matches(":disabled"))
          return;
        event.preventDefault();
        if (type === "drop") {
          select(input, [...event.dataTransfer.files]);
        }
      },
      { signal },
    );
}

export function upload(destination, files, onProgress, onFinish) {
  const url = new URL(destination, document.baseURI);
  if (!["http:", "https:"].includes(url.protocol))
    throw new TypeError("Uploads require an HTTP or HTTPS URL");
  const request = new XMLHttpRequest();
  const data = new FormData();
  for (const file of files) data.append("files", file[0], file[0].name);
  request.open("POST", url.href);
  let finished = false;
  const complete = (status, text) => {
    if (!finished) {
      finished = true;
      onFinish(status, text);
    }
  };
  request.upload.addEventListener("progress", (event) =>
    onProgress(event.loaded, event.lengthComputable ? event.total : 0),
  );
  request.addEventListener("load", () =>
    complete(request.status, request.responseText),
  );
  request.addEventListener("error", () => complete(0, "Network error"));
  request.addEventListener("abort", () => complete(0, "Cancelled"));
  request.send(data);
  return () => {
    if (!finished) request.abort();
  };
}
