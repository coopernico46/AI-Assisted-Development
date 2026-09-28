import type { FullResult } from '@playwright/test/reporter';
import { DASHBOARD_SCRIPT, THEME_BOOTSTRAP_SCRIPT } from './client-script';
import { DASHBOARD_STYLES } from './styles';
import type {
    DashboardAttachment,
    DashboardData,
    DashboardStatus,
    DashboardStep,
    DashboardTest,
} from './types';

const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

const STATUS_ORDER: DashboardStatus[] = ['pass', 'fail', 'skip', 'flaky'];

const STATUS_BADGES: Record<DashboardStatus, string> = {
    pass: 'PASADO',
    fail: 'FALLADO',
    skip: 'OMITIDO',
    flaky: 'FLAKY',
};

const STATUS_ICONS: Record<DashboardStatus, string> = {
    pass: 'OK',
    fail: 'KO',
    skip: 'SK',
    flaky: 'FL',
};

const STATUS_PLURALS: Record<DashboardStatus, string> = {
    pass: 'Pasados',
    fail: 'Fallados',
    skip: 'Omitidos',
    flaky: 'Flaky',
};

const RUN_STATUS_LABELS: Record<FullResult['status'], string> = {
    passed: 'Ejecución correcta',
    failed: 'Ejecución con fallos',
    timedout: 'Tiempo global agotado',
    interrupted: 'Ejecución interrumpida',
};

export function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function formatDuration(durationMs: number): string {
    if (!Number.isFinite(durationMs)) return '-';
    if (durationMs < MS_PER_SECOND) return `${Math.round(durationMs)}ms`;

    const totalSeconds = durationMs / MS_PER_SECOND;
    if (totalSeconds < SECONDS_PER_MINUTE) return `${totalSeconds.toFixed(1)}s`;

    const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
    const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);
    return `${minutes}m ${seconds}s`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'short',
        timeStyle: 'medium',
    }).format(date);
}

function percentage(part: number, total: number): number {
    return total ? (part / total) * 100 : 0;
}

function uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort((left, right) =>
        left.localeCompare(right, 'es')
    );
}

