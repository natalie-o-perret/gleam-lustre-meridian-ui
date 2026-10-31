# Build, CI and design efficiency

## Check the cost during development

- For relevant changes, measure compile, build and test time and inspect a recent
  representative CI run. Check costs before and after, not only when CI times out.
- Separate dependency installation, code generation, Gleam compilation, engine
  bundling, catalogue generation, browser setup and test execution.
- Capture cold and warm compile/build timings. Use a disposable isolated checkout
  for clean runs, never clear another process's caches or rebuild its test assets.
- Repeat measurements on an otherwise idle machine. Record exact commands,
  revisions, toolchain, hardware, cache conditions, sample count and variability.
- Keep local wall time, CI queue time, end-to-end elapsed time and summed job time
  separate. Don't present one as a substitute for another or as billing data.
- Identify the slow stage before changing it. Keep raw evidence locally or in an
  approved system and publish concise, scrubbed, reproducible comparisons.

## Spot inefficient designs

- Trace affected hot paths and build dependencies. Look for repeated compilation,
  duplicated generation, unnecessary dependency fan-out and whole-repo work for a
  local change. Prefer existing incremental work over another cache or wrapper.
- Check eager loading of advanced engines, bundle growth, repeated DOM scans,
  redundant state copies, requests, renders and listeners. Exercise realistic data
  and repeated use, not only an empty component's initial render.
- Ask whether work can be removed, shared, scoped or deferred before parallelising
  it. Check memory, CPU, main-thread blocking and resource cleanup where relevant.
- Keep fixes within the task. Record unrelated bottlenecks with evidence and a
  focused follow-up, not speculative abstractions or an unrequested rewrite.
- Don't trade validation, accessibility, deterministic output or coverage for a
  faster headline number. Check whether an optimisation shifts cost elsewhere.

## Optimise CI with evidence

- Profile a completed representative run before changing job boundaries. Separate
  queue, setup, build and test time and identify the critical path.
- Split independent slow work, not already-fast checks. Count duplicated setup,
  runner contention and extra total job time before choosing a wider matrix.
- Keep the default local command complete. Run shared fallback and viewport checks
  once per browser. Preserve desktop and mobile coverage when splitting jobs.
- Verify that split jobs cover the original cases without omissions or duplicates.
  Update the workflow and coverage tests together when adding suites or scenarios.
- Measure the next completed run using comparable conditions. Report elapsed time
  and summed job time, not just the fastest job. Single-run gains aren't guarantees.
- Explain remaining bottlenecks and trade-offs. Don't add caching or more runners
  without evidence that they address the measured cost.
