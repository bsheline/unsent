#!/usr/bin/env python3
"""
Agent work queue dispatcher with subtree locking.

Polls GitHub issues labeled agent:local + status:ready, checks subtree
locks reconstructed from in-progress issues and open PRs, spawns workers
for non-conflicting tasks concurrently.

Environment:
  AGENT_CMD     - worker command (default: gemini for local, jules for jules)
  AGENT_FLAGS   - extra flags passed to worker (default: empty)
  POLL_INTERVAL - seconds between polls (default: 30)
  REPO          - owner/repo slug (default: bsheline/<cwd_name>)
"""

import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", 30))
WORKER_CLASS = os.environ.get("WORKER_CLASS", "local").lower()
REPO = os.environ.get("REPO") or f"bsheline/{Path.cwd().name}"  # owner/repo slug

if WORKER_CLASS == "jules":
    AGENT_CMD = os.environ.get("AGENT_CMD", "jules")
    LABEL_AGENT = "agent:jules"
    CLASS_MD = Path(__file__).parent / "JULES_WORKER.md"
else:
    AGENT_CMD = os.environ.get("AGENT_CMD", "gemini")
    LABEL_AGENT = "agent:local"
    CLASS_MD = Path(__file__).parent / "LOCAL_WORKER.md"

AGENT_FLAGS = os.environ.get("AGENT_FLAGS", "").split()

LABEL_READY       = "status:ready"
LABEL_IN_PROGRESS = "status:in-progress"
LABEL_FAILED      = "status:failed"

WORKER_MD = Path(__file__).parent / "WORKER.md"


@dataclass
class Worker:
    issue_number: int
    subtrees: set
    proc: object  # subprocess.Popen
    start_time: float = field(default_factory=time.time)

WORKER_TIMEOUT = int(os.environ.get("WORKER_TIMEOUT", 3600))

active: dict[int, Worker] = {}


# --- gh CLI helpers -----------------------------------------------------------

def gh(*args, check=True) -> str:
    result = subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=check
    )
    return result.stdout.strip()


def gh_json(*args) -> object:
    return json.loads(gh(*args))


def label_issue(number: int, add: str = None, remove: str = None):
    if add:
        gh("issue", "edit", str(number), "--add-label", add)
    if remove:
        gh("issue", "edit", str(number), "--remove-label", remove)


# --- subtree locking ----------------------------------------------------------

SUBTREE_RE = re.compile(
    r"## Affected-subtrees\s*\n(.*?)(?=\n##|\Z)", re.DOTALL
)


def parse_subtrees(body: str) -> set[str]:
    if not body:
        return set()
    m = SUBTREE_RE.search(body)
    if not m:
        return set()
    return {line.strip() for line in m.group(1).splitlines() if line.strip()}


def subtrees_conflict(needed: set[str], claimed: set[str]) -> bool:
    """True if any needed subtree is a prefix of or prefixed by any claimed subtree."""
    for n in needed:
        n = n.rstrip("/") + "/"
        for c in claimed:
            c = c.rstrip("/") + "/"
            if n.startswith(c) or c.startswith(n):
                return True
    return False


def get_claimed_subtrees() -> set[str]:
    """Reconstruct lock state from GitHub — crash-safe, no local state needed."""
    claimed: set[str] = set()

    # In-progress issues. If we fail to fetch, it throws and aborts the tick!
    # This is critical so we don't 'fail open' and spawn conflicting workers.
    issues = gh_json(
        "issue", "list",
        "--label", LABEL_IN_PROGRESS,
        "--json", "number,body",
        "--limit", "100",
    )
    for issue in issues:
        claimed |= parse_subtrees(issue.get("body") or "")

    # Open PRs (covers workers that opened PR but haven't exited cleanly)
    prs = gh_json(
        "pr", "list",
        "--state", "open",
        "--json", "number,body",
        "--limit", "100",
    )
    for pr in prs:
        claimed |= parse_subtrees(pr.get("body") or "")

    return claimed


# --- worker lifecycle ---------------------------------------------------------