function renderOptions(values: string[], allLabel: string): string {
    return [
        `<option value="all">${escapeHtml(allLabel)}</option>`,
        ...uniqueSorted(values).map(
            (value) =>
                `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
        ),
    ].join('');
}

function renderTextBlock(label: string, content: string, wide = false): string {
    return `
      <div class="text-evidence-card${wide ? ' text-evidence-wide' : ''}">
        <p class="text-evidence-label">${escapeHtml(label)}</p>
        <pre class="text-evidence-pre">${escapeHtml(content)}</pre>
      </div>`;
}

function renderSteps(steps: DashboardStep[]): string {
    const items = steps
        .map(
            (step) => `
          <li class="step${step.error ? ' step-error' : ''}" style="--depth:${step.depth}">
            <span class="step-title">${escapeHtml(step.title)}</span>
            <span class="step-duration">${formatDuration(step.duration)}</span>
            ${step.error ? `<pre class="step-error-msg">${escapeHtml(step.error)}</pre>` : ''}
          </li>`
        )
        .join('');

    return `
      <div class="text-evidence-card text-evidence-wide">
        <p class="text-evidence-label">Pasos del test</p>
        <ol class="steps">${items}</ol>
      </div>`;
}

function renderMedia(attachment: DashboardAttachment): string {
    const href = escapeHtml(attachment.href);
    const label = `<p class="media-label">${escapeHtml(attachment.name)} · ${escapeHtml(attachment.href.split('/').pop() ?? '')}</p>`;

    if (attachment.kind === 'image') {
        return `<div>${label}<img class="screenshot" src="${href}" alt="Captura: ${escapeHtml(attachment.name)}" loading="lazy" onclick="openLb(this)" /></div>`;
    }
    return `<div>${label}<video class="video" controls preload="metadata" src="${href}"></video></div>`;
}

function renderArtifactLinks(attachments: DashboardAttachment[]): string {
    const traces = attachments.filter(
        (attachment) => attachment.kind === 'trace'
    );

    const traceLinks = traces.map((trace, index) => {
        const suffix = traces.length > 1 ? ` ${index + 1}` : '';
        const href = escapeHtml(trace.href);
        return `
          <button type="button" class="artifact-link artifact-trace" data-trace="${href}" onclick="openTrace(this)">Abrir trace${suffix}</button>
          <a class="artifact-link" href="${href}" download>Descargar trace${suffix}</a>`;
    });

    const fileLinks = attachments
        .filter((attachment) => attachment.kind !== 'trace')
        .map(
            (attachment) =>
                `<a class="artifact-link" href="${escapeHtml(attachment.href)}" target="_blank" rel="noreferrer">${escapeHtml(attachment.name)}</a>`
        );

    return [...traceLinks, ...fileLinks].join('');
}

function renderCard(test: DashboardTest): string {
    const media = test.attachments.filter(
        (attachment) =>
            attachment.kind === 'image' || attachment.kind === 'video'
    );
    const textAttachments = test.attachments.filter(
        (attachment) => attachment.text
    );

    const textBlocks = [
        test.errors.length
            ? renderTextBlock('Error', test.errors.join('\n\n'), true)
            : '',
        test.steps.length ? renderSteps(test.steps) : '',
        ...textAttachments.map((attachment) =>
            renderTextBlock(attachment.name, attachment.text)
        ),
        test.stdout ? renderTextBlock('stdout', test.stdout) : '',
        test.stderr ? renderTextBlock('stderr', test.stderr) : '',
    ]
        .filter(Boolean)
        .join('');

    const artifactLinks = renderArtifactLinks(test.attachments);
    const chips = [
        ...test.tags.map(
            (tag) => `<span class="chip chip-tag">${escapeHtml(tag)}</span>`
        ),
        test.retry > 0
            ? `<span class="chip chip-retry">Reintento ${test.retry}</span>`
            : '',
        ...test.annotations.map(
            (annotation) =>
                `<span class="chip">${escapeHtml(annotation)}</span>`
        ),
    ]
        .filter(Boolean)
        .join('');
    const errorPreview = test.errors[0]?.split('\n')[0] ?? '';
    const filterText = [
        test.title,
        test.describePath,
        test.file,
        test.group,
        test.project,
        STATUS_BADGES[test.status],
        ...test.tags,
    ]
        .join(' ')
        .toLowerCase();

    return `
      <article class="card card-${test.status}" data-status="${test.status}" data-group="${escapeHtml(test.group)}" data-project="${escapeHtml(test.project)}" data-tags="${escapeHtml(test.tags.join(' '))}" data-filter="${escapeHtml(filterText)}">
        <div class="card-header">
          <div class="card-title-row">
            <div class="icon icon-${test.status}" aria-hidden="true">${STATUS_ICONS[test.status]}</div>
            <div>
              <h3 class="test-name">${escapeHtml(test.title)}</h3>
              <p class="test-location mono">${escapeHtml(`${test.file}:${test.line}`)} · ${escapeHtml(test.project)}</p>
              ${test.describePath ? `<p class="suite-name">${escapeHtml(test.describePath)}</p>` : ''}
            </div>
          </div>
          <div class="card-meta">
            <span class="duration">${formatDuration(test.duration)}</span>
            <span class="badge badge-${test.status}">${STATUS_BADGES[test.status]}</span>
          </div>
        </div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        ${errorPreview ? `<pre class="error-preview">${escapeHtml(errorPreview)}</pre>` : ''}
        <details class="evidence-details">
          <summary class="evidence-summary">Ver evidencias y contexto técnico</summary>
          <div class="text-evidence-grid">${textBlocks || '<p class="no-evidence">Sin bloques de texto para este test.</p>'}</div>
          ${media.length ? `<div class="evidence-grid">${media.map(renderMedia).join('')}</div>` : ''}
          <div class="artifact-list">${artifactLinks || '<span class="no-evidence">Sin artefactos en esta ejecución.</span>'}</div>
        </details>
      </article>`;
}

function renderGroups(tests: DashboardTest[]): string {
    const groups = new Map<string, DashboardTest[]>();
    for (const test of tests) {
        groups.set(test.group, [...(groups.get(test.group) ?? []), test]);
    }

    return [...groups.entries()]
        .sort(([left], [right]) => left.localeCompare(right, 'es'))
        .map(([group, groupTests]) => {
            const passed = groupTests.filter(
                (test) => test.status === 'pass'
            ).length;
            const failed = groupTests.filter(
                (test) => test.status === 'fail'
            ).length;
            const duration = groupTests.reduce(
                (total, test) => total + test.duration,
                0
            );

            return `
      <details class="category-section" data-group-section="${escapeHtml(group)}" open>
        <summary class="category-title${failed ? ' category-title-fail' : ''}">
          <span class="category-name">${escapeHtml(group)}</span>
          <span class="category-count" title="Tests">${groupTests.length}</span>
          <span class="category-ratio" title="Pasados / Fallados"><span class="ratio-pass">${passed}</span>/<span class="ratio-fail${failed ? '' : ' ratio-fail-zero'}">${failed}</span></span>
          <span class="category-duration">${formatDuration(duration)}</span>
        </summary>
        ${groupTests.map(renderCard).join('')}
      </details>`;
        })
        .join('');
}

export function buildDashboardHtml({
    meta,
    summary,
    tests,
}: DashboardData): string {
    const clientConfig = JSON.stringify({
        hasTraceViewer: meta.hasTraceViewer,
        reportDir: meta.reportDir,
    }).replaceAll('<', '\\u003c');

    const bars = STATUS_ORDER.map(
        (status) => `
        <div class="bar-row">
          <span class="bar-label">${STATUS_PLURALS[status]}</span>
          <div class="bar-track"><div class="bar-fill bar-${status}" style="width:${percentage(summary[status], summary.total)}%"></div></div>
          <strong>${summary[status]}</strong>
        </div>`
    ).join('');

    const stats = STATUS_ORDER.map(
        (status) =>
            `<div class="stat stat-${status}"><p>${STATUS_PLURALS[status]}</p><h2>${summary[status]}</h2></div>`
    ).join('');

    const nativeReportButton = meta.nativeReportHref
        ? `<a class="btn" href="${escapeHtml(meta.nativeReportHref)}" target="_blank" rel="noreferrer">Reporte Playwright</a>`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(meta.title)}</title>
<script>${THEME_BOOTSTRAP_SCRIPT}</script>
<style>${DASHBOARD_STYLES}</style>
</head>
<body>
<div class="lightbox" id="lb" onclick="closeLb()"><img id="lb-img" alt="Captura ampliada" /></div>
<div class="modal" id="traceModal" role="dialog" aria-modal="true" aria-labelledby="traceModalTitle" onclick="if (event.target === this) closeTraceModal()">
  <div class="modal-box">
    <h2 id="traceModalTitle">Abrir trace</h2>
    <p id="traceReason"></p>
    <p><strong>Opción 1</strong> · Sirve el dashboard y vuelve a pulsar «Abrir trace»:</p>
    <div class="cmd"><code>npm run report:dashboard</code><button type="button" class="btn btn-secondary" onclick="copyCommand(this)">Copiar</button></div>
    <p><strong>Opción 2</strong> · Abre este trace con el visor local de Playwright:</p>
    <div class="cmd"><code id="traceCmd"></code><button type="button" class="btn btn-secondary" onclick="copyCommand(this)">Copiar</button></div>
    <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeTraceModal()">Cerrar</button></div>
  </div>
</div>
<header class="header">
  <div>
    <h1>${escapeHtml(meta.title)}</h1>
    <p>Playwright ${escapeHtml(meta.playwrightVersion)} · entorno <strong>${escapeHtml(meta.environment)}</strong> · ${meta.workers} worker(s)</p>
    <span class="run-status run-status-${meta.overallStatus}">${RUN_STATUS_LABELS[meta.overallStatus]}</span>
  </div>
  <div class="header-meta">
    <p>Ejecutado el <strong>${escapeHtml(formatDate(meta.startTime))}</strong></p>
    <p>Duración total: <strong>${escapeHtml(formatDuration(meta.duration))}</strong></p>
    <div class="header-actions">
      ${nativeReportButton}
      <button class="btn" type="button" onclick="window.print()">Imprimir / PDF</button>
      <button class="btn" type="button" id="themeBtn" onclick="toggleTheme()">Tema</button>
    </div>
  </div>
</header>
<main class="main">
  <section class="stats">
    <div class="stat"><p>Total</p><h2>${summary.total}</h2></div>
    ${stats}
    <div class="stat stat-rate"><p>Tasa de éxito</p><h2>${summary.successRate}%</h2></div>
  </section>
  <section class="panel">
    <h2>Resumen de resultados</h2>
    <div class="summary-bars">${bars}</div>
  </section>
  <section>
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="section-title" style="margin:0">Detalle por test</h2>
        <select id="statusFilter" class="control" onchange="filterCards()" aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          ${STATUS_ORDER.map((status) => `<option value="${status}">Solo ${STATUS_PLURALS[status].toLowerCase()}</option>`).join('')}
        </select>
        <select id="tagFilter" class="control" onchange="filterCards()" aria-label="Filtrar por tag">
          ${renderOptions(
              tests.flatMap((test) => test.tags),
              'Todos los tags'
          )}
        </select>
        <select id="projectFilter" class="control" onchange="filterCards()" aria-label="Filtrar por proyecto">
          ${renderOptions(
              tests.map((test) => test.project),
              'Todos los proyectos'
          )}
        </select>
        <select id="groupFilter" class="control" onchange="filterCards()" aria-label="Filtrar por fichero">
          ${renderOptions(
              tests.map((test) => test.group),
              'Todos los ficheros'
          )}
        </select>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-secondary" id="toggleSectionsBtn" type="button" onclick="toggleAllSections()">Colapsar todo</button>
        <input class="control filter" id="filter" type="search" placeholder="Filtrar por nombre, fichero, tag, estado..." oninput="filterCards()" aria-label="Filtrar por texto" />
      </div>
    </div>
    <div id="cards">${tests.length ? renderGroups(tests) : ''}</div>
    <p id="noResults" class="empty-state${tests.length ? ' hidden' : ''}">No hay tests que coincidan con los filtros.</p>
  </section>
</main>
<footer>Generado por reporters/qa-dashboard · ${escapeHtml(formatDate(new Date()))}</footer>
<script type="application/json" id="dashboard-config">${clientConfig}</script>
<script>${DASHBOARD_SCRIPT}</script>
</body>
</html>`;
}
