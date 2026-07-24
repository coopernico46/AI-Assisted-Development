# Changelog

All notable changes to the Playwright Scaffold are documented here. Entries are listed in reverse chronological order (newest first).

---

## v2.4.0 -- New `pr-reviewer` Skill + Enforcement Hook Wired + Version Single-Source -- 2026-06-24

**Branch:** `feat/pr-review-new-skill`

### What Changed

Added a new **`pr-reviewer`** skill: reviews a Git branch as a pull request **against this repo's own contract** (the orchestrator Constitution + the routed `.claude/skills/`), not generic best practice. It is a review-only deliverable — fixing and committing are separate, opt-in phases the user must request after seeing the report.

### New Skill -- `pr-reviewer`

- **9-phase workflow.** Phases 1–7 always run (fetch & switch → **three-dot** merge-base diff → route changed paths to applicable skills → verify → review against rules → mandatory Constitution-checklist gate → tiered report + confidence). Phases 8–9 (implement fixes, commit) are gated on explicit user opt-in.
- **Three-dot diff is mandatory.** `master...HEAD` diffs against the merge-base so only the branch's own work is reviewed; two-dot (`master..HEAD`) is called out as a defect because it drags in the base branch's later commits and produces false findings against code the author never wrote.
- **Mechanical Constitution scan -- `scripts/scan-constitution.sh`.** Greps the changed files for the deterministically-detectable WON'T violations (`any`, `z.object(`, `waitForTimeout`, XPath, `@playwright/test` in specs, manual page-object `new`, `@functional`, tags on `describe`, `.json` under `test-data/static`, magic-number timeouts, hardcoded URLs) and lists every `Schema.parse()` call site for manual confirmation. Maps each check to a row in `references/constitution-checklist.md`.
- **Supporting files.** `references/constitution-checklist.md` (30-item mandatory gate derived from the Constitution), `assets/report-template.md` (tiered 🔴/🟠/🟡 + ✅ Good + verdict + confidence + open-questions), `assets/review-prompt.md` (ready-to-paste kick-off).
- **Contract-fidelity hard line.** Runtime API behaviour that disagrees with the documented OpenAPI/Swagger contract is a **bug to report** via `test.skip` + `// FIXME`, never a schema to loosen — any schema-loosening introduced to swallow a runtime surprise is itself flagged 🔴.
- **Env failures ≠ branch defects.** Specs that die for missing runtime tokens are reported verbatim as "could not run — missing env"; tokens are never invented/stubbed to force a green run.

### Cross-Repo / Cross-Platform Robustness

- **Base branch auto-resolved.** Phase 1 reads `origin/HEAD` (`main` or `master`) and only falls back to `master` — no hardcoded main-branch assumption in the workflow. Prose, index rows, checklist, and prompts say "the base branch (auto-resolved — main/master)".
- **Playwright project name discovered, not assumed.** Phase 4 greps `playwright.config.*` for the real project names instead of hardcoding `<area>-chromium`; the scheme varies per repo, with a graceful "run without `--project` and note it" fallback.
- **macOS-safe verification.** Replaced GNU-only `xargs -r` with an explicit `[ -n "$CHANGED" ] && … xargs` guard (BSD/macOS `xargs` has no `-r`).
- **Scan-script hardening.** `g()` helper now filters empty args before its no-files guard (the `"${ARR[@]:-}"` empty-string-arg trap); the `test.describe()` tag regex dropped hardcoded repo-area tags (`Front|Back|Wallet|Kyc`) and keeps only the six canonical Constitution tags.

### Mirrors & Index

- **Claude + Cursor parity.** Skill lives at `.claude/skills/pr-reviewer/` and `.cursor/skills/pr-reviewer/` (paths rewritten `.claude/` → `.cursor/` and `CLAUDE.md` → `.cursor/rules/rules.mdc` per the mirror convention). Indexed in both `CLAUDE.md` and `.cursor/rules/rules.mdc` skills tables.
- **Copilot.** Exposed as a `/pr-reviewer` prompt file at `.github/prompts/pr-reviewer.prompt.md` (Copilot has no on-demand `references/` loading, so a full `.github/instructions/` skill mirror was deferred).
- **README.** Added to the Skills Index and to the `.claude/` + `.cursor/` directory trees.

### Constitution Enforcement Hook -- Now Wired

The deterministic enforcement hook shipped dormant in v2.3 (the script existed but registration was left as "a separate step"). This release wires it.

- **New `.claude/settings.json`** (committed, shared) registers `.claude/scripts/enforce_constitution.py` as a Claude Code `PreToolUse` hook with matcher `Write|Edit|MultiEdit`. The hook is no longer dead code -- mechanical WON'T violations are now blocked before the file is written, not just discouraged in prose.
- **Verified** end-to-end against the hook contract (stdin JSON → exit 0 allow / exit 2 block): a `waitForTimeout` spec and a `z.object` schema are blocked with the rule message fed back to the agent; clean specs, non-target files (e.g. `README.md`), and malformed payloads all pass. The hook never blocks on its own infrastructure errors.
- `.claude/settings.local.json` is unchanged -- it keeps the personal status-line config; the enforcement hook lives in the shared `settings.json` so it applies to everyone who clones the repo.

### Version Single-Source

Replaced the silent drift between `package.json` (was stuck at `1.0.0`) and the CHANGELOG with one source of truth.

