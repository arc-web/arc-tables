// Tinder-style card review for audit findings.
// Single HTML file, self-contained, persists progress to localStorage.
//
// Each card shows ONE issue at a time in plain English. User picks:
//   - Fix it    (approves the suggested fix)
//   - Skip      (defer to later)
//   - Dismiss   (won't fix / doesn't apply)
// Plus an optional note field per card.
//
// At the end, the user gets:
//   1. Summary of decisions
//   2. Claude Code prompt (paste into a Claude session to do the work)
//   3. Raw SQL fixes (for the dev who wants to run them directly)
//   4. List view toggle for browsing all decisions

import type { Schema, AuditFinding } from '../../types.js';
import { baseCss } from '../theme.js';

export function renderAuditCards(schema: Schema, findings: AuditFinding[]): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<title>${escape(schema.profile)} \u2014 Schema Review</title>
<style>
${baseCss}
${cardCss}
</style>
</head>
<body>
<header>
  <div class="head-row">
    <div class="head-title">${escape(schema.profile)} \u2014 Schema Review</div>
    <div class="head-stats" id="stats">0 of ${findings.length}</div>
  </div>
  <div class="progress"><div class="progress-bar" id="progress"></div></div>
  <div class="toolbar">
    <button class="tb-btn" data-view="cards">Cards</button>
    <button class="tb-btn" data-view="list">List</button>
    <button class="tb-btn" data-view="summary">Summary</button>
    <button class="tb-btn ghost" id="reset">Reset</button>
  </div>
</header>

<main id="main">
  <!-- card view -->
  <section id="view-cards" class="view active">
    <div id="card-stage"></div>
  </section>

  <!-- list view -->
  <section id="view-list" class="view">
    <div id="list-content"></div>
  </section>

  <!-- summary view -->
  <section id="view-summary" class="view">
    <div id="summary-content"></div>
  </section>
</main>

<script>
const FINDINGS = ${JSON.stringify(findings)};
const PROFILE = ${JSON.stringify(schema.profile)};
const STORAGE_KEY = 'arc-tables-decisions-' + PROFILE;

// --- State ---
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { decisions: {}, notes: {}, currentIndex: 0 };
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function findingId(f, i) {
  return f.rule + ':' + (f.table || '') + ':' + (f.column || '') + ':' + i;
}

function decisionFor(f, i) {
  return state.decisions[findingId(f, i)];
}

function setDecision(f, i, d) {
  state.decisions[findingId(f, i)] = d;
  saveState();
}

function setNote(f, i, n) {
  if (n) state.notes[findingId(f, i)] = n;
  else delete state.notes[findingId(f, i)];
  saveState();
}

function noteFor(f, i) {
  return state.notes[findingId(f, i)] || '';
}

function decidedCount() {
  return Object.keys(state.decisions).length;
}

function updateProgress() {
  const decided = decidedCount();
  document.getElementById('stats').textContent = decided + ' of ' + FINDINGS.length + ' reviewed';
  document.getElementById('progress').style.width = (FINDINGS.length === 0 ? 0 : (decided / FINDINGS.length) * 100) + '%';
}

// --- Card rendering ---
const CATEGORY_LABEL = {
  naming:     { label: 'Naming',         color: '#00d4ff' },
  cleanup:    { label: 'Cleanup',        color: '#ffc800' },
  connection: { label: 'Connection',     color: '#bb77ff' },
  structure:  { label: 'Structure',      color: '#00dc82' },
  broken:     { label: 'Broken \u26A0', color: '#ff5050' },
};

