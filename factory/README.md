# Software Factory Runbook

This repository uses a five-role workflow: Planner, Builder, Reviewer, Tester, and Orchestrator. Codex delegation is preferred when the host exposes real subagent tools; otherwise the same artifacts and gates are produced sequentially with that limitation disclosed.

## Start a run

1. Choose a stable run ID such as `2026-10-15-short-feature-name` and copy the report templates into `factory/runs/<run-id>/`.
2. Have the Planner inspect the repository without changing product code and complete `01-spec.md`.
3. Ask a human to approve the exact specification. Record their approval in the spec; do not infer approval for broadened scope.
4. From a clean approved baseline, create `factory/<feature-name>` or a linked worktree on that branch. Do not disturb unrelated local changes.
5. Delegate implementation to the Builder. When it has a stable commit, independently delegate review and testing.
6. Send actionable findings back to the Builder and repeat the affected checks.
7. Complete `05-final.md`. Leave the feature branch unmerged and undeployed for human inspection.

The canonical safety and role rules are in the repository root `AGENTS.md`. `workflow.yaml` is a concise manifest for tooling and checklists; it does not override `AGENTS.md`.

## Evidence standard

Reports should identify the commit or working tree inspected, exact commands and exit codes, relevant file paths and line numbers, acceptance-criteria IDs, unresolved risks, and any manual check still needed. A passing command is evidence only for the behavior it actually exercises.

## Human controls

Two actions always remain human decisions:

- approving the specification before implementation;
- merging, publishing, or deploying after the run.

Potentially destructive commands require separate, explicit human approval naming the command's purpose and exact target.
