# Selector Troubleshooting

## My selector matches multiple elements

**Cause:** Two elements share the same accessible name or text content.
**Fix:** Add `{ exact: true }` to narrow text matches, use a more specific role, or **scope** to a parent: `page.getByRole('form', { name: 'Login' }).getByRole('button', { name: 'Submit' })`.

## I'm about to write an XPath because nothing semantic works

**Fix:** Forbidden. First check for a `data-testid` with `playwright-cli eval "el => el.getAttribute('data-testid')" <ref>` — it is Tier 1 and custom components often carry one. Then re-snapshot: often there IS a role or label hidden inside the component. If neither exists, coordinate with engineering to add a `data-testid` and use `getByTestId('...')`.

## I used `page.locator('.btn-primary')` because the button has no accessible name

**Cause:** The markup lacks an accessible name (`<button><svg/></button>` is a common culprit).
**Fix:** First check for a `data-testid` (Tier 1) — icon-only buttons frequently carry one. If not, re-check the snapshot — ARIA `aria-label` or a visible icon label may give you a semantic hook. If neither exists, ask engineering to add a `data-testid`. Class-based locators are brittle and must not ship.

## My page object has form inputs and a submit button but no error / success locators

**Cause:** Feedback & Validation Message Selectors section was skipped.
**Fix:** Re-explore (Phase 2), capture the rendered messages, encode them as `Messages.*` in `enums/{area}/*.ts` (via the `enums` skill), and add the locators. Ship nothing until the feedback selectors are in.

## I want to grep the DOM from dev tools and copy a CSS chain

**Fix:** Forbidden as the default. Re-explore with `playwright-cli` and pick the strategy from the Priority Order (`getByTestId` first, then the semantic tiers). The dev-tools CSS chain is almost always brittle (generated class names, index-based selectors).

## My locator returns "stale" elements after navigation

**Cause:** Misdiagnosis. `Locator` is lazy and always re-queries the DOM when an action runs — it doesn't "go stale".
**Fix:** The real problem is one of: (a) the element legitimately isn't there yet → use `await expect(locator).toBeVisible()` to wait, (b) the selector no longer matches the new DOM → re-snapshot and update the selector, or (c) frame/iframe context changed → scope with `frameLocator(...)`.

## The element has no `data-testid` yet

**Fix:** `getByTestId` is Tier 1, but a missing test ID is not a blocker — fall through the Priority Order (`getByRole` > `getByLabel` > `getByPlaceholder` > `getByText`) and ship the best semantic locator available. In parallel, request the `data-testid` from engineering and switch the locator to `getByTestId(...)` once it lands. Never use CSS classes or XPath while waiting.
