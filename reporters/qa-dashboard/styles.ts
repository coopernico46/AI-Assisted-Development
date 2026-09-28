const LIGHT_TOKENS = `
    color-scheme: light;
    --bg: #f1f5f9;
    --surface: #ffffff;
    --surface-alt: #f8fafc;
    --surface-sunken: #eef2f7;
    --border: #dbe3ec;
    --border-strong: #c3cfdc;
    --text: #0f172a;
    --text-soft: #334155;
    --muted: #5b6b80;
    --accent: #0f766e;
    --accent-bg: #ccfbf1;
    --accent-border: #5eead4;
    --pass: #047857;
    --pass-bg: #d1fae5;
    --pass-bar: #10b981;
    --fail: #b91c1c;
    --fail-bg: #fee2e2;
    --fail-bar: #ef4444;
    --skip: #a16207;
    --skip-bg: #fef3c7;
    --skip-bar: #f59e0b;
    --flaky: #6d28d9;
    --flaky-bg: #ede9fe;
    --flaky-bar: #8b5cf6;
    --overlay: rgba(15, 23, 42, 0.82);
    --shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
`;

const DARK_TOKENS = `
    color-scheme: dark;
    --bg: #030712;
    --surface: #0f172a;
    --surface-alt: #08101d;
    --surface-sunken: #07111f;
    --border: #1e293b;
    --border-strong: #334155;
    --text: #f1f5f9;
    --text-soft: #cbd5e1;
    --muted: #8b9bb4;
    --accent: #2dd4bf;
    --accent-bg: #042f2e;
    --accent-border: #0f766e;
    --pass: #34d399;
    --pass-bg: rgba(6, 78, 59, 0.45);
    --pass-bar: #10b981;
    --fail: #f87171;
    --fail-bg: rgba(127, 29, 29, 0.45);
    --fail-bar: #ef4444;
    --skip: #fbbf24;
    --skip-bg: rgba(113, 63, 18, 0.45);
    --skip-bar: #f59e0b;
    --flaky: #c4b5fd;
    --flaky-bg: rgba(76, 29, 149, 0.45);
    --flaky-bar: #8b5cf6;
    --overlay: rgba(0, 0, 0, 0.9);
    --shadow: none;
`;