function renderCard() {
  const stage = document.getElementById('card-stage');
  // Find next undecided finding starting from currentIndex
  let i = state.currentIndex;
  while (i < FINDINGS.length && decisionFor(FINDINGS[i], i)) i++;
  state.currentIndex = i;
  saveState();

  if (i >= FINDINGS.length) {
    // All done - show finish state
    if (FINDINGS.length === 0) {
      stage.innerHTML = '<div class="empty">\u2713 No issues found in this schema.</div>';
    } else {
      stage.innerHTML = '<div class="finish">' +
        '<div class="finish-check">\u2713</div>' +
        '<h2>All ' + FINDINGS.length + ' issues reviewed</h2>' +
        '<p>Switch to <strong>Summary</strong> to grab the Claude Code prompt or raw SQL.</p>' +
        '<button class="btn primary big" onclick="switchView(\\'summary\\')">View Summary</button>' +
        '</div>';
    }
    return;
  }

  const f = FINDINGS[i];
  const cat = CATEGORY_LABEL[f.category] || CATEGORY_LABEL.cleanup;
  const note = noteFor(f, i);

  stage.innerHTML = '<article class="review-card">' +
    '<div class="card-tag" style="color:' + cat.color + '; border-color:' + cat.color + '44; background:' + cat.color + '12">' + cat.label + '</div>' +
    '<h2 class="card-title">' + escapeHtml(f.plainTitle) + '</h2>' +
    '<div class="card-section"><div class="card-label">What\\'s going on</div><div class="card-body">' + escapeHtml(f.plainWhat) + '</div></div>' +
    '<div class="card-section"><div class="card-label">Why it matters</div><div class="card-body">' + escapeHtml(f.plainWhy) + '</div></div>' +
    '<div class="card-section"><div class="card-label">What fixing it looks like</div><div class="card-body">' + escapeHtml(f.plainFix) + '</div></div>' +
    (f.fixSql ? '<details class="card-sql"><summary>Show the technical fix (SQL)</summary><pre><code>' + escapeHtml(f.fixSql) + '</code></pre></details>' : '') +
    '<div class="note-row">' +
      '<label class="card-label">Add a note (optional)</label>' +
      '<textarea id="note-input" placeholder="Why are you making this decision? What context matters?">' + escapeHtml(note) + '</textarea>' +
    '</div>' +
    '<div class="actions">' +
      '<button class="btn dismiss" data-action="dismiss">\u2715 Won\\'t fix</button>' +
      '<button class="btn skip" data-action="skip">\u23ED Skip for now</button>' +
      '<button class="btn fix" data-action="fix">\u2713 Fix this</button>' +
    '</div>' +
    '<div class="card-meta">' + (i + 1) + ' of ' + FINDINGS.length + ' \u00B7 ' + escapeHtml(f.rule) + (f.table ? ' \u00B7 ' + escapeHtml(f.table) : '') + '</div>' +
  '</article>';

  // Wire up actions
  stage.querySelectorAll('.actions .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const noteInput = document.getElementById('note-input');
      if (noteInput && noteInput.value.trim()) setNote(f, i, noteInput.value.trim());
      setDecision(f, i, btn.dataset.action);
      state.currentIndex = i + 1;
      saveState();
      updateProgress();
      renderCard();
    });
  });

  // Auto-save note on blur
  const noteInput = document.getElementById('note-input');
  if (noteInput) {
    noteInput.addEventListener('blur', () => {
      setNote(f, i, noteInput.value.trim());
    });
  }
}

// --- List view ---
function renderList() {
  const c = document.getElementById('list-content');
  let html = '<table class="list-table"><thead><tr>' +
    '<th>Status</th><th>Category</th><th>Title</th><th>Note</th><th>Action</th>' +
    '</tr></thead><tbody>';
  FINDINGS.forEach((f, i) => {
    const d = decisionFor(f, i) || '';
    const cat = CATEGORY_LABEL[f.category] || CATEGORY_LABEL.cleanup;
    const statusEmoji = d === 'fix' ? '\u2713' : d === 'dismiss' ? '\u2715' : d === 'skip' ? '\u23ED' : '\u00B7';
    const statusCls = d ? 'st-' + d : 'st-pending';
    html += '<tr class="' + statusCls + '">' +
      '<td><span class="status">' + statusEmoji + '</span></td>' +
      '<td><span class="cat-pill" style="color:' + cat.color + '; border-color:' + cat.color + '66">' + cat.label + '</span></td>' +
      '<td>' + escapeHtml(f.plainTitle) + '</td>' +
      '<td class="note-cell">' + escapeHtml(noteFor(f, i)) + '</td>' +
      '<td><button class="btn-mini" data-jump="' + i + '">Open</button></td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  c.innerHTML = html;

  c.querySelectorAll('[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentIndex = parseInt(btn.dataset.jump);
      saveState();
      switchView('cards');
      renderCard();
    });
  });
}

