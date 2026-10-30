const preferences = ["light", "dark", "system"];

export function readTheme(key) {
  try {
    const saved = localStorage.getItem(key);
    if (preferences.includes(saved)) return saved;
  } catch {}
  return "system";
}

export function saveTheme(key, preference) {
  if (!preferences.includes(preference)) return;
  try {
    localStorage.setItem(key, preference);
  } catch {}
}

export function systemDark() {
  return (
    globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );
}

export function watchSystemTheme(onChange, view = globalThis) {
  const media = view.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return () => {};
  const changed = (event) => onChange(event.matches);
  media.addEventListener("change", changed);
  onChange(media.matches);
  return () => media.removeEventListener("change", changed);
}
