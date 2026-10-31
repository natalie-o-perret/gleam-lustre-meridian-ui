# Interaction benchmarks

## Required during UI development

- Keep a reproducible benchmark script with the relevant component or subdomain.
  Capture a baseline before changing existing behaviour, then repeat it after.
- For new interactions without an equivalent baseline, state that explicitly and
  record the initial measurements and agreed budget. Don't invent a speed-up.
- Measure the paths affected by the change, including relevant cases from:
  - Input/click to the painted component update and synced preview.
  - Hover to a visible tooltip, menu or other hover feedback.
  - Overlay open/close to painted content and usable keyboard focus.
  - Filtering, sorting, selection, pagination and asynchronous result updates.
  - Scrolling, dragging and resizing, including frame times and dropped frames.
  - Initial rendering, large datasets, lazy engines and long main-thread tasks.
- Include realistic data and non-default states. A benchmark of an empty widget
  doesn't establish responsiveness under normal use.

## Measure browser work, not automation overhead

- Timestamp the actual interaction and completion in the page. Finish after the
  expected state is rendered and painted, with focus ready where applicable.
- Don't substitute a Node round trip, DOM mutation alone or an arbitrary sleep
  for user-visible reaction time. Account for intentional hover/animation delays.
- Warm up repeated interactions and report cold-start results separately.
- Repeat enough samples to report a useful median and p95. Include the sample
  count, worst observation, failures and any discarded samples with reasons.
- Keep the browser build, machine, dataset, viewport, zoom, motion preference and
  cache conditions comparable. Record them with the exact runnable command.
- Cover Chromium, Firefox and WebKit, plus narrow screens and relevant RTL/zoom
  cases for shared interactions. Check continuous gestures under realistic load.

## Use the result

- Set or agree the relevant reaction-time and frame-time budgets before tuning.
  Don't invent a universal threshold or relax a budget to hide a regression.
- Compare before/after median and p95 using the same scenario. Explain whether a
  change improves latency, adds intentional delay or shifts work elsewhere.
- Keep raw samples and traces locally or in an approved system. Publish concise,
  scrubbed evidence with enough setup to reproduce the result.
- Investigate regressions before pushing. Don't claim a performance improvement
  from a single click, a favourable outlier or an unmeasured visual impression.
- Keep CI duration benchmarks separate from interaction latency. Faster CI does
  not prove that the component reacts faster.
