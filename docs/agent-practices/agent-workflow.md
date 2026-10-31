# Efficient agent development

## Establish the smallest complete task

- Identify the requested outcome, acceptance checks and affected subdomains before
  editing. Read the existing component, callers and tests, not the whole repo.
- Locate existing patterns with targeted searches. Reuse earlier findings and
  recorded decisions instead of repeating investigations.
- Prefer shared components, existing helpers and platform features. Don't silently
  expand the task with new frameworks, harnesses, refactors or speculative options.
- Keep files below the size cap by choosing domain boundaries up front, not by
  compressing code or scattering one responsibility across arbitrary files.
- Ask one focused question when scope or a required contract is genuinely unclear.
  Don't block on choices that the existing project patterns already answer.

## Parallelise only independent work

- Prefer one agent for small or tightly coupled changes. Extra agents need enough
  independent work to justify their coordination cost.
- Give each delegated task a clear outcome, relevant context, constraints, owned
  paths, acceptance checks and expected hand-off. Distinguish editing from review.
- Agree shared APIs, events and data contracts before parallel edits. Keep one
  writer per file or subdomain, with a coordinator responsible for integration.
- Editing agents use isolated clones. Don't share mutable working trees, branches,
  stashes or local refs. Reserve worktrees for read-only investigation.
- Parallelise independent reads and checks. Don't duplicate the same investigation
  or rebuild assets while another process is testing them.
- Never overwrite, reset, stash or force-push someone else's work to resolve an
  overlap. Stop and coordinate when ownership or changes conflict.

## Use short feedback loops

- Make a focused change and run its smallest useful regression check first.
  Diagnose a failure before broadening the patch.
- Batch related edits, then run the pinned formatter and static checks. Avoid
  repeatedly rebuilding or rerunning unchanged expensive suites without a reason.
- Build once for parallel read-only browser runs. Keep outputs separate and use
  the same build for comparable tests and benchmarks.
- Before publishing, run the complete verification required for the change.
  Focused checks or another agent's summary aren't substitutes for that gate.
- Keep validation, accessibility, error handling and performance evidence intact.
  Efficiency doesn't mean deleting checks or hiding an unfinished part.

## Hand off facts, not a transcript

- Share changed paths, decisions, commands and observed results, remaining work
  and concrete risks. Link local evidence rather than pasting long tool logs.
- State assumptions and unverified claims explicitly. The coordinator verifies
  delegated results, connected callers and the final combined diff.
- Report meaningful discoveries, decisions and blockers. Don't narrate routine
  reads or send repeated status updates that add no information.
- Finish with the outcome and what wasn't checked. Keep publishing, merging and
  deployment under the user's explicit control.
