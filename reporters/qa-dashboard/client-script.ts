const THEME_STORAGE_KEY = 'qa-dashboard-theme';

/** Runs in <head> before paint so the stored theme applies without flashing */
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

/** Browser-side behaviour: filters, collapsing, theme, lightbox and trace viewer */
export const DASHBOARD_SCRIPT = `
var DASHBOARD = JSON.parse(document.getElementById('dashboard-config').textContent);

function currentTheme() {
  var explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function updateThemeButton() {
  var button = document.getElementById('themeBtn');
  if (!button) return;
  var isDark = currentTheme() === 'dark';
  button.textContent = isDark ? '\\u2600 Modo claro' : '\\u263E Modo oscuro';
  button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}
function toggleTheme() {
  var next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('${THEME_STORAGE_KEY}', next); } catch (e) {}
  updateThemeButton();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);

function openLb(image) {
  document.getElementById('lb-img').src = image.getAttribute('src');
  document.getElementById('lb').classList.add('on');
}
function closeLb() {
  document.getElementById('lb').classList.remove('on');
}

function openTrace(button) {
  var tracePath = button.getAttribute('data-trace');
  if (window.location.protocol === 'file:' || !DASHBOARD.hasTraceViewer) {
    showTraceHelp(tracePath);
    return;
  }
  var viewer = new URL('trace/index.html', window.location.href);
  viewer.searchParams.append('trace', new URL(tracePath, window.location.href).href);
  window.open(viewer.href, '_blank', 'noopener');
}
function showTraceHelp(tracePath) {
  document.getElementById('traceReason').textContent = window.location.protocol === 'file:'
    ? 'El visor de trazas necesita que el dashboard se sirva por HTTP (abierto como fichero local no puede cargar el trace).'
    : 'Esta ejecución no incluye el visor de trazas empaquetado.';
  document.getElementById('traceCmd').textContent = 'npx playwright show-trace "' + DASHBOARD.reportDir + '/' + tracePath + '"';
  document.getElementById('traceModal').classList.add('on');
}
function closeTraceModal() {
  document.getElementById('traceModal').classList.remove('on');
}
function copyCommand(button) {
  var text = button.parentElement.querySelector('code').textContent;
  var restore = function () { button.textContent = 'Copiar'; };
  try {
    navigator.clipboard.writeText(text).then(function () {
      button.textContent = 'Copiado';
      setTimeout(restore, 1500);
    }, restore);
  } catch (e) {
    restore();
  }
}
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeLb();
    closeTraceModal();
  }
});

function updateToggleSectionsButton() {
  var sections = Array.prototype.slice.call(document.querySelectorAll('.category-section:not(.hidden)'));
  var button = document.getElementById('toggleSectionsBtn');
  if (!button) return;
  var allOpen = sections.length === 0 || sections.every(function (section) { return section.open; });
  button.textContent = allOpen ? 'Colapsar todo' : 'Expandir todo';
}
function toggleAllSections() {
  var sections = Array.prototype.slice.call(document.querySelectorAll('.category-section:not(.hidden)'));
  if (sections.length === 0) return;
  var shouldOpen = sections.some(function (section) { return !section.open; });
  sections.forEach(function (section) { section.open = shouldOpen; });
  updateToggleSectionsButton();
}
function filterCards() {
  var text = document.getElementById('filter').value.trim().toLowerCase();
  var status = document.getElementById('statusFilter').value;
  var tag = document.getElementById('tagFilter').value;
  var project = document.getElementById('projectFilter').value;
  var group = document.getElementById('groupFilter').value;
  var filtering = Boolean(text) || status !== 'all' || tag !== 'all' || project !== 'all' || group !== 'all';

  document.querySelectorAll('.card').forEach(function (card) {
    var visible = (!text || card.dataset.filter.indexOf(text) !== -1)
      && (status === 'all' || card.dataset.status === status)
      && (tag === 'all' || (' ' + card.dataset.tags + ' ').indexOf(' ' + tag + ' ') !== -1)
      && (project === 'all' || card.dataset.project === project)
      && (group === 'all' || card.dataset.group === group);
    card.classList.toggle('hidden', !visible);
  });

  document.querySelectorAll('.category-section').forEach(function (section) {
    var hasVisible = section.querySelector('.card:not(.hidden)') !== null;
    section.classList.toggle('hidden', !hasVisible);
    if (hasVisible && filtering) section.open = true;
  });

  var anyVisible = document.querySelector('.card:not(.hidden)') !== null;
  document.getElementById('noResults').classList.toggle('hidden', anyVisible);
  updateToggleSectionsButton();
}
document.addEventListener('toggle', function (event) {
  if (event.target.classList && event.target.classList.contains('category-section')) {
    updateToggleSectionsButton();
  }
}, true);

updateThemeButton();
updateToggleSectionsButton();
`;
