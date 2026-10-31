export function load(path, loaded, failed) {
  fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error("Source unavailable");
      return response.text();
    })
    .then(loaded, failed);
}

export function prettyJson(value) {
  return JSON.stringify(JSON.parse(value), null, 2);
}
