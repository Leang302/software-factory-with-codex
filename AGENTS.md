# Minimal Multi-Agent Software Factory

These instructions apply to the entire repository. They define a small, evidence-driven software factory for Codex and human collaborators.

## Non-negotiable policies

- Work only below the repository root returned by `git rev-parse --show-toplevel`.
- Use real Codex subagents when delegation tools are available. Role labels in one response are not a substitute for independent agents.
- If delegation is unavailable, run the same stages sequentially, explicitly reset the role context at every handoff, and disclose the limitation in `00-preflight.md` and `05-final.md`.
- A Builder may start only after an implementation-ready specification exists and a human has explicitly approved it. A direct request to implement or demonstrate a narrowly scoped feature counts when the written specification does not expand that scope; record the approval evidence in the run report.
- Put implementation work on a dedicated `factory/<slug>` branch or linked worktree created from the approved baseline. Preserve unrelated user changes.
- Never merge, rebase, push, force-push, tag, publish, release, or deploy automatically.
- Never run a potentially destructive command without explicit human approval for its exact target and purpose. This includes file or branch deletion, `git clean`, `git reset`, history rewriting, destructive database operations, and commands using force flags. Tool availability or sandbox permission is not human approval.
- Prefer repository-local, deterministic tools. Do not add dependencies or make external network calls unless the approved specification requires them.
- Keep factual stage evidence in Markdown under `factory/runs/<run-id>/`. Never invent test results or silently omit failures.

## Required roles and handoffs

The Orchestrator owns coordination but must not impersonate the independent roles when real delegation is available.

1. **Planner (read-only):** inspect the repository and write `01-spec.md` with scope, non-goals, risks, test plan, and numbered acceptance criteria. The Planner does not edit product code.
2. **Approval gate (human):** record approval and the exact approved spec revision before implementation. If approval is absent or ambiguous, stop before creating a Builder branch.
3. **Builder:** create or use the isolated branch/worktree, implement only the approved scope, run focused checks, and write `02-build.md` with changed files, decisions, and commands run.
4. **Reviewer (independent and read-only for product code):** inspect the diff and relevant surrounding code for correctness, maintainability, accessibility where relevant, and security. Write `03-review.md`; give every finding a severity, location, impact, and concrete recommendation.
5. **Tester (independent and read-only for product code):** derive tests from the acceptance criteria, run them, and write `04-test.md` with exact commands, exit codes, failures, and any untested criteria.
6. **Repair loop:** the Orchestrator sends actionable Reviewer and Tester findings to the Builder. The Builder fixes accepted findings on the same isolated branch and updates `02-build.md`. Reviewer and Tester re-check affected areas. Repeat until no blocking finding remains or a human stops the run.
7. **Orchestrator:** write `05-final.md` mapping every acceptance criterion to evidence, list residual risks, name the branch/worktree, and clearly state that no merge or deployment occurred.

Reviewer and Tester may run in parallel after the Builder has produced a stable commit. They must not coordinate conclusions with each other before reporting. A stage result returned in chat must also be persisted by the Orchestrator or the responsible agent.

## Severity and completion rules

- `BLOCKER`: unsafe to hand off or the primary behavior cannot work.
- `HIGH`: acceptance, security, or data-integrity failure that must return to the Builder.
- `MEDIUM`: material defect or maintainability problem; fix or document explicit human acceptance.
- `LOW`: non-blocking improvement.

A run is complete only when all approved acceptance criteria have evidence, all tests and their exit codes are recorded, no unresolved `BLOCKER` or `HIGH` finding remains, and the final report identifies anything not verified. Completion never authorizes a merge or deployment.

## Repository layout

- `factory/workflow.yaml` — compact machine-readable stage and policy manifest.
- `factory/templates/` — reusable Markdown report templates.
- `factory/runs/<run-id>/` — immutable-in-spirit evidence for one run; update corrections transparently.
- Product code and tests live in the locations chosen by the approved specification.

Use the templates as a minimum, not as a reason to omit relevant evidence.