// --- Summary view ---
function renderSummary() {
  const c = document.getElementById('summary-content');
  const fixes = [];
  const dismissed = [];
  const skipped = [];
  const pending = [];

  FINDINGS.forEach((f, i) => {
    const d = decisionFor(f, i);
    const note = noteFor(f, i);
    const item = { f, i, note };
    if (d === 'fix') fixes.push(item);
    else if (d === 'dismiss') dismissed.push(item);
    else if (d === 'skip') skipped.push(item);
    else pending.push(item);
  });

  // Build Claude prompt
  let claudePrompt = 'I need you to apply the following schema changes to my Postgres/Supabase database.\\n\\n';
  claudePrompt += 'Each change has been individually reviewed and approved. Some have notes about WHY or specific context to keep in mind.\\n\\n';
  claudePrompt += 'Before running any change: check for dependent views, FKs, and other tables that reference what you\\'re changing. Drop or update dependents first.\\n\\n';
  claudePrompt += 'CHANGES TO APPLY:\\n\\n';
  fixes.forEach((item, idx) => {
    claudePrompt += (idx + 1) + '. ' + item.f.plainTitle + '\\n';
    claudePrompt += '   What: ' + item.f.plainWhat + '\\n';
    claudePrompt += '   Fix: ' + item.f.plainFix + '\\n';
    if (item.f.fixSql) claudePrompt += '   Suggested SQL: ' + item.f.fixSql + '\\n';
    if (item.note) claudePrompt += '   USER NOTE: ' + item.note + '\\n';
    claudePrompt += '\\n';
  });

  // Build raw SQL
  let rawSql = '-- Approved fixes from arc-tables review\\n';
  rawSql += '-- Profile: ' + PROFILE + '\\n';
  rawSql += '-- Reviewed: ' + new Date().toISOString().slice(0, 10) + '\\n\\n';
  fixes.forEach(item => {
    rawSql += '-- ' + item.f.plainTitle + '\\n';
    if (item.note) rawSql += '-- NOTE: ' + item.note + '\\n';
    if (item.f.fixSql) rawSql += item.f.fixSql + '\\n\\n';
    else rawSql += '-- (no SQL emitted - manual fix required)\\n\\n';
  });

  c.innerHTML =
    '<div class="sum-stats">' +
      '<div class="stat fix"><div class="n">' + fixes.length + '</div><div class="l">to fix</div></div>' +
      '<div class="stat dismiss"><div class="n">' + dismissed.length + '</div><div class="l">won\\'t fix</div></div>' +
      '<div class="stat skip"><div class="n">' + skipped.length + '</div><div class="l">deferred</div></div>' +
      '<div class="stat pending"><div class="n">' + pending.length + '</div><div class="l">not reviewed</div></div>' +
    '</div>' +
    '<div class="sum-grid">' +
      '<div class="sum-block">' +
        '<div class="sum-h">Claude Code prompt <button class="btn-mini" data-copy="claude">Copy</button></div>' +
        '<textarea id="claude-prompt" readonly>' + escapeHtml(claudePrompt) + '</textarea>' +
        '<div class="hint">Paste this into a Claude Code conversation to have everything fixed for you.</div>' +
      '</div>' +
      '<div class="sum-block">' +
        '<div class="sum-h">Raw SQL <button class="btn-mini" data-copy="sql">Copy</button></div>' +
        '<textarea id="raw-sql" readonly>' + escapeHtml(rawSql) + '</textarea>' +
        '<div class="hint">For the dev who wants to run them directly in psql / Supabase SQL editor.</div>' +
      '</div>' +
    '</div>';

  c.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.copy;
      const ta = document.getElementById(key === 'claude' ? 'claude-prompt' : 'raw-sql');
      ta.select();
      navigator.clipboard.writeText(ta.value).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });
}

// --- View switching ---
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector('[data-view="' + name + '"]').classList.add('active');
  if (name === 'cards') renderCard();
  if (name === 'list') renderList();
  if (name === 'summary') renderSummary();
}

