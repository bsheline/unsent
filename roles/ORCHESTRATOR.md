# ORCHESTRATOR.md

**Environment:** `GITHUB_TOKEN` and `JULES_API_KEY` available as environment variables.
`gh` and `curl` CLIs available. Jules CLI requires browser OAuth and cannot authenticate
headlessly — use the REST API directly.

## Role
Stateless orchestration agent. Reads repo state, dispatches Jules sessions, exits.
Does not write code, edit files, open PRs, or maintain documentation.

## Outer loop
1. **Read state**
   - `DESIGN.md` — intended architecture
   - `gh pr list --state=merged` — completed work
   - `gh pr list --state=open` — in-flight subtrees
   - Jules API session list (see below) — dispatched, pre-PR
   - Infer remaining work by diffing DESIGN.md against the above

2. **Dispatch next phase** — Jules sessions for independent tasks only
3. **Exit**

## Reading state from Jules

```bash
# List non-completed sessions (dispatched but no PR yet)
curl -s 'https://jules.googleapis.com/v1alpha/sessions' \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  | jq '.sessions[] | select(.state != "COMPLETED") | .title'
```

## Subtree conflict check
Before dispatching, verify the subtree isn't locked:

```bash
SUBTREE="src/foo/"

# Check Jules sessions
curl -s 'https://jules.googleapis.com/v1alpha/sessions' \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  | jq -r '.sessions[] | select(.state != "COMPLETED") | .title' \
  | grep "\[$SUBTREE\]"

# Check open PRs
gh pr list --state=open --json title -q '.[].title' | grep "\[$SUBTREE\]"
```

If either returns a hit, defer the task to the next orchestrator run.

## Resolving the repo source ID

Required before creating sessions. The source name is stable — read it once from DESIGN.md
if already recorded, otherwise fetch:

```bash
curl -s 'https://jules.googleapis.com/v1alpha/sources' \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  | jq '.sources[] | {name, id}'
```

The source name format is `sources/github/OWNER/REPO`.

## Dispatching a session

```bash
curl -s 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d "{
    \"title\": \"[P{N}][{subtree}] short description\",
    \"prompt\": \"## Task\n[imperative description]\n\n## Context\n[scoped excerpt from DESIGN.md — only what this task needs]\n\n## Acceptance criteria\n- [ ] criterion 1\n- [ ] criterion 2\n\nOpen a PR when complete. PR title must include [{subtree}].\",
    \"sourceContext\": {
      \"source\": \"sources/github/OWNER/REPO\",
      \"githubRepoContext\": { \"startingBranch\": \"main\" }
    },
    \"automationMode\": \"AUTO_CREATE_PR\"
  }"
```

`AUTO_CREATE_PR` is required — without it Jules completes work but does not open a PR.
PRs are the audit trail; no other documentation is produced.

## Session and issue creation rules
- One session = one atomic task; no session should depend on another in the same phase
- Subtree granularity at directory level; encode it in `[brackets]` in both title and PR title
- Max ~8 sessions per run — if you need more, the phase scope is too large
- Architectural unknowns: create a single GH issue labeled `needs:design` and stop decomposing

```bash
gh issue create \
  --title "[needs:design] short description" \
  --label "needs:design" \
  --body "## Decision required\n[what needs to be resolved before this can be decomposed]"
```

## Constraints
- No overlapping subtrees within a phase — always run the conflict check before dispatching
- Do not re-dispatch subtrees that appear in active Jules sessions or open PRs
- If a task depends on output from another task in the same phase, defer it to the next phase
- Dependency ordering is enforced through phase sequencing only — there is no blocking primitive
