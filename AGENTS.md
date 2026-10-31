# Working on Meridian UI

## Keep changes small and shared

- Read the component, its callers, examples and tests before editing it.
- Fix shared component behaviour in `src/meridian_ui/`, not in catalogue-only
  workarounds. Update affected callers, fixtures and examples in the same change.
- Reuse Meridian components, icons and interactions. Don't build a second picker,
  disclosure, table or code viewer just for the catalogue.
- Keep application state, networking and business rules caller-owned. Preserve
  native form values, validation, keyboard editing and fallbacks when enhancing
  controls.
- Prefer existing helpers and platform features. Don't add dependencies or
  abstractions for a few lines, or options nobody asked for.

## Keep the catalogue useful

- Give each entry meaningful editable properties, distinct working presets and a
  public API or native-platform reference. Presets must change the real component.
- Use compiler-derived API types rather than hand-maintained copies. Update
  `README.md`, `COMPONENTS.md` and examples when public behaviour changes.
- Keep advanced engines, full source and detailed API tables lazy. Preserve
  content-hashed scripts, versioned stylesheets and bundle-budget checks.
- Don't hand-edit generated engine bundles. Use `npm run build:engines` for an
  intentional engine update, and keep dependency notices complete.
- Check narrow screens, zoom, LTR/RTL, keyboard focus, popup placement, forced
  colours and reduced motion. Don't trade accessibility for appearance.

## Verify locally before pushing

Use the Node version in `.nvmrc` and toolchain versions in
`.github/workflows/quality.yml`. Use the formatter version pinned by `Makefile`.

```sh
npm ci --ignore-scripts
make check
```

`make check` covers formatting, Gleam checks/tests, Node tests, reproducible engine
bundles and catalogue build checks. CI is not the first place to run these.

For component, interaction, styling or catalogue changes, also run the full browser
checks before pushing:

```sh
npx playwright install --with-deps chromium firefox webkit
make browser-check
```

- Add a focused regression test for non-trivial behaviour. For a bug fix, reproduce
  the failure before editing and verify the same check after the fix.
- Use `BROWSER` and `SUITE` for focused library checks. Catalogue checks support
  `BROWSER` and `WIDTH=1440` or `WIDTH=320`. Focused runs don't replace full coverage
  for UI changes. Documentation-only changes need `make check`.
- Build once before parallel catalogue runs. Never rebuild `dist/` while browser
  tests are reading it. Use Podman when running checks in containers.
- Don't remove assertions, skip scenarios, add arbitrary sleeps or inflate
  timeouts to hide a failure. Diagnose the cause first.

## Optimise CI with evidence

- Profile a completed representative run before changing job boundaries. Separate
  setup, test, queue and end-to-end time.
- Split independent slow work, not already-fast checks. Keep the default local
  command complete. Run shared fallback and viewport checks once per browser.
- Verify that split jobs cover the original cases without omissions or duplicates.
  Update the workflow and coverage tests together when adding suites or scenarios.
- Measure the next completed run. Report elapsed time and summed job time, not
  just the fastest job. Single-run improvements aren't guarantees or billing data.

## Keep collaboration safe

- Check `git status` before editing. Don't discard someone else's changes or
  force-push a shared branch.
- Keep PRs focused. Summarise behaviour and material risks, with captured evidence
  where it helps. Keep local logs and screenshots in ignored `test-results/`.
- Don't publish secrets, private endpoints or local paths in evidence. Don't claim
  manual screen-reader or real-device testing unless it was actually done.
- Push or open a PR when authorised. Merging, releasing and deploying need their
  own explicit approval.
