import { colourTokens, validColour } from "./palette.mjs";

export function applySurface(root, colour) {
  const dark = root.dataset.theme === "dark";
  const tones = {
    "--bg": dark ? [0, 0.12] : [255, 0.04],
    "--panel": dark ? [0, 0.22] : [255, 0],
    "--sidebar": dark ? [0, 0.22] : [255, 0.02],
    "--ink": dark ? [255, 0.08] : [0, 0.25],
    "--muted": dark ? [255, 0.55] : [0, 0.7],
    "--border": dark ? [0, 0.52] : [255, 0.22],
    "--track": dark ? [0, 0.4] : [255, 0.14],
  };
  for (const [name, [base, weight]] of Object.entries(tones)) {
    if (!validColour(colour)) {
      if (root.style.getPropertyValue(name)) root.style.removeProperty(name);
      continue;
    }
    let shade =
      "#" +
      colour
        .slice(1)
        .match(/../g)
        .map((channel) =>
          Math.round(base + (parseInt(channel, 16) - base) * weight)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    if (name === "--muted")
      shade = colourTokens(
        shade,
        root.style.getPropertyValue("--panel"),
      ).colour;
    if (root.style.getPropertyValue(name) !== shade)
      root.style.setProperty(name, shade);
  }
}
