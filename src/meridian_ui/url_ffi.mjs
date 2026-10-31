export function allowed(value) {
  if (!value || /[\u0000-\u0020\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value, "https://meridian.invalid/");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}