def build_prompt(issue_number: int) -> str:
    issue_json = gh(
        "issue", "view", str(issue_number),
        "--json", "number,title,body,comments",
    )
    worker_md = WORKER_MD.read_text() if WORKER_MD.exists() else ""
    class_md = CLASS_MD.read_text() if CLASS_MD.exists() else ""
    return (
        f"{worker_md}\n\n"
        f"{class_md}\n\n"
        f"---\n\n"
        f"Implement GitHub issue #{issue_number}. Full issue context:\n"
        f"{issue_json}"
    )


def spawn(issue: dict) -> Worker | None:
    number = issue["number"]
    subtrees = parse_subtrees(issue.get("body") or "")

    if not subtrees:
        log(f"issue #{number} skipped — no ## Affected-subtrees section", error=True)
        label_issue(number, add=LABEL_FAILED, remove=LABEL_READY)
        return None

    prompt = build_prompt(number)
    label_issue(number, add=LABEL_IN_PROGRESS, remove=LABEL_READY)
    log(f"spawning worker for issue #{number}: {issue['title']}")

    if WORKER_CLASS == "jules":
        # jules remote new --repo <repo> --session "<prompt>"
        cmd = [AGENT_CMD, "remote", "new", "--session", prompt]
        if REPO:
            cmd.extend(["--repo", REPO])
        cmd.extend(AGENT_FLAGS)
        proc = subprocess.Popen(cmd)
    else:
        # gemini -p "<prompt>" for non-interactive one-shot execution
        cmd = [AGENT_CMD, "-p", prompt, *AGENT_FLAGS]
        proc = subprocess.Popen(cmd)
    return Worker(issue_number=number, subtrees=subtrees, proc=proc)


def reap() -> set[str]:
    """Collect finished workers, update labels, return freed subtrees."""
    freed: set[str] = set()
    done = []

    for number, worker in active.items():
        rc = worker.proc.poll()
        if rc is None:
            if time.time() - worker.start_time > WORKER_TIMEOUT:
                log(f"worker TIMEOUT issue #{number} (> {WORKER_TIMEOUT}s). Terminating.", error=True)
                worker.proc.kill()
                label_issue(number, add=LABEL_FAILED, remove=LABEL_IN_PROGRESS)
                freed |= worker.subtrees
                done.append(number)
            continue
        done.append(number)
        freed |= worker.subtrees
        if rc == 0:
            log(f"worker completed issue #{number}")
            label_issue(number, remove=LABEL_IN_PROGRESS)
        else:
            log(f"worker FAILED issue #{number} (exit {rc})", error=True)
            label_issue(number, add=LABEL_FAILED, remove=LABEL_IN_PROGRESS)

    for n in done:
        del active[n]

    return freed


# --- main loop ----------------------------------------------------------------

def log(msg: str, error: bool = False):
    dest = sys.stderr if error else sys.stdout
    print(f"[dispatcher] {msg}", file=dest, flush=True)


def main():
    log(f"started — worker={AGENT_CMD}, class={WORKER_CLASS}, poll={POLL_INTERVAL}s")

    while True:
        try:
            reap()

            ready = gh_json(
                "issue", "list",
                "--label", LABEL_AGENT,
                "--label", LABEL_READY,
                "--json", "number,title,body",
                "--limit", "50",
            )

            claimed = get_claimed_subtrees()
            # Also claim subtrees of still-running workers (not yet in GitHub state)
            for w in active.values():
                claimed |= w.subtrees

            for issue in ready:
                number = issue["number"]
                if number in active:
                    continue

                needed = parse_subtrees(issue.get("body") or "")
                if subtrees_conflict(needed, claimed):
                    log(f"issue #{number} queued — subtree conflict")
                    continue

                worker = spawn(issue)
                if worker:
                    active[worker.issue_number] = worker
                    claimed |= worker.subtrees

        except subprocess.CalledProcessError as e:
            log(f"gh error: {e.stderr.strip() if e.stderr else e}", error=True)
        except Exception as e:
            log(f"unexpected error: {e}", error=True)

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