document.querySelectorAll('.tb-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear all your decisions and notes? This cannot be undone.')) {
    state = { decisions: {}, notes: {}, currentIndex: 0 };
    saveState();
    updateProgress();
    switchView('cards');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  const view = document.querySelector('.view.active').id.replace('view-', '');
  if (view !== 'cards') return;
  if (e.key === 'ArrowRight' || e.key === 'f') document.querySelector('[data-action="fix"]')?.click();
  else if (e.key === 'ArrowLeft' || e.key === 'd') document.querySelector('[data-action="dismiss"]')?.click();
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === ' ') { e.preventDefault(); document.querySelector('[data-action="skip"]')?.click(); }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Init
updateProgress();
document.querySelector('[data-view="cards"]').classList.add('active');
renderCard();
</script>
</body></html>`;
}

const cardCss = `
body { padding-top: 0; }
header {
  position:sticky; top:0; z-index:50; padding:18px 28px 0;
  background:linear-gradient(${'180deg'}, rgba(6,6,15,0.97) 80%, rgba(6,6,15,0));
  backdrop-filter:blur(8px);
}
.head-row { display:flex; align-items:baseline; justify-content:space-between; max-width:1100px; margin:0 auto 8px; }
.head-title { font-size:13px; letter-spacing:4px; text-transform:uppercase; color:rgba(0,200,255,0.6); font-weight:700; }
.head-stats { font-size:11px; color:rgba(255,255,255,0.45); letter-spacing:1px; }
.progress { max-width:1100px; margin:0 auto; height:3px; background:rgba(0,200,255,0.08); border-radius:2px; overflow:hidden; }
.progress-bar { height:100%; background:linear-gradient(90deg, #00d4ff, #00dc82); transition:width .3s ease; }
.toolbar { max-width:1100px; margin:14px auto 18px; display:flex; gap:8px; }
.tb-btn {
  font-family:inherit; background:rgba(10,14,30,0.7); color:rgba(200,210,255,0.6); border:1px solid rgba(255,255,255,0.08);
  padding:7px 16px; border-radius:8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer;
  transition:all .15s;
}
.tb-btn:hover { color:#00d4ff; border-color:rgba(0,200,255,0.4); }
.tb-btn.active { color:#00d4ff; border-color:rgba(0,200,255,0.6); background:rgba(0,212,255,0.06); }
.tb-btn.ghost { margin-left:auto; }

main { max-width:1100px; margin:0 auto; padding:0 28px 80px; position:relative; z-index:2; }
.view { display:none; }
.view.active { display:block; }

/* CARD */
.review-card {
  background:rgba(10,14,30,0.94); border:1px solid rgba(0,200,255,0.18);
  border-radius:18px; padding:36px 40px 28px; max-width:760px; margin:30px auto;
  box-shadow:0 0 50px rgba(0,200,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
  position:relative;
}
.card-tag {
  display:inline-block; padding:5px 14px; border-radius:20px; border:1px solid;
  font-size:10px; letter-spacing:2px; text-transform:uppercase; font-weight:600; margin-bottom:18px;
}
.card-title {
  font-size:22px; line-height:1.35; color:#fff; margin-bottom:24px; font-weight:600; font-family:system-ui, -apple-system, sans-serif;
  letter-spacing:-0.3px;
}
.card-section { margin-bottom:18px; }
.card-label {
  font-size:9px; letter-spacing:2.5px; text-transform:uppercase; color:rgba(0,200,255,0.55);
  font-weight:600; margin-bottom:6px;
}
.card-body {
  font-size:14px; line-height:1.65; color:rgba(220,230,255,0.78);
  font-family:system-ui, -apple-system, sans-serif;
}
.card-sql {
  margin:18px 0 8px; font-size:11px; color:rgba(160,180,220,0.6);
  border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;
}
.card-sql summary { cursor:pointer; color:rgba(0,200,255,0.6); letter-spacing:1.5px; text-transform:uppercase; font-size:10px; }
.card-sql summary:hover { color:#00d4ff; }
.card-sql pre { margin-top:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(0,200,255,0.12); border-radius:6px; padding:12px 14px; font-family:'SF Mono', monospace; color:#00dc82; font-size:11.5px; white-space:pre-wrap; }

.note-row { margin:22px 0 18px; }
.note-row textarea {
  width:100%; min-height:60px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08);
  border-radius:8px; padding:10px 14px; color:#e0e8ff; font-size:13px; font-family:system-ui, -apple-system, sans-serif;
  resize:vertical; outline:none; transition:border-color .15s; line-height:1.5;
}
.note-row textarea:focus { border-color:rgba(0,200,255,0.5); }
.note-row textarea::placeholder { color:rgba(255,255,255,0.25); }

.actions { display:flex; gap:10px; margin-top:8px; }
.btn {
  flex:1; padding:14px 18px; border-radius:10px; cursor:pointer; font-family:system-ui, sans-serif;
  font-size:14px; font-weight:600; transition:all .15s; border:1px solid; letter-spacing:0.2px;
}
.btn.dismiss { background:rgba(255,80,80,0.06); color:rgba(255,150,150,0.85); border-color:rgba(255,80,80,0.25); }
.btn.dismiss:hover { background:rgba(255,80,80,0.15); border-color:rgba(255,80,80,0.6); color:#ff8080; }
.btn.skip { background:rgba(255,200,0,0.06); color:rgba(255,220,140,0.85); border-color:rgba(255,200,0,0.22); }
.btn.skip:hover { background:rgba(255,200,0,0.15); border-color:rgba(255,200,0,0.6); color:#ffd866; }
.btn.fix { background:rgba(0,220,130,0.08); color:rgba(150,255,200,0.95); border-color:rgba(0,220,130,0.35); }
.btn.fix:hover { background:rgba(0,220,130,0.18); border-color:rgba(0,220,130,0.7); color:#90ffc8; box-shadow:0 0 20px rgba(0,220,130,0.2); }
.btn.primary { background:rgba(0,200,255,0.1); color:#00d4ff; border-color:rgba(0,200,255,0.4); }
.btn.primary:hover { background:rgba(0,200,255,0.2); }
.btn.big { padding:14px 36px; font-size:15px; margin-top:14px; }

.card-meta {
  margin-top:20px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05);
  font-family:'SF Mono', monospace; font-size:10px; color:rgba(255,255,255,0.25); letter-spacing:1px;
}

.empty, .finish {
  text-align:center; padding:80px 20px; max-width:560px; margin:60px auto;
  background:rgba(10,14,30,0.6); border:1px solid rgba(0,220,130,0.2); border-radius:18px;
}
.finish-check {
  font-size:64px; color:#00dc82; line-height:1; margin-bottom:20px; text-shadow:0 0 30px rgba(0,220,130,0.4);
}
.finish h2 { font-family:system-ui; color:#fff; font-size:22px; margin-bottom:10px; font-weight:600; }
.finish p { color:rgba(220,230,255,0.6); font-family:system-ui; font-size:14px; line-height:1.6; }

/* LIST */
.list-table {
  width:100%; border-collapse:collapse; margin-top:24px;
  background:rgba(10,14,30,0.6); border:1px solid rgba(0,200,255,0.12); border-radius:12px; overflow:hidden;
}
.list-table th {
  text-align:left; padding:12px 16px; font-size:9px; letter-spacing:2px; text-transform:uppercase;
  color:rgba(0,200,255,0.5); border-bottom:1px solid rgba(0,200,255,0.15); font-weight:600;
}
.list-table td { padding:12px 16px; font-size:13px; color:rgba(220,230,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); font-family:system-ui; }
.list-table tr:hover { background:rgba(0,200,255,0.03); }
.list-table tr.st-fix .status { color:#00dc82; }
.list-table tr.st-dismiss .status { color:#ff8080; }
.list-table tr.st-skip .status { color:#ffd866; }
.list-table tr.st-pending .status { color:rgba(255,255,255,0.2); }
.status { font-size:16px; font-weight:bold; }
.cat-pill { font-size:9px; letter-spacing:1.5px; padding:3px 10px; border-radius:12px; border:1px solid; text-transform:uppercase; font-family:'SF Mono', monospace; }
.note-cell { font-style:italic; color:rgba(255,255,255,0.4); max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.btn-mini {
  background:rgba(0,200,255,0.08); color:#00d4ff; border:1px solid rgba(0,200,255,0.3); padding:4px 10px;
  border-radius:6px; font-size:10px; cursor:pointer; font-family:'SF Mono', monospace; letter-spacing:1px; text-transform:uppercase;
}
.btn-mini:hover { background:rgba(0,200,255,0.18); }

/* SUMMARY */
.sum-stats { display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; margin:28px 0 24px; }
.stat {
  background:rgba(10,14,30,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:18px 20px; text-align:center;
}
.stat .n { font-size:32px; font-weight:700; font-family:system-ui; color:#fff; line-height:1; margin-bottom:6px; }
.stat .l { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.4); }
.stat.fix { border-color:rgba(0,220,130,0.3); }
.stat.fix .n { color:#90ffc8; }
.stat.dismiss { border-color:rgba(255,80,80,0.25); }
.stat.dismiss .n { color:#ff9090; }
.stat.skip { border-color:rgba(255,200,0,0.25); }
.stat.skip .n { color:#ffd866; }
.stat.pending .n { color:rgba(255,255,255,0.5); }

.sum-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.sum-block {
  background:rgba(10,14,30,0.7); border:1px solid rgba(0,200,255,0.15); border-radius:12px; padding:18px;
}
.sum-h {
  display:flex; justify-content:space-between; align-items:center;
  font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(0,200,255,0.55); margin-bottom:10px; font-weight:600;
}
.sum-block textarea {
  width:100%; height:340px; background:rgba(0,0,0,0.4); border:1px solid rgba(0,200,255,0.12); border-radius:8px;
  padding:12px 14px; color:rgba(220,230,255,0.8); font-family:'SF Mono', monospace; font-size:11.5px; line-height:1.6;
  resize:vertical; outline:none;
}
.hint { margin-top:8px; font-size:11px; color:rgba(255,255,255,0.35); font-family:system-ui; }

@media (max-width: 800px) {
  .sum-stats { grid-template-columns:repeat(2, 1fr); }
  .sum-grid { grid-template-columns:1fr; }
  .actions { flex-direction:column; }
}
`.trim();

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