- **New `VERSION` file** -- the single source of truth for the product version.
- **New `scripts/stamp-version.sh`** -- writes `VERSION` into `package.json`'s `version` field via a precise line-replace (no JSON reflow diff). Optional `<x.y.z>` arg sets `VERSION` first; rejects non-semver input. Wired as `npm run version:stamp`.
- **New `scripts/check-version-drift.sh`** -- asserts `VERSION` == `package.json` version == the latest `## v<x.y.z>` CHANGELOG heading; exits non-zero on any mismatch. Wired as `npm run check:version`.
- **Fixed real drift:** `package.json` version corrected `1.0.0 → 2.4.0` (stamped from `VERSION`).
- **Gated in two places:** `.husky/pre-commit` runs `check:version` whenever `VERSION`, `package.json`, or `CHANGELOG.md` is staged; a new `version-lint` job in `.github/workflows/skill-lint.yml` runs it in CI (the workflow's path triggers now include the three version surfaces).

### Files Changed

New: `.claude/skills/pr-reviewer/` (SKILL.md + references/constitution-checklist.md + assets/report-template.md + assets/review-prompt.md + scripts/scan-constitution.sh), its `.cursor/skills/pr-reviewer/` mirror, and `.github/prompts/pr-reviewer.prompt.md`; plus `.claude/settings.json`, `VERSION`, `scripts/stamp-version.sh`, `scripts/check-version-drift.sh`. Edited: `CLAUDE.md`, `.cursor/rules/rules.mdc`, `README.md`, `CHANGELOG.md`, `package.json` (version `1.0.0 → 2.4.0`, `+version:stamp`, `+check:version`), `.husky/pre-commit` (version gate), `.github/workflows/skill-lint.yml` (`version-lint` job + version path triggers). **Verified:** scan script `bash -n` clean and runs from both `.claude` and `.cursor` paths; enforcement hook blocks/allows correctly across five payload cases; `stamp-version.sh` arg + bad-arg paths work; `check-version-drift.sh` reports OK when aligned and exit 1 on mismatch; `check:skills-drift` still green; `settings.json` is valid JSON; zero residual `.claude/` or `CLAUDE.md` refs in the cursor mirror.

---

## v2.3.0 -- Constitution Enforcement Layer + `@destructive` Narrowed to Shared/Global State -- 2026-06-15

**Branch:** `feat/skills-v2.3-minor-improvements`

### What Changed

The Constitution gained a **deterministic enforcement layer** so prompt-only rules now have a mechanical backstop, and the `@destructive` tag policy was **narrowed to shared/global state** with the cleanup obligation decoupled from the tag.

### Constitution Enforcement (deterministic layer)

- **PreToolUse hook -- `.claude/scripts/enforce_constitution.py`.** Blocks writes that violate mechanically-checkable WON'T rules: hard waits (`waitForTimeout`), `z.object` in schemas, XPath, `@playwright/test` imports in spec files, JSON static data, the `@functional` tag, and tags on `test.describe()`. Not yet wired -- registering it in `.claude/settings.json` is a separate step.
- **New crossref linter -- `scripts/check-skill-crossrefs.sh` + `.github/workflows/skill-lint.yml`.** Closes the lint gap (Skills Index ↔ disk sync, frontmatter validity, dangling skill-name refs) and gates **all three** drift linters in CI, fulfilling the linter promise in `three-layer-model.md`.
- **`skill-creator` routed.** Added to the `ai-native-workflow` routing matrix; it was indexed in `CLAUDE.md` but previously unreachable from the router.
- **Phase 4 confidence thresholds single-sourced.** The Critical block and `conversation-contract.md` now link to the canonical section instead of restating it (drift risk removed).

### `@destructive` Tag Narrowed to Shared/Global State

- **Tag reserved for shared/global state** -- state other tests, users, or sessions depend on (locale, permissions, roles, guest access, feature flags, global settings). A test that creates and cleans up **only its own isolated data** is no longer destructive; it keeps its importance tag (`@smoke`/`@regression`/`@api`/…) and runs in the parallel suite.
- **Cleanup decoupled from the tag.** The Constitution row **Destructive Cleanup** → **State Cleanup** now requires `afterEach`/`afterAll` revert hooks on **any** state-mutating test -- both `@destructive` shared-state tests and isolated own-data tests.
- **Applied across all four rule trees** (`CLAUDE.md`, `.cursor/rules/rules.mdc`, `.github/copilot-instructions.md`, plus `test-standards` / `common-tasks` / `ai-native-workflow` in `.claude/`, `.cursor/`, `.github/instructions/`), the `README.md` tag reference, and the `AI-WORKFLOWS.md` guardrails table. `test-standards` Phase 7 gained a shared-state definition list and a NOT-destructive isolated-CRUD counter-example; the `common-tasks` worked example was retargeted from create+delete-user to a genuine locale-switch case.

### Files Changed

Two commits: `feat(orchestration): add enforcement hook, crossref linter, CI gate` (7 files -- new `enforce_constitution.py`, `check-skill-crossrefs.sh`, `skill-lint.yml`, plus routing/threshold edits) and `docs(constitution): narrow @destructive to shared/global state only` (16 files across the four rule trees, README, and AI-WORKFLOWS). **Verified:** `rules-drift`, `refs-drift`, and `crossrefs` linters all report 0 drift; the `@destructive` anchor token is retained in the `test-standards` Critical block.

---

## v2.2.0 -- Anthropic Frontmatter Compliance, Per-Theme Templates, Playwright 1.60, Workflow Playbook -- 2026-05-30

**Branch:** `v2.2.0-orchestration-hardening`

### What Changed

Three skill descriptions and one large reference file were brought into line with Anthropic's _Building Skills for Claude_ spec, the `common-tasks` prompt-template library was split for finer progressive disclosure, Playwright was bumped to 1.60.0 across the package and the dev container, and a new root-level `AI-WORKFLOWS.md` playbook documents the exact step sequence for every common task flow. All skill edits are mirrored across `.claude/` and `.cursor/`; the `.github/` Copilot mirror uses `applyTo:` frontmatter (no `name` / `description`) and is unaffected by the frontmatter fixes.

### Anthropic Skill-Spec Compliance

- **`debugging` description trimmed** 1079 → 828 characters, under Anthropic's **1024-char frontmatter limit**. The two cross-skill pointers removed from the `description` already live in the skill body's `See Also` section, so no information was lost.
- **`selectors` frontmatter `>` removed.** The locator priority chain in the `description` (`getByRole > getByLabel > ...`) was rewritten with `then` (`getByRole then getByLabel then ...`) — Anthropic forbids angle brackets (`<` / `>`) in skill frontmatter. The body keeps the `>` chain (valid in Markdown).

### Progressive Disclosure -- `common-tasks` Templates Split

- The monolithic 343-line `common-tasks/references/templates.md` was replaced by **six per-theme files** under `references/templates/`: `page-objects.md`, `tests.md`, `api-schemas.md`, `data.md`, `fixtures.md`, `components.md`.
- `common-tasks/SKILL.md` dropped from **441 → 109 lines**: the inline template block became a linked index, and Phase 2 now points at the per-theme file for the task at hand.
- Net effect: the agent loads only the relevant theme (~15–90 lines) at execution time instead of all 343 lines of templates — finer-grained L3 disclosure.
- Applied to `.claude/` and `.cursor/`. The `.github/` Copilot mirror keeps templates inline on purpose (Copilot has no on-demand `references/` loading, so slimming it would hide the templates).

### Tooling / Dependencies

- **`@playwright/test`** bumped `^1.59.1 → ^1.60.0`; **`@playwright/cli`** bumped `^0.1.11 → ^0.1.13` (`package-lock.json` updated).
- **Dev container `PLAYWRIGHT_VERSION` 1.58.1 → 1.60.0** in `.devcontainer/Dockerfile` and `.devcontainer/devcontainer.json`, realigning the pre-built base image (`mcr.microsoft.com/playwright:v1.60.0-noble`) with `@playwright/test`. The image tag was previously behind the package version.

### New: `AI-WORKFLOWS.md`

A root-level, table-driven workflow playbook that keeps AI-assisted execution drift-free. Covers the 8-phase universal spine, the confidence gate, the intent → skill routing table, **12 task flows** (API suite for a controller, functional tests from a ticket, E2E suite, debug, page object, Zod schema, factories / static data, fixtures, refactor enum / static, add enum, add config, add helper / component), an anti-drift guardrails table, and a command cheat-sheet. Every step cites its owning `skill · phase`, so the doc is a **map**, not a competing rulebook — if it ever disagrees with a skill, the skill wins.

### Files Changed

One commit (`Align AI skills with Anthropic skill spec and bump Playwright to 1.60.0`) plus the new `AI-WORKFLOWS.md`. Net: 3 skills edited across the `.claude/` + `.cursor/` mirrors (`debugging`, `selectors`, `common-tasks`); 12 new per-theme template files; the monolithic `templates.md` removed in both trees; `package.json` + `package-lock.json` + `.devcontainer/Dockerfile` + `.devcontainer/devcontainer.json` bumped. **Verified:** `npm run check:skills-references` and `npm run check:skills-drift` report 0 drift; ESLint + Prettier clean.

### Migration Notes

- **Rebuild the dev container** to pick up the new base image and dependencies (`Dev Containers: Rebuild Container`).
- **The old template file is gone.** `common-tasks/references/templates.md` was removed; templates now live at `common-tasks/references/templates/<theme>.md`, linked from the skill's `## Prompt Templates` index.
- **No code changes** required in tests, page objects, fixtures, or schemas — this is a documentation + dependency release.

---

## v2.1.0 -- Orchestrator Hardening, Self-Contained Trees, Drift Lints -- 2026-05-02

**Branch:** `refactor/skills-workflow-confidence-gate`

### What Changed

The `ai-native-workflow` skill is now the sole entry-point router for non-trivial work and ships with a mandatory **confidence gate** (1-10 + Rationale + Unknowns) and a strict `< 5 → ASK` rule that forbids agents from emitting plausible-looking plans built on guesses. Every leaf skill was slimmed and pushed examples / troubleshooting into per-skill `references/` to keep the always-loaded surface small. The three rule trees (`.claude/`, `.cursor/`, `.github/instructions/`) are now **self-contained** -- no cross-tree references -- and `playwright-cli` + `skill-creator` are reinstalled fresh from the upstream Anthropic packages, tracked via `skills-lock.json` for reproducible reinstalls. Two CI-gated drift lints were added.

### New / Restructured

- **`ai-native-workflow` is the orchestrator.** Sole entry-point router; CLAUDE.md and `.cursor/rules/rules.mdc` collapse their old inline AI workflow and point at the skill instead. Owns the 8-phase main lifecycle (classify → route → explore → plan+confidence → human gate → apply → verify → report), the routing matrix, the conversation contract, and the confidence-gate format.
- **Confidence gate (Phase 4) is mandatory.** Every Plan output before the human gate must include `Confidence: <1-10>`, `Rationale`, `Unknowns`. **`< 5` is forbidden** -- the agent must return to Phase 3 and ASK the user for the missing primary input (URL, OpenAPI link, area folder, field list) instead of emitting a low-confidence proposal.
- **Direct Mode now verifies the user's premise.** Even one-line typo fixes must confirm the reported defect actually exists in the cited file. If the premise doesn't match, the agent stops and asks instead of inventing a "fix" for a defect that isn't there.
- **`Refuse placeholders` rule extended.** `TODO` / `skeleton` / "to fill in later" outputs explicitly count as placeholders -- offering a "skeleton page object with TODO locators while we wait for `playwright-cli`" is the same failure mode as inventing locators outright.

### Skill Slimming + `references/` Migration

Every leaf skill's `SKILL.md` was trimmed to Critical + decision tables; deep examples and troubleshooting moved into `references/*.md` under each skill. Net effect: smaller hot context, deeper material loaded only when needed.

| Skill                  | SKILL.md change                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **api-testing**        | -382 lines → references: `examples`, `helper-fixture-example`, `negative-testing`, `test-step-patterns`, `troubleshooting` |
| **page-objects**       | -98 lines → references: `examples`, `troubleshooting`                                                                      |
| **selectors**          | -155 lines → references: `examples`, `feedback-selectors-example`, `troubleshooting`                                       |
| **type-safety**        | -154 lines → references: `examples`, `troubleshooting`                                                                     |
| **debugging**          | -98 lines → references: `examples`, `troubleshooting`                                                                      |
| **test-standards**     | refactored → references: `examples`, `troubleshooting`                                                                     |
| **data-strategy**      | refactored → references: `examples`, `troubleshooting`                                                                     |
| **fixtures**           | refactored → references: `examples`, `troubleshooting`                                                                     |
| **refactor-values**    | refactored → references: `examples`, `troubleshooting`                                                                     |
| **common-tasks**       | refactored → references: `examples`, `troubleshooting`                                                                     |
| **ai-native-workflow** | -239 lines → references: `conversation-contract`, `examples`, `principles`, `three-layer-model`, `troubleshooting`         |

### Self-Contained Rule Trees

`.claude/`, `.cursor/`, and `.github/instructions/` no longer cross-reference each other. A Claude Code user reading `.claude/` + `CLAUDE.md` never sees mention of `.cursor/`, `.github/instructions/`, Cursor, or Copilot. A Cursor user reading `.cursor/` + `.cursor/rules/rules.mdc` never sees mention of `.claude/`, `CLAUDE.md`, Claude Code, or Anthropic-platform terminology. A Copilot user reading `.github/instructions/` never sees mention of `.claude/` / `.cursor/` paths. Each tree stands alone.

The `.cursor/rules/rules.mdc` orchestrator file stays the Cursor-native equivalent of `CLAUDE.md` (`alwaysApply: true`).

### Out-of-the-Box Skills

`playwright-cli` and `skill-creator` are now reinstalled fresh from the upstream Anthropic packages on every invocation rather than tracked as scaffold-authored copies:

- `skills-lock.json` records the upstream source, path, and computed hash for reproducible reinstalls.
- The previous scaffold-specific `playwright-cli` SKILL.md (with its own `## Critical` block) was retired; the upstream version is loaded as-is. The `Explore Before Generate` MUST in `CLAUDE.md` still mandates `playwright-cli` as the only sanctioned UI explorer, so enforcement survives at the Constitution layer even though the skill itself no longer carries scaffold-shaped Critical bullets.
- The `playwright-cli :: Exclusive UI explorer` rule was removed from `scripts/check-rules-drift.sh` for the same reason.

### Drift Lints

Two CI-gated lints, fired from `.husky/pre-commit` whenever files in any of the four rule trees are staged (`.claude/skills/`, `.cursor/skills/`, `.github/instructions/`, `.github/skills/`):

- **`npm run check:skills-drift`** -- existing Constitution-vs-leaf-Critical anchor lint, refreshed (19 rules, was 20 -- `playwright-cli :: Exclusive UI explorer` retired). Scans `.claude/skills/` only.
- **`npm run check:skills-references`** -- catches three drift modes between each SKILL.md (or `*.instructions.md`) and its `references/` siblings: broken pointer (missing reference file), orphan reference (file exists but no SKILL.md link), broken anchor (`#section` link with no matching `## heading`). Walks all three rule trees plus `.github/skills/`; folder-form (`<root>/<name>/SKILL.md`) and Copilot's flat-form (`<root>/<name>.instructions.md` paired with optional sibling `<name>/references/`) are both supported. Currently 49 skill entries × 135 reference links, 0 drift.

### Upstream Skill Sync

`skills-lock.json` now tracks both lock-managed skills explicitly with `sourceType` (`github` for `skill-creator` from `anthropics/skills`, `npm` for `playwright-cli` bundled with `@playwright/cli`), `ref` (defaults to `main`), `skillPath`, and the SHA-256 `computedHash` of the locally vendored copy. `scripts/sync-upstream-skills.sh` consumes the lock; three modes wired as npm scripts:

- **`npm run skills:verify`** -- re-hash local files and compare against lock; exits non-zero on drift. Useful as a CI guard.
- **`npm run skills:reinstall`** -- fetch upstream (raw GitHub or `node_modules/<source>/<skillPath>`), overwrite `.claude/skills/<name>/SKILL.md` and `.cursor/skills/<name>/SKILL.md`, refresh the lock. Copilot's `.github/instructions/<name>.instructions.md` is intentionally not touched -- it carries Copilot-specific frontmatter and is hand-maintained per the v2.1 self-contained-trees policy.
- **`npm run skills:update`** -- re-hash local files and write new hashes back into the lock. Use after intentional local edits to a vendored skill (e.g. tuning the description for trigger accuracy) so subsequent `verify` runs pass.

### Orchestration Eval

A 7-prompt orchestration eval suite was authored under `.claude/skills/ai-native-workflow/evals/evals.json` covering codegen-with-complete-info, codegen-with-missing-area, codegen-with-missing-source, refactor-cascading-rename, debug-flaky-test, ui-explore-with-no-cli, and direct-mode-trivial. Iteration-1 vs main-branch baseline showed `<5 → ASK` and `Refuse placeholders (incl. TODO)` close two real failure modes; iteration-2 closes a Direct Mode regression. Final iteration-2 score: 35/35 = 100%. The eval prompts ship in the repo so the evaluation can be re-run.

### Tooling

- **`@playwright/cli`** bumped 0.1.8 → 0.1.11. `@playwright/test` already on the latest stable 1.59.1 (1.60 is alpha-only). `npm audit fix` cleared 6 transitive ReDoS advisories (minimatch / picomatch / yaml) without moving any playwright version.
- **`.prettierignore` added.** Excludes the upstream-tracked vendored skills (`skill-creator/` + `playwright-cli/` across all three trees) plus build artifacts, the npm lockfile, and skill-creator's static eval-viewer assets. Without this, `npm run format` would mutate the vendored SKILL.md files and break `npm run skills:verify` (lock-tracked hash drift).
- **`<!-- prettier-ignore -->` markers** placed above the MUST / SHOULD / WON'T / File Naming Conventions / Skills Index tables in `CLAUDE.md`, `.cursor/rules/rules.mdc`, and `.github/copilot-instructions.md`. Without them, Prettier widens every column to the longest cell -- and the `Explore Before Generate` row's content runs ~1500 chars, producing unreadable raw markdown. The markers preserve the compact column widths while still letting the rest of each file be Prettier-managed.
- **No more mirror-sync script.** `scripts/sync-skill-mirrors.sh` was removed. Mirrors are now hand-maintained per tree -- any PR that changes `.claude/skills/` or `CLAUDE.md` must hand-update the matching `.cursor/skills/` files and `.github/instructions/*.instructions.md` files in the same PR. The references-drift lint walks all three trees, so reference / orphan / anchor drift across mirrors is caught at commit time.
- **New: `scripts/sync-upstream-skills.sh`** -- different beast from the removed mirror-sync. Manages only the lock-tracked vendored skills (`skill-creator`, `playwright-cli`) by re-fetching from upstream and refreshing `skills-lock.json`. See "Upstream Skill Sync" above.

### Files Changed

39 commits on `refactor/skills-workflow-confidence-gate`. Net: 14 leaf skills slimmed + reorganised under `references/`; orchestrator restructured; `CLAUDE.md` / `.cursor/rules/rules.mdc` / `.github/copilot-instructions.md` AI Workflow sections collapsed to a 1-paragraph pointer at each tree's `ai-native-workflow` skill; rule-tree mirrors decoupled and rewritten; drift-lint scripts (`check-rules-drift.sh`, `check-skill-references-drift.sh`) + npm scripts + husky hook added; references-drift lint extended to walk all three rule trees plus `.github/skills/`; sync script removed; `playwright-cli` + `skill-creator` reinstalled from upstream and tracked via `scripts/sync-upstream-skills.sh` + `skills-lock.json`; `<!-- prettier-ignore -->` markers added above the Constitution / File-Naming / Skills-Index tables in all three orchestrators so future `prettier --write` runs do not re-widen them; `.prettierignore` added to exclude lock-tracked vendored skills (`skill-creator/` and `playwright-cli/` in all trees) so reformatting cannot drift their hashes.

### Migration Notes

- **No code changes required in tests / page objects / fixtures.** The Constitution's MUST/SHOULD/WON'T tables are unchanged; rule slimming is a documentation refactor, not a behavioural one.
- **PR workflow change.** When editing a rule, edit it in three places now (canonical + two mirrors). `check-rules-drift` still scans `.claude/skills/` only (so missing-anchor coverage is canonical-tree-bound), but `check-skills-references` walks all three rule trees, so broken references / orphaned reference files / broken anchors in any mirror will fail the gate. The husky pre-commit fires on changes to any of the four rule trees (`.claude/skills/`, `.cursor/skills/`, `.github/instructions/`, `.github/skills/`).
- **`playwright-cli` skill behaviour.** The upstream skill replaces the scaffold's previous version. Some scaffold-specific guidance (e.g. the dedicated `## Mandatory` block listing forbidden substitute tools) now lives only in `CLAUDE.md` / `.cursor/rules/rules.mdc` -- if you have downstream prompts that reference `.claude/skills/playwright-cli/SKILL.md` for those rules, redirect them to the Constitution.
- **Pre-merge snapshot of the v2.0 skill suite.** The state of `main` immediately before the v2.1.0 merge is preserved on the branch `archive/skills-v2.0-used-to-workshop-2026-04-29` so the v2.0 skill suite (the version used during the 2026-04-29 workshop) can be checked out as-is for comparison or rollback. Use `git checkout archive/skills-v2.0-used-to-workshop-2026-04-29` to inspect, or `git diff archive/skills-v2.0-used-to-workshop-2026-04-29..main` to review the full v2.0 → v2.1 delta.

---

## v2.0.0 -- Skill Suite Refresh, Single-Tag Rule, TypeScript Static Data, Playwright 1.59 -- 2026-04-18

**Branch:** `refine-skills-with-opus-4.7` (18 commits)

### What Changed

The entire skill suite was refactored to follow the Anthropic _Building Skills for Claude_ progressive-disclosure pattern. Every skill now has a **Critical** block (non-negotiables), phased **Instructions**, scenario-based **Examples**, **Troubleshooting**, and **See Also** sections. Two new skills (`debugging`, `ai-native-workflow`) join the suite. Static test data migrated from JSON to TypeScript with `as const` exports. The combined-tag rule is replaced with a single-tag rule where `@destructive` is the heaviest tag. Playwright upgraded to 1.59.1 with new agent-native debugging tools surfaced. All changes mirrored across `.claude/`, `.cursor/`, and `.github/`. A commercial metadata block was added to all 14 skills × 3 mirrors.

### New Skills

- **`debugging`** -- Canonical entry point for after a test breaks. Covers the scaffold's actual `playwright.config.ts` capture defaults (trace `on-first-retry`, screenshot `only-on-failure`, video `retain-on-failure`), the failure-mode taxonomy (TimeoutError / ZodError / strict-mode violation / network errors / passes-alone-fails-in-suite / etc.), 7 phases (read failure, classify, reproduce, investigate with the right tool, fix at root cause, re-run for stability, CI-only failure replay), 4 examples and 8 troubleshooting entries.
- **`ai-native-workflow`** -- Meta-skill that ties the suite together. Covers the three-layer model (orchestrator / specialized skills / code conventions), the human↔agent conversation contract (audit-then-edit, when to ask vs do, when to refuse), a 12-row skill-routing matrix, the standard 7-phase task lifecycle, and the five engineering principles that make the scaffold AI-native.

### All 12 Existing Skills Refined

Every skill received the same restructure: rich `description` with explicit triggers and disambiguation, `## Critical` block of non-negotiables, `## Instructions` with numbered phases, `## Examples` with named scenarios, `## Troubleshooting`, `## See Also`. Major content additions per skill:

| Skill               | Key changes                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **api-testing**     | 8 phases (Phase 1 contract-source, Phase 4 `test.step` for >1 call, Phase 5 status-code matrix, Phase 6 three-tier negative testing, Phase 7 behaviour-mismatch protocol, Phase 8 helper-fixture promotion). Mandatory `expect(SchemaName.parse(body)).toBeTruthy();` codified in Critical.                            |
| **common-tasks**    | 7 phases (identify task → discover paths → select template → load specialized skill → apply Critical → verify → run tests). Critical block consolidated from the legacy "Common Mistakes" + "Verification Checklist".                                                                                                  |
| **config**          | 5 phases including the missing dotenv + `ENVIRONMENT` loading mechanism. Decision table that disambiguates `config/` from `enums/`, `playwright.config.ts`, and shell-only env vars.                                                                                                                                   |
| **data-strategy**   | 5 phases. Three-tier static data rule (universal `static/util/`, domain-specific `static/{area}/`, field-specific inline). TS-only policy. Two canonical Tier-2 shapes (per-field arrays vs test-case objects). Replaced the dangling `Timeouts` import example with web-first assertion guidance.                     |
| **enums**           | 6 phases. Decision table preventing overlap with `config/` and `test-data/static/`. PascalCase / SCREAMING_SNAKE_CASE counterexample table. Mandatory `playwright-cli` verification of UI text.                                                                                                                        |
| **fixtures**        | 6 phases. Decision table separating fixtures from plain helpers (`helpers/`). Built-in Fixtures table preserved. Counterexample showing when NOT to create a fixture.                                                                                                                                                  |
| **helpers**         | 6 phases. Corrected the helper-vs-fixture criterion to "no fixture lifecycle needed". Treats the scaffold's auth helpers (`createAppStorageState`, `setUserAccessToken`) as demo code rather than canonical features.                                                                                                  |
| **page-objects**    | 6 phases. Mandatory `playwright-cli` exploration codified. Three locator sections required for forms/CRUD. JSDoc rules: forbidden on locators, required on actions. Fixed wrong "stale-reference" rationale for `get` accessors -- it's style/readability/consistency, not correctness (Playwright `Locator` is lazy). |
| **refactor-values** | Promoted to formal Critical / Phases / Examples / Troubleshooting. Added the new rule against loosening `z.literal` / `z.enum` to mask drift (Anti-Pattern 4).                                                                                                                                                         |
| **selectors**       | 4 phases for the exploration-first workflow. Counterexample table fixing illustrative-only enum names. Same `Locator`-is-lazy correction as page-objects.                                                                                                                                                              |
| **test-standards**  | 9 phases. Single-tag rule with `@destructive` wins replaces the old combined-tag framing. Data-driven example migrated to TS named import (`INVALID_LOGIN_ATTEMPTS`).                                                                                                                                                  |
| **type-safety**     | 6 phases. New Critical rules: no `as T` / `as unknown as T` casts (parse instead), mandatory `expect(Schema.parse(body)).toBeTruthy();`, `createApiResponseSchema` envelope helper. Concrete `zInput` vs `zOutput` example.                                                                                            |

### Breaking Changes

- **Single-tag rule** -- Each test now has exactly **one** tag from `@smoke` | `@sanity` | `@regression` | `@e2e` | `@api` | `@destructive`. **`@destructive` is the heaviest tag and always wins** -- a state-mutating test that would otherwise be `@smoke` is tagged **only** `@destructive`. Combining tags (`['@smoke', '@destructive']`) is forbidden. Practical impact: a previously-combined `['@smoke', '@destructive']` test now runs **only** under `npm run test:destructive`, not under `npm run test:smoke`. `package.json` scripts are unchanged.
- **Static data is TypeScript only** -- All files under `test-data/static/**` are now `.ts` files exporting `as const` literal values. `test-data/static/app/invalidCredentials.json` migrated to `invalidCredentials.ts` with three named exports (`INVALID_EMAILS`, `INVALID_PASSWORDS`, `INVALID_LOGIN_ATTEMPTS`). The two consumer specs (`tests/app/{functional,api}/login.spec.ts`) updated to the named import. New supporting file: `test-data/static/util/invalid-values.ts` with seven universal type-mismatch tuples (`INVALID_STRING_VALUES`, `INVALID_NUMBER_VALUES`, etc.). Rationale: JSON cannot represent `undefined`, has no comments, no type safety, no narrow literal autocomplete -- TS-only future-proofs the scaffold against the same gap that triggered the migration.
- **Mandatory API response assertion pattern** -- The exact pattern `expect(SchemaName.parse(body)).toBeTruthy();` is now enforced across `api-testing`, `helpers`, `type-safety`, `test-standards`, and `common-tasks` Critical blocks. A bare `Schema.parse(body)` (no assertion wrap) or a type-generic-only API call is no longer sufficient.
- **Documentation-first API contract sourcing** -- For API tests, OpenAPI / Swagger documentation is now the source of truth. Live HTTP exploration is the **fallback** for undocumented endpoints only. Runtime mismatches against the documented contract are bugs to report via `test.skip` + `// FIXME: <ticket-url>`, never schema-loosening.

### New Constitutional Rules

Added to every orchestrator (`CLAUDE.md`, `.cursor/rules/rules.mdc`, `.github/copilot-instructions.md`):

- **MUST -- Response Validation** -- `expect(SchemaName.parse(body)).toBeTruthy();` on every API response.
- **MUST -- Sources of Truth** -- URLs and credentials from `process.env.*` (declared in `env/.env.example`); endpoint paths, route constants, UI message strings, storage-state paths from `enums/{area}/*` and `enums/util/*`. Never hardcode.
- **MUST -- Data Strategy** (enriched) -- Universal invalid arrays in `test-data/static/util/invalid-values.ts`; domain-specific curated sets in `test-data/static/{area}/*.ts`; dynamic happy-path data in `test-data/factories/{area}/`.
- **MUST -- Explore Before Generate** (reframed) -- API: documentation-first, exploration as fallback. UI: `playwright-cli` only (existing rule preserved).
- **WON'T -- No JSON Static Data** -- Files under `test-data/static/**` must be `.ts` with `as const` exports.
- **WON'T -- No Multiple Tags** (rewritten) -- Single tag from six valid options; `@destructive` is the heaviest tag and always wins.

### Cross-Tool Mirror Sync

- **`.claude/skills/` is now the canonical source.** The `.cursor/skills/` and `.github/instructions/` mirrors are synchronized but may lag behind a recent skill refactor. All three orchestrators carry an explicit "canonical source" note.
- **`.cursor/skills/`** -- All 14 skill SKILL.md files synced (12 refined + 2 new); paths swapped `.claude/` → `.cursor/`. Orchestrator (`.cursor/rules/rules.mdc`) carries every constitutional change.
- **`.github/instructions/`** -- All 14 `.instructions.md` files rebuilt from the `.claude` SKILL.md sources (frontmatter swap: `name`/`description` dropped, `applyTo:` glob preserved or added). New skills get `applyTo: "tests/**/*.ts"` (debugging) and `applyTo: "**/*"` (ai-native-workflow). Bonus fix: `refactor-values` `applyTo:` migrated from `test-data/static/**/*.json` to `**/*.ts`. Orchestrator (`.github/copilot-instructions.md`) carries every constitutional change.

### Playwright Upgraded to 1.59.1

- **`@playwright/test`** 1.58.1 → 1.59.1 (one minor); **`@playwright/cli`** 0.1.1 → 0.1.8 (seven patches). Chromium 147.0.7727.15 (matching `@playwright/test`) and 147.0.7727.49 (matching `@playwright/cli`'s bundled Playwright 1.60.0-alpha) installed for both browser caches.
- **`scripts/install-playwright-cli-browsers.{js,sh}`** fix -- Both scripts hardcoded the path `node_modules/@playwright/cli/node_modules/playwright` and silently skipped when newer npm hoisted the bundled `playwright` to the top-level `node_modules/playwright/`. Both now resolve via two-stage lookup: prefer the nested copy, fall back to the hoisted top-level only if its version matches what `@playwright/cli` declares as its `dependencies.playwright`.
- **`debugging` skill** documents the new agent-native tools introduced in 1.59:
    - `npx playwright trace open <path>` -- CLI Trace inspector with `actions` / `action <id>` / `snapshot <id>` / `requests` / `console` / `errors` / `screenshot` / `close` subcommands. Best for agent-driven post-mortem in headless / CI / SSH contexts.
    - `npx playwright test --debug=cli` -- CLI debugger that pairs with `playwright-cli attach <session-id>` for agentic step-over.
- Verification: `npx tsc --noEmit` clean, `npm run lint` clean, `npx playwright test --list` parses all 19 tests.

### Commercial Metadata Added

A 7-field metadata block was added to every refined and new skill (14 skills × 3 mirrors = 42 files):

```yaml
metadata:
    author: Ivan Davidov
    version: 2.0.0
    repository: https://github.com/Agentic-QE/Playwright-Scaffold-AI-Assisted-Development
    support: https://www.linkedin.com/in/ivdavidov
    purchase: https://buymeacoffee.com/idavidov/e/513835
    copyright: '© 2026 Ivan Davidov. All rights reserved.'
    last-updated: 2026-04-18
```

Skipped: `playwright-cli` (external Playwright tool) and `skill-creator` (out of scope for this pass).

### Files Changed

- 14 `.claude/skills/<name>/SKILL.md` (12 refined + 2 created)
- 14 `.cursor/skills/<name>/SKILL.md` (12 refreshed + 2 created)
- 14 `.github/instructions/<name>.instructions.md` (12 refreshed + 2 created)
- 3 orchestrators: `CLAUDE.md`, `.cursor/rules/rules.mdc`, `.github/copilot-instructions.md`
- `test-data/static/util/invalid-values.ts` (new)
- `test-data/static/app/invalidCredentials.ts` (new; replaces `.json`)
- `tests/app/functional/login.spec.ts`, `tests/app/api/login.spec.ts` (import migrations)
- `package.json`, `package-lock.json` (Playwright upgrade)
- `scripts/install-playwright-cli-browsers.{js,sh}` (hoisted-path fix)

### Why

The pre-2.0 skill suite covered authoring well but had three structural gaps: skills were inconsistent in shape (some had Critical sections, some didn't), the combined-tag rule produced subtle test-runner double-execution bugs, and JSON static data hit a hard wall the moment we needed `undefined` in a value list. The refresh closes all three. The two new skills (`debugging`, `ai-native-workflow`) cover the gaps the original suite never addressed: what to do _after_ a test breaks, and how a human and an AI agent should actually collaborate on this scaffold. The Playwright 1.59 upgrade lands new agent-native tooling (`npx playwright trace`, `--debug=cli`) that aligns directly with the new `debugging` skill. The commercial metadata block formalizes the paid-access offering at the file level so attribution and purchase URL ship with every skill load.

---

## Strengthen API Test Coverage Rules -- 2026-03-23

**PR:** [#16](../../pull/16) `Strengthen API test coverage rules with coverage-plan step`

### What Changed

Expanded API testing rules to require complete status-code coverage driven by the OpenAPI spec. Added a mandatory coverage-plan step to the AI workflow, new WON'T rule against silently dropping tests, and detailed guidance for behavior mismatches and path parameter validation.

### New WON'T Rule

- **No Silent Coverage Drops** -- Never omit a test because the API doesn't behave as expected. Use `test.skip` with `// FIXME` comment instead. Every status code in the OpenAPI spec must have a test.

### Orchestrator Rules Updated

- **`CLAUDE.md`**, **`.cursor/rules/rules.mdc`**, **`.github/copilot-instructions.md`**:
    - Added "No Silent Coverage Drops" to the WON'T table
    - Inserted new AI Workflow step 3: "Build Coverage Plan (API tests)" -- enumerate every status code from the OpenAPI spec before writing test code

### Skills Updated

| Skill / Instruction                                   | Key Changes                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **api-testing** (`.claude/`, `.cursor/`, `.github/`)  | Expanded coverage matrix with 204, 405, 409, 422, and invalid path parameter rows. Changed 400 to 400/422. Updated 401/403 assertion guidance. Added "Behavior Mismatch Protocol" section (5 rules for handling spec vs reality discrepancies). Added "Path Parameter Validation" section with data-driven loop example. |
| **common-tasks** (`.claude/`, `.cursor/`, `.github/`) | Added "FIRST: Build a coverage plan" to API test prompt template. Added 4 new requirements (path params, auth matrix, 405, behavior mismatches). Added 5 new verification checklist items (coverage audit, path parameter tests, 405 tests, auth matrix, behavior mismatches).                                           |

### Documentation

- **README.md** -- Added "No Silent Coverage Drops" to the WON'T table in Core Principles

### Why

API test generation was producing incomplete coverage -- agents would test only the happy path and a few obvious error codes, silently skipping status codes they couldn't easily reproduce. The coverage-plan step forces explicit enumeration before code generation, and the behavior mismatch protocol ensures no test is ever quietly dropped.

---

## Enforce Exclusive `playwright-cli` Exploration -- 2026-03-23

**PR:** [#14](../../pull/14) `Enforce exclusive playwright-cli exploration across all AI rules`

### What Changed

Added a new **No Substitute UI Exploration** WON'T rule and strengthened the existing **Explore Before Generate** MUST rule across all three tool chains. AI agents are now explicitly forbidden from using IDE browser MCP, Cursor browser tools, Playwright Test `codegen`, or any other browser automation to satisfy the pre-code exploration requirement. Only `playwright-cli` is accepted.

### Orchestrator Rules Updated

- **`.cursor/rules/rules.mdc`**, **`CLAUDE.md`**, **`.github/copilot-instructions.md`**:
    - Expanded "Explore Before Generate" to separate UI vs API exploration, explicitly require `playwright-cli` as the only tool, and reference the skill file first
    - Added "No Substitute UI Exploration" to the WON'T table
    - Updated AI Workflow step 2 to forbid substitute browsers by name
- **`.github/copilot-instructions.md`**: Added a new "AI Workflow" section (7 steps) that was previously missing from the Copilot orchestrator

### Skills Updated

| Skill / Instruction                                     | Key Changes                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **playwright-cli** (`.claude/`, `.cursor/`, `.github/`) | Added "Mandatory — exclusive tool for pre-code UI exploration" section with must/must-not/blocked requirement table |
| **selectors** (`.claude/`, `.cursor/`, `.github/`)      | Updated exploration-first workflow opening to reference the no-substitute rule and stop-and-notify protocol         |
| **page-objects** (`.claude/`, `.cursor/`, `.github/`)   | Updated step 1 (Open and authenticate) to enforce `playwright-cli` only                                             |
| **common-tasks** (`.claude/`, `.cursor/`, `.github/`)   | Updated page object task note to forbid substitute browsers                                                         |
| **enums** (`.claude/`, `.cursor/`, `.github/`)          | Updated "Verify Message Values Against the Real App" to enforce `playwright-cli` only                               |
| **fixtures** (`.claude/`, `.cursor/`, `.github/`)       | Updated prerequisite for new page object fixtures to enforce `playwright-cli` only                                  |

### Documentation

- **README.md** -- Updated "Explore Before Generate" MUST rule and added "No Substitute UI Exploration" to the WON'T table in Core Principles

### Why

AI agents in some IDEs would satisfy the "Explore Before Generate" rule by opening the site in a built-in browser (IDE browser MCP, Cursor browser tools) instead of `playwright-cli`. This produced selectors based on rendered DOM rather than the accessibility tree, bypassing the snapshot-driven workflow the scaffold relies on. The explicit prohibition closes this loophole.

---

## Update AI Skills -- 2026-03-22

**PR:** [#12](../../pull/12) `update-skills`

### What Changed

Comprehensive skill update across all three tool chains (`.cursor/`, `.claude/`, `.github/`). Every updated skill was eval-tested (with-skill vs baseline) to measure quality improvement. A new `skill-creator` meta-skill was added for authoring and iterating on skills.

### New Skill

- `**skill-creator**` -- Meta-skill for creating, evaluating, and improving AI skills. Includes eval runner, benchmark aggregation, description optimizer, and blind comparison tooling. Added to `.cursor/skills/`, `.claude/skills/`, and `.github/skills/`.

### Skills Updated

| Skill              | Key Changes                                                                                                                                                                                                | Eval Delta |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **api-testing**    | Added "Negative / Validation Testing" section: per-field `for...of` loops with type-specific invalid values, spread-and-override pattern, omitted-field pattern, forbidden empty-body-only testing         | +48%       |
| **selectors**      | Added mandatory "Exploration-First Workflow" (4 steps: open+auth, explore, plan, generate), auth failure protocol, "Feedback & Validation Message Selectors" section with type table and forbidden pattern | +32%       |
| **common-tasks**   | Synced `.cursor` with `.claude`/`.github`: replaced broken E2E+generic templates with Functional+E2E split, fixed JSDoc guidance, added missing Common Mistakes (9-13), expanded Verification Checklist    | +37%       |
| **page-objects**   | Replaced weak exploration section with mandatory workflow referencing selectors skill, added three-section locator structure (interactive, feedback, actions), fixed JSDoc example                         | +29%       |
| **test-standards** | Fixed critical `.cursor` bug: `@functional` shown as valid tag and multi-tag example shown as correct. Added Functional vs E2E distinction, factory data in examples                                       | +12%       |
| **fixtures**       | Added "Prerequisites for New Page Object Fixtures" requiring exploration-first and feedback locators before registration                                                                                   | --         |
| **enums**          | Added "Verify Message Values Against the Real App" section tying enum values to the exploration-first workflow                                                                                             | --         |

### Orchestrator Rules Updated

- `**.cursor/rules/rules.mdc`**, `**CLAUDE.md**`, `**.github/copilot-instructions.md\*\*`:
    - Promoted "Explore Before Generate" from SHOULD to MUST
    - Added "No Empty-Body-Only 400" to WON'T table
    - Added "No Feedback-Less POM" to WON'T table
    - Synced fixtures skill index row across orchestrators

### Pre-existing Fixes

- **api-testing**: Replaced hardcoded example strings (`'John Doe'`, `'john@example.com'`) with factory calls (`generateUser()`)
- **enums**: Changed Organization section from hardcoded `enums/app/` to `enums/{area}/`

### Why

The skills are the primary mechanism that guides AI agents when generating code for the scaffold. Several skills had gaps (no exploration workflow, insufficient negative testing patterns, contradictory tagging rules) that caused agents to produce incomplete or incorrect output. These updates close those gaps with tested, measurable improvements.

---

## Remove browser-use -- 2026-03-20

**PR:** [#9](../../pull/9) `remove browser-use`

### What Changed

Removed all `browser-use` references, skill files, and installation steps from the scaffold. `playwright-cli` is now the sole browser exploration tool.

### Deleted

- `.claude/skills/browser-use/` -- Claude Code browser-use skill
- `.cursor/skills/browser-use/` -- Cursor browser-use skill
- `.github/instructions/browser-use.instructions.md` -- Copilot browser-use scoped instructions

### AI Rules and Instructions

- `**CLAUDE.md`\*\* -- Removed browser-use workflow bullet and Skills Index row.
- `**.cursor/rules/rules.mdc**` -- Removed browser-use workflow bullet, Skills Index row, and Container Environment notes.
- `**.github/copilot-instructions.md**` -- Removed "Browser Automation Policy" section.
- `**common-tasks` skill\*\* (`.claude/`, `.cursor/`, `.github/` copies) -- Changed page-object exploration references from browser-use to `playwright-cli`.

### Setup and Dev Container

- `**.devcontainer/Dockerfile`\*\* -- Removed browser-use Python venv creation (`/opt/browser-use-env`) and PATH entry. Python 3 remains installed.
- `**.devcontainer/post-create.sh**` -- Removed browser-use availability check and "browser-use doctor" hint.
- `**scripts/link-cli.sh**` -- Removed browser-use source paths and linking logic.
- `**scripts/setup.sh**` -- Removed browser-use installation step; renumbered from 8 steps to 6.

### Documentation

- `**README.md**` -- Removed browser-use from Quick Start, Local Setup, Manual Installation, Verify Installation, project structure tree, Tool Comparison table, and Skills Index.

### Why

`browser-use` was optional and never the default exploration path. Removing it simplifies the Docker image, reduces build time, and eliminates a Python dependency that is no longer needed.

---

## Default to Playwright CLI -- 2026-03-19

**PR:** [#7](../../pull/7) `playwright-cli`

### What Changed

This update makes `playwright-cli` the default browser exploration path across the scaffold, adds isolated browser-cache handling for `@playwright/cli`, and aligns setup/docs around the new workflow.

### AI Rules and Instructions

- **New `playwright-cli` skill/instruction set** -- Added mirrored skill docs under `.claude/skills/playwright-cli/`, `.cursor/skills/playwright-cli/`, and `.github/instructions/playwright-cli/` with references for tracing, storage state, request mocking, video recording, session management, and running custom Playwright code.
- **Default exploration policy updated** -- `CLAUDE.md`, `.cursor/rules/rules.mdc`, and `.github/copilot-instructions.md` now direct AI assistants to use `playwright-cli` by default for UI exploration and test case creation. `browser-use` remains available only on explicit request.

### Setup and Dev Container

- `**@playwright/cli` added\*\* -- Added `@playwright/cli` to `package.json` and `package-lock.json`.
- **Dedicated CLI browser cache** -- Added `.playwright/cli.config.json`, `scripts/playwright-cli.sh`, and `scripts/install-playwright-cli-browsers.sh` so `playwright-cli` uses a separate browser cache from `@playwright/test`.
- **CLI linking support** -- Added `scripts/link-cli.sh` to link `playwright`, `playwright-cli`, and `browser-use` into `~/.local/bin`.
- **Dev Container cache volumes** -- `.devcontainer/Dockerfile`, `.devcontainer/devcontainer.json`, and `.devcontainer/post-create.sh` now provision persistent mounts for `~/.npm` and `/ms-playwright-cli`, fix volume ownership on first attach, install `playwright-cli` browsers, and report both `playwright` and `playwright-cli` during verification.
- **Local setup and health checks** -- `scripts/setup.sh` and `npm run setup:check` now validate `playwright-cli` directly, keep `browser-use` optional, and document `~/.local/bin` as the main CLI PATH location.

### Documentation

- **README.md** -- Updated setup, manual install, verification, project structure, AI workflow, and troubleshooting sections to reflect the `playwright-cli` default path and separate CLI browser cache.
- `**.gitignore`\*\* -- Ignores `.playwright-cli/` runtime artifacts generated by the CLI.

### Why

`@playwright/cli` bundles a different Playwright version than `@playwright/test`, so the scaffold now treats browser exploration as a separate workflow with its own cache, scripts, and docs. This prevents cache conflicts and makes the default AI-assisted exploration path explicit.

---

## Customize Claude Code Terminal -- 2026-03-12

**PR:** [#3](../../pull/5) `Customize-Claude-Code-Terminal`

### What Changed

This update adds a custom Claude Code status line, switches to native Claude Code installation, and adds GitHub CLI to the Dev Container.

### Dev Container

- **Claude Code native install** -- Replaced `npm install -g @anthropic-ai/claude-code` with the native installer (`curl -fsSL https://claude.ai/install.sh | bash`). Removes the npm dependency and installs as the `pwuser` user at `~/.local/bin`.
- **GitHub CLI added** -- Installed `gh` in the Dockerfile. Required by the status line script for PR status display. Version check added to `post-create.sh`.

### Claude Code Custom Status Line

- `**.claude/scripts/status_line.py`\*\* -- New custom status line renderer using a Gruvbox Dark color palette. Displays git branch (with dirty indicator), PR review status (via `gh` CLI), workspace directory, active Claude model, session duration, cumulative API cost, lines changed, and a visual context window usage bar scaled to the autocompact threshold.
- `**.claude/settings.local.json**` -- Local settings file configuring the status line command.

### Documentation

- **README.md** -- Added "Claude Code Custom Status Line" section with setup instructions, segment reference table, and example output. Updated project structure tree to reflect `.claude/scripts/` and `settings.local.json`. Updated Dockerfile description to note native install.

---

## Align Skills and Scaffold Code -- 2026-03-06

**PR:** [#2](../../pull/2) `update-api-testing-skills`

### What Changed

This update brings the AI-assisted development skills and scaffold code into full alignment. The changes span all three IDE rulesets (Claude Code, Cursor, GitHub Copilot) and the scaffold's source files.

### Skill Files Updated

- **api-testing** -- Expanded with Comprehensive Testing Flow coverage matrix, DELETE step example, and `expect(createdUser).toBeTruthy()` assertion pattern. Fixed a trailing `|` formatting artifact.
- **type-safety** -- Added `z.ipv4()`, `z.base64()` validators to the reference table. Added `z.object().merge()` removal note, `z.looseObject()`, and `z.infer` to `zOutput` migration guidance. Updated schema example to use `zod/v4` imports.
- **selectors** -- Removed JSDoc from locator getter examples to match the "No JSDoc on Locators" rule.
- **Copilot instructions** (api-testing, type-safety) -- Synced with the expanded content from Claude/Cursor skills.

### Scaffold Code Aligned with Rules

- **Zod imports** -- Schema files (`userSchema.ts`, `errorResponseSchema.ts`) now use `import { z } from 'zod/v4'` and `zOutput<>` instead of the Zod 3 compat `'zod'` + `z.infer<>`.
- **No JSDoc on locators** -- Removed JSDoc comments from all locator getters in `app.page.ts` and `navigation.component.ts`. Action methods retain their JSDoc as required.
- **helper-fixture.ts** -- Updated comment to reference `zOutput<>` instead of `z.infer<>`.

### Formatting

- Prettier-formatted markdown tables across `CLAUDE.md` and skill files for consistent readability.

### Why

The scaffold is a template -- its code should be the reference implementation of the rules it teaches. These changes close the gap between "what the skills say" and "what the code does," so AI assistants generate code that matches the scaffold from day one.

---

## Initial Commit -- 2026-02-25

**Commit:** `b9e96f7`

### What Changed

Initial release of the Playwright Scaffold with the full AI-assisted development architecture.

### Included

- **Orchestrator rules** -- `CLAUDE.md`, `.cursor/rules/rules.mdc`, `.github/copilot-instructions.md` with MUST/SHOULD/WON'T constitution
- **13 AI skills** -- Mirrored across `.claude/skills/` and `.cursor/skills/`: api-testing, browser-use, common-tasks, config, data-strategy, enums, fixtures, helpers, page-objects, refactor-values, selectors, test-standards, type-safety
- **Fixtures** -- `test-options.ts` (single import point), `page-object-fixture.ts`, `api-request-fixture.ts`, `helper-fixture.ts`
- **Page objects** -- `AppPage` with `NavigationComponent` composition
- **Zod schemas** -- `UserResponseSchema`, `LoginRequestSchema`, error response schemas (400, 401, 403, 404)
- **Test data** -- `user.factory.ts` (Faker + Zod), `invalidCredentials.json` (static boundary data)
- **Tests** -- Functional login (`@smoke`, `@regression`), API login (`@api`), E2E (`@e2e`), auth setup
- **Enums** -- Messages, ApiEndpoints, StorageStatePaths, Roles
- **Dev Container** -- Dockerfile with Playwright browsers, Python, browser-use CLI, Claude Code
- **Configuration** -- `playwright.config.ts`, ESLint, Prettier, Husky, environment management
