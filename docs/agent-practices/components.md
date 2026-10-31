# Component styling and capabilities

## Style the whole component

- Use Meridian's shared tokens, controls and icons. Cover light/dark themes and
  style presets, not just the default appearance.
- Style hover, focus, active, selected, expanded, disabled, read-only, loading,
  empty, invalid and error states wherever they apply.
- Include popups, menus, tooltips, scroll regions, validation messages and advanced
  engine surfaces. Don't leave secondary interactions looking like another kit.
- Preserve readable contrast, visible keyboard focus, RTL, zoom, forced colours
  and reduced motion. Styling must not remove native editing or form semantics.
- Document genuine browser-owned UI limits and keep its surrounding control
  consistent. Don't fake platform behaviour just to imitate a screenshot.

## Match the expected capability set

- Before building or reviewing a component, compare suitable equivalents in
  mature frameworks such as PrimeNG, Material UI and Radix/shadcn.
- Record the relevant properties, events, state transitions and composition hooks.
  Use a capability checklist linking each item to its public API, working example
  and test. Track missing capabilities explicitly.
- Cover the features users expect for that component, including where relevant:
  - Values, defaults, controlled state, disabled/read-only state and reset/clear.
  - Labels, descriptions, validation, constraints and native form submission.
  - Loading, empty/error states, asynchronous results and stale-response handling.
  - Selection modes, filtering, sorting, paging, editing and custom item content.
  - Date/time ranges, bounds, precision, locale and timezone behaviour.
  - Keyboard navigation, focus return, dismissal, responsive layout and overlays.
- Implement all relevant capabilities, not generic filler properties. Keep data,
  transport and business rules caller-owned instead of copying another kit's
  architecture or adding dependencies for superficial parity.
- If an expected capability is unsuitable or blocked, document why and agree the
  gap with the user. Don't silently omit it or claim the component is complete.

## Make the coverage real

- Wire each property through the shared component, not only its catalogue demo.
  Keep public types, callbacks, constraints and defaults clear.
- Provide editable catalogue controls and distinct presets that change actual
  behaviour. Show custom content and rendering hooks where supported.
- Update compiler-derived API references, examples, fixtures and regression tests
  together. Exercise important property combinations and non-default states.
- Check related components and every caller when fixing a shared interaction.
- A polished default screenshot is not proof of completeness. Finish styling,
  capability coverage, accessibility and interaction benchmarks before claiming
  the component is ready.
