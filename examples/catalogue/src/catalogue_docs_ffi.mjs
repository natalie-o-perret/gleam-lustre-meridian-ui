export function load(path, loaded, failed) {
  fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error("Source unavailable");
      return response.text();
    })
    .then(loaded, failed);
}

export function copy(source, done) {
  const failed = () =>
    done("Copy unavailable. Select the code to copy it manually.");
  try {
    navigator.clipboard.writeText(source).then(() => done("Copied."), failed);
  } catch {
    failed();
  }
}
