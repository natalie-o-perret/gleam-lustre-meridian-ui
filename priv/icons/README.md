# Icon data

Each JSON file belongs to a component subdomain. Its parent directory is the
public gallery category. Each entry contains:

```json
[0, "Constructor", "Display name", "SVG path"]
```

Keep IDs and names unique. Orders are contiguous and preserve `icon.all()`.
Append new orders rather than reordering existing glyphs. Paths use the shared
24x24 stroke treatment. The existing official GitHub mark keeps its 32x32 viewbox.

Run `npm run build:icons` with the pinned Gleam toolchain after editing the data.
`npm run check:icons` checks that the generated public module is current. Keep
renderer behaviour in `src/meridian_ui/internal/icon_svg.gleam`, not the generator.
