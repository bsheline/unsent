# Agent.md

## When to Stop and Ask

Stop, commit whatever is in a working state, and surface the question if:

- A requirement is ambiguous enough that two reasonable interpretations lead to different interfaces
- Completing the task requires modifying files outside the current package

## Definition of Done

- All tests pass — skipped tests do not count
- PR description explains *why* the change exists, not just what it does

## Commit Discipline

- One logical change per commit
- Branch for anything touching a public interface or crossing package boundaries; push directly to main for contained changes

## Testing

TDD for any module where the interface is defined before implementation. Test-After only for exploratory spikes intended to be refactored or discarded. Spikes promoted to production code require tests before promotion is complete.

Integration tests are expected alongside unit tests for anything crossing a process or I/O boundary.

## Comments

Every file opens with 2–5 lines explaining its purpose and, if non-obvious, why it exists as a separate unit. Inline comments for non-obvious choices only.

## Error Handling

Defensive. Prefer returning structured errors over exceptions for expected failure modes. Log with enough context to reproduce the failure.


## Ignore

Ignore the contents of `orchestration/` directory. It is used to manage the workflow of the agents.