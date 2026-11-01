export const validColour = (value) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
export const validPrimary = (value) => value === "mono" || validColour(value);

const rgb = (hex) =>
  hex
    .slice(1)
    .match(/../g)
    .map((value) => parseInt(value, 16));
const hex = (values) =>
  "#" +
  values
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("");
const mix = (a, b, weight) =>
  a.map((value, index) => value * (1 - weight) + b[index] * weight);
const luminance = (colour) =>
  rgb(colour)
    .map((value) => {
      value /= 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
export function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function colourTokens(colour, panel) {
  if (!validColour(colour) || !validColour(panel)) return null;
  const edge = luminance(panel) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let step = 0; step <= 100; step++) {
    const ink = hex(mix(rgb(colour), edge, step / 100));
    const soft = hex(mix(rgb(panel), rgb(ink), 0.12));
    if (contrast(ink, soft) >= 4.5)
      return {
        colour: ink,
        soft,
        on:
          contrast(ink, "#000000") >= contrast(ink, "#ffffff")
            ? "#000000"
            : "#ffffff",
      };
  }
  return null;
}

export function applyPalette(root, primary, secondary) {
  if (primary === "mono")
    primary = root.dataset.theme === "dark" ? "#ffffff" : "#000000";
  const panel =
    validColour(primary) || validColour(secondary)
      ? root.ownerDocument.defaultView
          .getComputedStyle(root)
          .getPropertyValue("--panel")
          .trim()
      : "";
  for (const [name, value] of [
    ["accent", primary],
    ["secondary", secondary],
  ]) {
    const tokens = colourTokens(value, panel);
    for (const [key, colour] of [
      [`--${name}`, tokens?.colour],
      [`--${name}-soft`, tokens?.soft],
      [`--on-${name}`, tokens?.on],
    ]) {
      const previous = root.style.getPropertyValue(key);
      if (colour && previous !== colour) root.style.setProperty(key, colour);
      else if (!colour && previous) root.style.removeProperty(key);
    }
  }
}
