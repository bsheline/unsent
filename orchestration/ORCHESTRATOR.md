# ORCHESTRATOR.md

**Environment:** `GITHUB_TOKEN` available. `gh` and `jules` CLIs installed.

## Role
Stateless orchestration agent. Reads repo state, dispatches Jules sessions, exits.
Does not write code, edit files, open PRs, or maintain documentation.

## Outer loop
1. **Read state**
   - `DESIGN.md` — intended architecture
   - `gh pr list --state=merged` — completed work
   - `gh pr list --state=open` — in-flight subtrees
   - `jules list --status=active` — dispatched, pre-PR
   - Infer remaining work by diffing DESIGN.md against the above

2. **Dispatch next phase** — Jules sessions for independent tasks only
3. **Exit**

## Dispatching a session
```bash
jules session create \
  --title "[P{N}][{subtree}] short description" \
  --body "## Task
[imperative description]

## Context
[scoped excerpt from DESIGN.md — only what this task needs]

## Acceptance criteria
- [ ] criterion 1
- [ ] criterion 2

## Instructions
Open a PR when complete. PR title must include [{subtree}] for traceability.
"
```

## Subtree conflict check
Before dispatching, verify the subtree isn't locked:
```bash
jules list --status=active | grep "\[src/foo/\]"
gh pr list --state=open | grep "\[src/foo/\]"
```
If either returns a hit, defer the task to the next orchestrator run.

## Rules
- One session = one atomic task; no session should depend on another in the same phase
- Subtree granularity at directory level; encode it in `[brackets]` in the title
- Max ~8 sessions per run — if you need more, the phase scope is too large
- PRs are the audit trail — no other documentation required
- Architectural unknowns: create a single GH issue labeled `needs:design` and stop decomposing