export const DASHBOARD_STYLES = `
:root {${LIGHT_TOKENS}}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {${DARK_TOKENS}}
}
:root[data-theme="dark"] {${DARK_TOKENS}}

* { box-sizing: border-box; }
body { font-family: system-ui, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); margin: 0; }
code, pre, .mono { font-family: Consolas, "Cascadia Mono", monospace; }
.header { background: linear-gradient(135deg, #0f766e, #14b8a6); color: #fff; padding: 2rem 3rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
.header h1 { font-size: 1.8rem; font-weight: 700; margin: 0; }
.header p { margin: .2rem 0; color: #ccfbf1; font-size: .9rem; }
.header strong { color: #fff; }
.header-meta { text-align: right; }
.header-actions { display: flex; gap: .75rem; flex-wrap: wrap; justify-content: flex-end; margin-top: .75rem; }
.run-status { display: inline-block; margin-top: .6rem; padding: .2rem .7rem; border-radius: 999px; font-size: .75rem; font-weight: 700; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); }
.run-status-failed, .run-status-timedout, .run-status-interrupted { background: #7f1d1d; border-color: #fca5a5; }
.btn { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3); color: #fff; border-radius: .6rem; padding: .6rem 1.1rem; font-size: .85rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: .4rem; font-family: inherit; }
.btn:hover { background: rgba(255,255,255,.25); }
.btn-secondary { background: var(--surface); border: 1px solid var(--border); color: var(--text-soft); }
.btn-secondary:hover { background: var(--surface-sunken); color: var(--text); }
.main { max-width: 1180px; margin: 0 auto; padding: 2rem; }
.stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 2rem; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; text-align: center; box-shadow: var(--shadow); }
.stat p { margin: 0; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; color: var(--muted); }
.stat h2 { margin: .5rem 0 0; font-size: 2.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.stat-pass h2 { color: var(--pass); }
.stat-fail h2 { color: var(--fail); }
.stat-skip h2 { color: var(--skip); }
.stat-flaky h2 { color: var(--flaky); }
.stat-rate h2 { color: var(--accent); }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; margin-bottom: 2rem; box-shadow: var(--shadow); }
.panel h2, .section-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: var(--text-soft); }
.summary-bars { display: grid; gap: .9rem; }
.bar-row { display: grid; grid-template-columns: 140px 1fr 70px; gap: 1rem; align-items: center; }
.bar-label { color: var(--text-soft); font-size: .9rem; font-weight: 600; }
.bar-track { background: var(--surface-sunken); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; height: 14px; }
.bar-fill { height: 100%; border-radius: 999px; }
.bar-pass { background: var(--pass-bar); }
.bar-fail { background: var(--fail-bar); }
.bar-skip { background: var(--skip-bar); }
.bar-flaky { background: var(--flaky-bar); }
.bar-row strong { font-variant-numeric: tabular-nums; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.toolbar-left, .toolbar-right { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
.control { background: var(--surface); border: 1px solid var(--border); color: var(--text-soft); border-radius: .6rem; padding: .65rem .8rem; font: inherit; font-size: .85rem; }
.filter { min-width: 280px; }
.category-section { margin-bottom: 1rem; background: var(--surface-alt); border: 1px solid var(--border); border-radius: 1rem; padding: 0 1rem 1rem; }
.category-title { display: flex; align-items: center; gap: .75rem; font-size: .8rem; font-weight: 700; letter-spacing: .06em; color: var(--muted); border-bottom: 1px solid var(--border); padding: 1rem 0 .85rem; margin: 0 0 .75rem; cursor: pointer; list-style: none; }
.category-title::-webkit-details-marker { display: none; }
.category-title::before { content: '▾'; color: var(--accent); font-size: 1.35rem; line-height: 1; transition: transform .2s ease; }
.category-title-fail::before { color: var(--fail); }
.category-name { text-transform: uppercase; color: var(--text-soft); }
.category-section:not([open]) .category-title { margin-bottom: 0; border-bottom-color: transparent; padding-bottom: 1rem; }
.category-section:not([open]) .category-title::before { transform: rotate(-90deg); }
.category-count, .category-ratio, .category-duration { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: 999px; padding: .15rem .55rem; font-size: .72rem; font-weight: 700; }
.category-duration { margin-left: auto; font-weight: 600; }
.ratio-pass { color: var(--pass); }
.ratio-fail { color: var(--fail); }
.ratio-fail-zero { color: var(--muted); }
.card { background: var(--surface); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid var(--border); border-left: 4px solid transparent; box-shadow: var(--shadow); }
.card-pass { border-left-color: var(--pass-bar); }
.card-fail { border-left-color: var(--fail-bar); }
.card-skip { border-left-color: var(--skip-bar); }
.card-flaky { border-left-color: var(--flaky-bar); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .75rem; gap: 1rem; }
.card-title-row { display: flex; align-items: flex-start; gap: .8rem; min-width: 0; }
.icon { width: 2.2rem; height: 2.2rem; border-radius: .6rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .85rem; flex-shrink: 0; }
.icon-pass, .badge-pass { background: var(--pass-bg); color: var(--pass); }
.icon-fail, .badge-fail { background: var(--fail-bg); color: var(--fail); }
.icon-skip, .badge-skip { background: var(--skip-bg); color: var(--skip); }
.icon-flaky, .badge-flaky { background: var(--flaky-bg); color: var(--flaky); }
.test-name { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text); overflow-wrap: anywhere; }
.test-location, .suite-name { margin: .25rem 0 0; font-size: .75rem; color: var(--muted); overflow-wrap: anywhere; }
.card-meta { display: flex; align-items: center; gap: .8rem; flex-shrink: 0; }
.duration { font-size: .8rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.badge { padding: .25rem .8rem; border-radius: 999px; font-size: .75rem; font-weight: 700; }
.chips { display: flex; flex-wrap: wrap; gap: .5rem; margin: 0 0 .75rem 3rem; }
.chip { font-size: .72rem; color: var(--text-soft); background: var(--surface-sunken); border: 1px solid var(--border); border-radius: 999px; padding: .25rem .6rem; }
.chip-tag { color: var(--accent); background: var(--accent-bg); border-color: var(--accent-border); font-weight: 700; }
.chip-retry { color: var(--flaky); background: var(--flaky-bg); border-color: transparent; }
.error-preview { margin: 0 0 .75rem 3rem; padding: .6rem .8rem; border-radius: .6rem; background: var(--fail-bg); color: var(--fail); font-size: .78rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.evidence-details { margin-left: 3rem; }
.evidence-summary { cursor: pointer; font-size: .8rem; font-weight: 600; color: var(--muted); user-select: none; padding: .4rem 0; }
.evidence-summary:hover { color: var(--text); }
.text-evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: .75rem; margin: .75rem 0; }
.text-evidence-card { background: var(--surface-sunken); border: 1px solid var(--border); border-radius: .6rem; padding: .85rem; min-width: 0; }
.text-evidence-wide { grid-column: 1 / -1; }
.text-evidence-label { margin: 0 0 .5rem; color: var(--muted); font-size: .75rem; font-weight: 700; }
.text-evidence-pre { margin: 0; color: var(--text); white-space: pre-wrap; overflow-wrap: anywhere; font-size: .78rem; line-height: 1.45; max-height: 260px; overflow: auto; }
.steps { list-style: none; margin: 0; padding: 0; font-size: .8rem; max-height: 320px; overflow: auto; }
.step { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; padding: .3rem 0 .3rem calc(var(--depth, 0) * 1.1rem); border-bottom: 1px dashed var(--border); }
.step:last-child { border-bottom: 0; }
.step-title { color: var(--text-soft); overflow-wrap: anywhere; }
.step-error .step-title { color: var(--fail); font-weight: 600; }
.step-duration { color: var(--muted); font-variant-numeric: tabular-nums; }
.step-error-msg { flex-basis: 100%; margin: .25rem 0 0; color: var(--fail); font-size: .74rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.evidence-grid { margin-top: .75rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.media-label { margin: 0 0 .45rem; font-size: .72rem; color: var(--muted); overflow-wrap: anywhere; }
.screenshot, .video { width: 100%; border-radius: .5rem; border: 1px solid var(--border); background: var(--surface-sunken); }
.screenshot { cursor: zoom-in; transition: opacity .2s; }
.screenshot:hover { opacity: .85; }
.artifact-list { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
.artifact-link { color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-border); border-radius: 999px; padding: .35rem .75rem; font: inherit; font-size: .8rem; text-decoration: none; cursor: pointer; }
.artifact-link:hover { filter: brightness(1.08); }
.artifact-trace { font-weight: 700; }
.no-evidence { color: var(--muted); font-size: .85rem; font-style: italic; margin: .5rem 0 0; }
.empty-state { text-align: center; color: var(--muted); padding: 3rem 1rem; }
.lightbox, .modal { display: none; position: fixed; inset: 0; background: var(--overlay); z-index: 999; align-items: center; justify-content: center; padding: 1rem; }
.lightbox.on, .modal.on { display: flex; }
.lightbox img { max-width: 92vw; max-height: 92vh; border-radius: .75rem; box-shadow: 0 25px 60px #000; }
.modal-box { background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; max-width: 640px; width: 100%; }
.modal-box h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
.modal-box p { margin: .75rem 0 .4rem; color: var(--text-soft); font-size: .9rem; line-height: 1.45; }
.cmd { display: flex; gap: .5rem; align-items: center; background: var(--surface-sunken); border: 1px solid var(--border); border-radius: .6rem; padding: .5rem .5rem .5rem .8rem; }
.cmd code { flex: 1; font-size: .8rem; overflow-wrap: anywhere; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; }
.hidden { display: none !important; }
footer { text-align: center; color: var(--muted); font-size: .75rem; padding: 2rem; }
@media (max-width: 850px) {
  .header { padding: 1.5rem 1rem; }
  .header, .card-header { flex-direction: column; align-items: flex-start; }
  .header-meta { text-align: left; }
  .header-actions { justify-content: flex-start; }
  .main { padding: 1.25rem 1rem; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .toolbar { flex-direction: column; align-items: stretch; }
  .filter { min-width: 0; width: 100%; }
  .bar-row { grid-template-columns: 1fr; gap: .4rem; }
  .chips, .error-preview, .evidence-details { margin-left: 0; }
}
@media print {
  :root, :root:not([data-theme="light"]), :root[data-theme="dark"] {${LIGHT_TOKENS}}
  .header-actions, .toolbar, .lightbox, .modal { display: none !important; }
  .stat, .panel, .card { break-inside: avoid; box-shadow: none; }
}
`;
