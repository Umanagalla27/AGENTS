/**
 * NEXUS AI — Enterprise Intelligent Customer Operations
 * Application Controller v2.0
 *
 * Architecture:
 *   • Centralized immutable app state
 *   • Panel-based routing (hash)
 *   • All API calls delegated to api.js
 *   • Toast notifications
 *   • Lucide icon re-initialization after DOM mutations
 *   • Keyboard shortcuts (Ctrl+K, Escape)
 *   • Responsive sidebar (mobile drawer)
 *   • Polling for approvals & health
 */

import * as API from './api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_ICONS = {
  duplicate_charge:    '💳',
  refund_request:      '💰',
  billing_dispute:     '⚖️',
  payment_failure:     '🔴',
  technical_issue:     '🔧',
  account_management:  '👤',
  order_issue:         '📦',
  general_inquiry:     '❓',
  unknown:             '❓',
};

const INTENT_CLASS = {
  duplicate_charge:   'billing',
  billing_dispute:    'billing',
  refund_request:     'refund',
  payment_failure:    'refund',
  technical_issue:    'technical',
  account_management: 'general',
  order_issue:        'general',
  general_inquiry:    'general',
};

const AGENT_EMOJI = {
  triage_agent:        '🎯',
  customer_agent:      '👤',
  rag_agent:           '📚',
  investigation_agent: '🔍',
  resolution_agent:    '⚡',
  review_agent:        '✅',
  communication_node:  '📨',
};

const PRIORITY_BADGE = {
  critical: 'badge-danger',
  high:     'badge-warning',
  medium:   'badge-info',
  low:      'badge-success',
};

const RISK_BADGE = {
  critical: 'badge-danger',
  high:     'badge-danger',
  medium:   'badge-warning',
  low:      'badge-success',
};

const PANEL_META = {
  overview:  ['Overview',        'Executive dashboard'],
  support:   ['Customer Support','Multi-agent AI support workspace'],
  tickets:   ['Tickets',         'Agent execution trace & investigation details'],
  approvals: ['Approval Center', 'High-risk action review queue'],
  agents:    ['AI Agents',       'LangGraph multi-agent architecture'],
  knowledge: ['Knowledge Base',  'Enterprise RAG policy documents'],
  analytics: ['Analytics',       'Operational metrics & performance'],
  sessions:  ['Session History', 'All customer support sessions'],
  health:    ['System Health',   'Real-time service status'],
  settings:  ['Settings',        'Platform configuration reference'],
};

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const state = {
  panel:          'overview',
  sessionId:      null,
  allSessions:    [],
  metricsTimer:   null,
  healthTimer:    null,
  approvalTimer:  null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

/** @param {string} name */
window.showPanel = function (name) {
  // Deactivate all
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });

  // Activate target
  document.getElementById(`panel-${name}`)?.classList.remove('hidden');
  const navEl = document.getElementById(`nav-${name}`);
  if (navEl) { navEl.classList.add('active'); navEl.setAttribute('aria-current', 'page'); }

  // Update topbar
  const [title, crumb] = PANEL_META[name] || ['Dashboard', ''];
  setText('page-title', title);
  setText('page-crumb', crumb);

  state.panel = name;

  // Clear stale intervals
  stopTimers();

  // Panel-specific bootstrapping
  switch (name) {
    case 'overview':   loadMetrics(); break;
    case 'analytics':  loadMetrics(); startMetricsTimer(); break;
    case 'approvals':  loadApprovals(); startApprovalTimer(); break;
    case 'health':     loadHealth(); startHealthTimer(); break;
    case 'knowledge':  loadKnowledge(); break;
    case 'sessions':   loadSessionsPage(); break;
  }

  closeMob();
  reIcons();
};

function stopTimers () {
  clearInterval(state.metricsTimer);
  clearInterval(state.healthTimer);
  clearInterval(state.approvalTimer);
  state.metricsTimer = state.healthTimer = state.approvalTimer = null;
}
function startMetricsTimer()  { state.metricsTimer  = setInterval(loadMetrics,    12_000); }
function startHealthTimer()   { state.healthTimer   = setInterval(loadHealth,     15_000); }
function startApprovalTimer() { state.approvalTimer = setInterval(loadApprovals,  10_000); }

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

window.toggleSidebar = function () {
  document.getElementById('sidebar').classList.toggle('collapsed');
};
window.openMob  = function () {
  document.getElementById('sidebar').classList.add('mob-open');
  document.getElementById('mob-overlay').classList.add('show');
};
window.closeMob = function () {
  document.getElementById('sidebar').classList.remove('mob-open');
  document.getElementById('mob-overlay').classList.remove('show');
};

// ─────────────────────────────────────────────────────────────────────────────
// API Health / Topbar Status
// ─────────────────────────────────────────────────────────────────────────────

async function checkAPI () {
  try {
    const d = await API.getHealth();
    setClass('sys-dot',  'status-dot', 'healthy');
    setClass('sidebar-dot', 'status-dot', 'healthy');
    setClass('sys-pill', 'sys-pill', 'healthy');
    setClass('chat-status-dot', 'status-dot', 'healthy');
    setText('sys-text', 'All Systems Operational');
    setText('sidebar-status-text', 'API Connected');

    // Health panel live data
    setText('h-version',       d.version        || '1.0.0');
    setText('h-uptime',        fmtUptime(d.uptime_seconds || 0));
    setText('h-sessions-count',d.total_sessions  ?? '—');

    updateHealthCard('hc-backend',    'hc-healthy', 'hs-backend',    'Healthy');
    updateHealthCard('hc-supervisor', 'hc-healthy', 'hs-supervisor', 'Running');

    const badge = document.getElementById('platform-status-badge');
    if (badge) { badge.className = 'badge badge-success'; badge.textContent = '● All Systems Operational'; }

    if (d.config_warnings?.length) {
      showToast(`Config warning: ${d.config_warnings[0]}`, 'warning', 8000);
    }

  } catch {
    setClass('sys-dot',  'status-dot', 'offline');
    setClass('sidebar-dot', 'status-dot', 'offline');
    setClass('sys-pill', 'sys-pill', 'offline');
    setClass('chat-status-dot', 'status-dot', 'offline');
    setText('sys-text', 'API Unreachable');
    setText('sidebar-status-text', 'Offline');

    updateHealthCard('hc-backend',    'hc-error', 'hs-backend',    'Offline');
    updateHealthCard('hc-supervisor', 'hc-error', 'hs-supervisor', 'Unavailable');

    const badge = document.getElementById('platform-status-badge');
    if (badge) { badge.className = 'badge badge-danger'; badge.textContent = '● Platform Unreachable'; }
  }
}

function updateHealthCard (cardId, cardClass, pillId, label) {
  const card = document.getElementById(cardId);
  if (card) card.className = `health-card ${cardClass}`;
  setText(pillId, label);
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────────────────────────────────────

const TOAST_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

window.showToast = function (msg, type = 'info', ms = 4500) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.setAttribute('role', 'alert');
  t.innerHTML = `
    <div class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
    <div class="toast-msg">${esc(msg)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, ms);
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading Overlay
// ─────────────────────────────────────────────────────────────────────────────

function showLoading (text = 'Processing…', steps = []) {
  setText('loading-text', text);
  const el = document.getElementById('loading-steps');
  if (el) el.innerHTML = steps.map(s => `<div class="ls-item" id="ls-${s.id}">${s.label}</div>`).join('');
  document.getElementById('loading-overlay')?.classList.remove('hidden');
}
function hideLoading () {
  document.getElementById('loading-overlay')?.classList.add('hidden');
}
function setLoadStep (id, cls) {
  const el = document.getElementById(`ls-${id}`);
  if (!el) return;
  el.className = `ls-item ${cls}`;
  if (cls === 'ls-active') el.textContent = `▶ ${el.textContent.replace(/^[▶✓] /, '')}`;
  if (cls === 'ls-done')   el.textContent = `✓ ${el.textContent.replace(/^[▶✓] /, '')}`;
}
function setLoadText (t) { setText('loading-text', t); }

// ─────────────────────────────────────────────────────────────────────────────
// Greeting
// ─────────────────────────────────────────────────────────────────────────────

function setGreeting () {
  const h = new Date().getHours();
  setText('greeting', h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening');
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat — Message sending
// ─────────────────────────────────────────────────────────────────────────────

const PIPE_AGENTS = ['triage_agent','customer_agent','rag_agent','investigation_agent','resolution_agent','review_agent','communication_node'];
const PIPE_LABELS = ['Triage Agent','Customer Intel','RAG Knowledge','Investigation','Resolution','Review & Audit','Communication'];

window.handleChatKey = function (ev) {
  if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendMsg(); }
};
window.sendQuickPrompt = function (text) {
  showPanel('support');
  const inp = document.getElementById('chat-input');
  if (inp) inp.value = text;
  sendMsg();
};

window.sendMsg = async function () {
  const inp      = document.getElementById('chat-input');
  const message  = inp?.value.trim();
  if (!message) return;

  const customerId = document.getElementById('cust-id')?.value.trim() || null;
  const channel    = document.getElementById('channel')?.value || 'web';

  // Remove welcome state
  document.getElementById('chat-welcome')?.remove();

  addUserBubble(message);
  inp.value = '';

  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;

  resetPipeline();
  const typingEl = addTyping();

  showLoading('Processing through AI agents…', PIPE_AGENTS.map((id, i) => ({ id, label: PIPE_LABELS[i] })));

  let si = 0;
  const stTimer = setInterval(() => {
    if (si > 0) { stepDone(PIPE_AGENTS[si - 1]); setLoadStep(PIPE_AGENTS[si - 1], 'ls-done'); }
    if (si < PIPE_AGENTS.length) {
      stepActive(PIPE_AGENTS[si]);
      setLoadStep(PIPE_AGENTS[si], 'ls-active');
      setLoadText(`Running ${PIPE_LABELS[si]}…`);
      si++;
    }
  }, 700);

  try {
    pushTerminalLog('INFO', `Dispatching query to LangGraph Triage: "${message.slice(0, 35)}…"`);
    const data = await API.sendChatMessage({ message, customer_id: customerId, channel, session_id: state.sessionId });
    clearInterval(stTimer);
    PIPE_AGENTS.forEach(a => { stepDone(a); setLoadStep(a, 'ls-done'); });
    typingEl?.remove();

    pushTerminalLog('SUCCESS', `Multi-agent resolution completed. Intent: ${data.intent} (${data.latency_ms.toFixed(0)}ms)`);
    state.sessionId = data.session_id;
    addAIBubble(data);
    updateSessionPanel(data);
    updateCustomerPanel(data);
    setText('active-session-label', `Session: ${data.session_id.slice(0, 10)}…`);

    if (data.requires_approval) {
      pushTerminalLog('WARN', `High-risk action detected for ${data.ticket_id}. HITL approval requested.`);
      addHITLBanner(data);
      setApprovalBadge(1);
      loadApprovals();
      showToast('⚠ Human approval required for this high-risk action — review in Approvals.', 'warning', 7000);
    } else {
      showToast('✓ Resolution generated successfully.', 'success');
    }

    loadChatSessions();
  } catch (err) {
    clearInterval(stTimer);
    typingEl?.remove();
    PIPE_AGENTS.forEach(a => stepDone(a));
    addSysMsg(`Unable to process: ${err.message}. Ensure the backend is running on port 8000.`, 'error');
    showToast(`Error: ${err.message}`, 'error', 6000);
  } finally {
    hideLoading();
    if (sendBtn) sendBtn.disabled = false;
  }
};

window.clearChat = function () {
  state.sessionId = null;
  const m = document.getElementById('chat-messages');
  if (!m) return;
  m.innerHTML = `
    <div class="chat-empty" id="chat-welcome">
      <div class="chat-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
      <h3>How can we help today?</h3>
      <p>Describe a customer issue and NEXUS AI will classify, investigate, and resolve it.</p>
      <div class="quick-prompts">
        <button class="quick-prompt" onclick="sendQuickPrompt('I was charged twice for \$99.99 and need a refund immediately')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Report duplicate charge
        </button>
        <button class="quick-prompt" onclick="sendQuickPrompt('I need a refund for my recent subscription payment')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Request refund
        </button>
        <button class="quick-prompt" onclick="sendQuickPrompt('My payment failed but I see a pending charge on my account')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Payment failure issue
        </button>
        <button class="quick-prompt" onclick="sendQuickPrompt('What is your refund policy for subscription charges?')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Refund policy query
        </button>
      </div>
    </div>`;
  resetPipeline();
  setText('active-session-label', 'No active session');
  setText('session-info-panel', '');
  reIcons();
};

// Bubble builders
function addUserBubble (text) {
  const c = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'msg user';
  d.innerHTML = `
    <div class="msg-av"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
    <div class="msg-body">
      <div class="msg-bubble">${esc(text).replace(/\n/g, '<br>')}</div>
      <div class="msg-meta">${fmtTime(Date.now())}</div>
    </div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function addTyping () {
  const c = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'typing';
  d.id = 'chat-typing';
  d.innerHTML = `
    <div class="msg-av" style="background:var(--brand-glow);border:1px solid var(--border-brand)">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand-400)" stroke-width="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    </div>
    <div class="typing-dots" aria-label="AI processing">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
  return d;
}

function addAIBubble (data) {
  const c = document.getElementById('chat-messages');
  const icoKey = Object.keys(INTENT_ICONS).includes(data.intent) ? data.intent : 'unknown';
  const riskC  = { high: 'var(--danger)', critical: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[data.risk_level] || 'var(--text-tertiary)';

  const d = document.createElement('div');
  d.className = 'msg ai';
  const thoughtId = `thought-${Math.random().toString(36).substring(2, 9)}`;

  d.innerHTML = `
    <div class="msg-av" style="background:var(--brand-glow);border:1px solid var(--border-brand)">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand-400)" stroke-width="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    </div>
    <div class="msg-body">
      <div class="msg-bubble">${esc(data.response || 'Resolution in progress.').replace(/\n/g, '<br>')}</div>
      
      <!-- Expandable Agent Thought Breakdown -->
      <div class="thought-accordion">
        <div class="thought-header" onclick="document.getElementById('${thoughtId}').classList.toggle('hidden')">
          <span>🧠 Multi-Agent Execution Breakdown (4 Steps)</span>
          <span>▾</span>
        </div>
        <div class="thought-body hidden" id="${thoughtId}">
          <div>🎯 <b>Triage Agent:</b> Classified intent as <code class="mono">${esc(data.intent)}</code> (${data.priority?.toUpperCase()} Priority)</div>
          <div>👤 <b>Customer Intel:</b> Customer record loaded (${esc(data.customer_id || 'CUST-8492')})</div>
          <div>📚 <b>RAG Knowledge:</b> Grounded against policy vector store (BM25 + RRF)</div>
          <div>🔍 <b>Investigation Agent:</b> Latency ${data.latency_ms.toFixed(0)}ms · Action: ${data.requires_approval ? 'Escalated to HITL' : 'Auto-Resolved'}</div>
        </div>
      </div>

      <div class="msg-meta">
        <span class="intent-chip ${INTENT_CLASS[icoKey] || 'general'}">${INTENT_ICONS[icoKey]} ${data.intent.replace(/_/g,' ')}</span>
        <span>·</span>
        <span class="mono" style="font-size:10px">${data.ticket_id}</span>
        <span>·</span>
        <span style="font-family:var(--font-mono);font-size:10px">${data.latency_ms.toFixed(0)}ms</span>
        <span>·</span>
        <span style="color:${riskC};font-weight:var(--fw-semi)">${data.risk_level} risk</span>
        <span>·</span>
        <span>${fmtTime(Date.now())}</span>
      </div>
    </div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function addHITLBanner (data) {
  const c = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'hitl-banner';
  d.innerHTML = `
    <div class="hitl-icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <div class="hitl-text">
      <h4>Human Approval Required</h4>
      <p>This ${data.intent.replace(/_/g,' ')} involves a ${data.risk_level}-risk action requiring supervisor authorization.</p>
    </div>
    <button class="btn btn-danger btn-sm" onclick="showPanel('approvals')">Review →</button>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function addSysMsg (text, type = 'info') {
  const c = document.getElementById('chat-messages');
  const colorMap = { error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--text-tertiary)' };
  const d = document.createElement('div');
  d.style.cssText = `text-align:center;padding:var(--sp-3);font-size:var(--fs-12);color:${colorMap[type] || colorMap.info};border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--bg-card);margin:var(--sp-2) 0`;
  d.innerHTML = `⚠ ${esc(text)} <button class="btn btn-ghost btn-sm" onclick="checkAPI()" style="margin-left:6px">Retry</button>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Info + Customer Panel
// ─────────────────────────────────────────────────────────────────────────────

function updateSessionPanel (data) {
  const panel = document.getElementById('session-info-panel');
  if (!panel) return;

  const riskC  = { critical: 'var(--danger)', high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }[data.risk_level] || 'var(--text-tertiary)';
  const prioC  = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)',   low: 'var(--success)' }[data.priority]   || 'var(--text-tertiary)';

  panel.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
      <div class="label-row"><span class="lbl">Session</span><span class="mono-val">${data.session_id.slice(0,14)}…</span></div>
      <div class="label-row"><span class="lbl">Ticket</span><span class="mono-val">${data.ticket_id || '—'}</span></div>
      <div class="label-row"><span class="lbl">Intent</span><span class="val">${INTENT_ICONS[data.intent] || '❓'} ${data.intent.replace(/_/g,' ')}</span></div>
      <div class="label-row"><span class="lbl">Priority</span><span style="color:${prioC};font-weight:var(--fw-semi);font-size:var(--fs-12)">${data.priority?.toUpperCase()}</span></div>
      <div class="label-row"><span class="lbl">Risk</span><span style="color:${riskC};font-weight:var(--fw-semi);font-size:var(--fs-12)">${data.risk_level?.toUpperCase()}</span></div>
      <div class="label-row"><span class="lbl">Latency</span><span class="mono-val">${data.latency_ms.toFixed(0)}ms</span></div>
      <div class="label-row"><span class="lbl">Approval</span><span style="font-size:var(--fs-12);color:${data.requires_approval ? 'var(--danger)' : 'var(--success)'};font-weight:var(--fw-semi)">${data.requires_approval ? '🚨 Required' : '✅ Not Required'}</span></div>
    </div>
    <div style="margin-top:var(--sp-3)">
      <button class="btn btn-ghost btn-sm w-full" onclick="viewCurrent()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Full Trace
      </button>
    </div>`;
}

function updateCustomerPanel (data) {
  const custId = data.customer_id || (data.agents_completed?.length ? 'CUST-?' : null);
  if (!custId) return;

  const initials = custId.slice(-3).toUpperCase();
  setText('cust-avatar', initials);
  setText('cust-name',   custId);
  setText('cust-tier',   data.priority ? `Priority: ${data.priority}` : 'Standard');

  const fields = document.getElementById('cust-fields');
  if (fields) {
    fields.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
        <div class="label-row"><span class="lbl">Customer ID</span><span class="mono-val">${esc(custId)}</span></div>
        <div class="label-row"><span class="lbl">Agents Run</span><span class="val">${(data.agents_completed || []).length}</span></div>
        <div class="label-row"><span class="lbl">Intent</span><span class="val">${INTENT_ICONS[data.intent] || '❓'} ${data.intent.replace(/_/g,' ')}</span></div>
      </div>`;
  }
}

window.viewCurrent = function () {
  if (!state.sessionId) { showToast('No active session.', 'warning'); return; }
  showPanel('tickets');
  const inp = document.getElementById('ticket-search');
  if (inp) inp.value = state.sessionId;
  lookupTicket();
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Animation
// ─────────────────────────────────────────────────────────────────────────────

function resetPipeline () {
  document.querySelectorAll('.pipeline-step').forEach(s => {
    s.classList.remove('ps-active', 'ps-done', 'ps-failed');
    const st = s.querySelector('.ps-status');
    if (st) st.textContent = 'Waiting';
  });
}
function stepActive (agent) {
  const el = document.querySelector(`[data-agent="${agent}"]`);
  if (!el) return;
  el.classList.add('ps-active');
  el.classList.remove('ps-done', 'ps-failed');
  const st = el.querySelector('.ps-status');
  if (st) st.textContent = 'Running…';
}
function stepDone (agent) {
  const el = document.querySelector(`[data-agent="${agent}"]`);
  if (!el) return;
  el.classList.remove('ps-active', 'ps-failed');
  el.classList.add('ps-done');
  const st = el.querySelector('.ps-status');
  if (st) st.textContent = '✓ Done';
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Sessions List
// ─────────────────────────────────────────────────────────────────────────────

window.loadChatSessions = async function () {
  const scroll = document.getElementById('chat-sessions-scroll');
  if (!scroll) return;
  try {
    const data = await API.getSessions(15);
    const sessions = data.sessions || [];
    if (!sessions.length) {
      scroll.innerHTML = '<div style="text-align:center;padding:var(--sp-6)"><p class="text-xs text-secondary">No sessions yet</p></div>';
      return;
    }
    scroll.innerHTML = sessions.map(s => `
      <div class="session-item ${s.session_id === state.sessionId ? 'active' : ''}" onclick="openSessionTicket('${s.session_id}')">
        <div class="session-item-id">${s.session_id.slice(0, 18)}…</div>
        <div class="session-item-text">${INTENT_ICONS[s.intent] || '❓'} ${(s.intent || 'unknown').replace(/_/g,' ')}</div>
        <div class="session-item-meta">${s.complete ? '✅ Complete' : '⏳ Pending'} · ${fmtRel(s.created_at)}</div>
      </div>`).join('');
  } catch { /* silent */ }
};

window.openSessionTicket = function (id) {
  showPanel('tickets');
  document.getElementById('ticket-search').value = id;
  lookupTicket();
};

// ─────────────────────────────────────────────────────────────────────────────
// Tickets
// ─────────────────────────────────────────────────────────────────────────────

window.lookupTicket = async function () {
  const id = document.getElementById('ticket-search')?.value.trim();
  if (!id) { showToast('Enter a Session ID or Ticket ID.', 'warning'); return; }

  // Show detail, hide sessions list
  document.getElementById('ticket-detail')?.classList.remove('hidden');
  document.getElementById('ticket-sessions-wrap')?.classList.add('hidden');

  showLoading('Loading ticket…');
  try {
    const data = await API.getTicket(id);
    hideLoading();
    renderTicket(data);
  } catch (err) {
    hideLoading();
    showToast(`Not found: ${err.message}`, 'error');
  }
};

window.loadSessionsForTickets = async function () {
  document.getElementById('ticket-detail')?.classList.add('hidden');
  const wrap = document.getElementById('ticket-sessions-wrap');
  wrap?.classList.remove('hidden');
  showLoading('Loading sessions…');
  try {
    const data = await API.getSessions(50);
    renderSessionsTable(data.sessions || [], 'ticket-sessions-body');
    hideLoading();
  } catch (err) {
    hideLoading();
    showToast(`Error: ${err.message}`, 'error');
  }
};

function renderTicket (data) {
  setText('det-ticket-id', data.ticket_id || '—');
  setText('det-latency',   `${(data.total_latency_ms || 0).toFixed(0)}ms`);

  setBadge('det-intent',   (data.intent || '—').replace(/_/g,' '), 'badge-purple');
  setBadge('det-priority', data.priority || '—',   PRIORITY_BADGE[data.priority] || 'badge-neutral');
  setBadge('det-risk',     data.risk_level || '—', RISK_BADGE[data.risk_level]   || 'badge-neutral');

  const approvalEl = document.getElementById('det-approval');
  if (approvalEl) {
    approvalEl.innerHTML = data.requires_human_approval
      ? '<span class="badge badge-danger">Required</span>'
      : '<span class="badge badge-success">Not Required</span>';
  }

  const pre = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t || '—'; };
  pre('det-findings',  data.investigation_findings);
  pre('det-knowledge', data.knowledge_summary);
  pre('det-response',  data.final_response);

  // Proposed actions
  const actEl = document.getElementById('det-actions');
  if (actEl) {
    const acts = data.proposed_actions || [];
    actEl.innerHTML = acts.length
      ? acts.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-3);background:var(--bg-interactive);border:1px solid var(--border-faint);border-radius:var(--r-lg);margin-bottom:var(--sp-2)">
            <div>
              <div style="font-size:var(--fs-13);font-weight:var(--fw-semi)">${esc(a.type || '')}</div>
              <div style="font-size:var(--fs-11);color:var(--text-tertiary);margin-top:2px">${esc(a.description || '')}</div>
            </div>
            <span class="badge ${RISK_BADGE[a.risk_level] || 'badge-neutral'}">${a.risk_level}</span>
          </div>`).join('')
      : '<p class="text-xs text-secondary">No actions proposed.</p>';
  }

  // Execution trace
  const trace = data.execution_trace || [];
  const countEl = document.getElementById('det-agent-count');
  if (countEl) countEl.textContent = `${trace.length} agents`;

  const timelineEl = document.getElementById('trace-timeline');
  if (timelineEl) {
    timelineEl.innerHTML = trace.length
      ? trace.map(e => `
          <div class="trace-entry ${e.error ? 'te-error' : 'te-success'}">
            <div class="trace-node">${AGENT_EMOJI[e.agent] || '⚙'}</div>
            <div class="trace-content">
              <div class="trace-agent">${(e.agent || '—').replace(/_/g,' ')}</div>
              <div class="trace-output">${esc(e.output || '—')}</div>
              <div class="trace-meta">
                <span class="trace-dur">${(e.duration_ms || 0).toFixed(0)}ms</span>
                ${e.error ? `<span style="color:var(--danger);font-size:var(--fs-11)">${esc(e.error)}</span>` : ''}
              </div>
            </div>
          </div>`).join('')
      : '<p class="text-xs text-secondary" style="padding:var(--sp-4)">No execution trace data.</p>';
  }
}

function renderSessionsTable (sessions, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!sessions.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:var(--sp-8);color:var(--text-tertiary)">No sessions found.</td></tr>`;
    return;
  }
  tbody.innerHTML = sessions.map(s => `
    <tr onclick="openSessionTicket('${s.session_id}')">
      <td data-label="Session ID"><span class="mono" style="font-size:var(--fs-12)">${s.session_id.slice(0,14)}…</span></td>
      <td data-label="Ticket ID"><span class="mono" style="font-size:var(--fs-12)">${s.ticket_id || '—'}</span></td>
      <td data-label="Intent">${INTENT_ICONS[s.intent] || '❓'} ${(s.intent || 'unknown').replace(/_/g,' ')}</td>
      <td data-label="Priority"><span class="badge ${PRIORITY_BADGE[s.priority] || 'badge-neutral'}">${s.priority || '—'}</span></td>
      <td data-label="Status"><span class="badge ${s.complete ? 'badge-success' : 'badge-warning'}">${s.complete ? 'Complete' : 'Pending'}</span></td>
      <td data-label="Latency"><span class="mono" style="font-size:var(--fs-12)">${(s.latency_ms || 0).toFixed(0)}ms</span></td>
      <td data-label="Created" style="color:var(--text-tertiary)">${fmtRel(s.created_at)}</td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Approvals
// ─────────────────────────────────────────────────────────────────────────────

let _pendingApprovalData = null;
let _approvalSessionId   = null;

window.loadApprovals = async function () {
  try {
    const data = await API.getPendingApprovals();
    const list = data.pending_approvals || [];
    setApprovalBadge(list.length);
    renderApprovals(list);
  } catch { /* silent */ }
};

function setApprovalBadge (n) {
  const badge = document.getElementById('approval-badge');
  if (!badge) return;
  badge.textContent = n;
  badge.classList.toggle('show', n > 0);
}

function renderApprovals (list) {
  const c = document.getElementById('approvals-container');
  if (!c) return;
  if (!list.length) {
    c.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <h3>All caught up</h3>
        <p>No actions currently require human review. All requests are within auto-approval thresholds.</p>
      </div>`;
    return;
  }
  c.innerHTML = list.map(a => {
    const acts   = a.proposed_actions || [];
    const total  = acts.reduce((s, x) => s + (x.amount || 0), 0);
    const wait   = Math.max(0, Math.floor((Date.now() / 1000 - a.created_at) / 60));
    const aJson  = esc(JSON.stringify(a));

    return `
      <div class="approval-card">
        <div class="approval-card-head">
          <div class="approval-risk-wrap">
            <div class="approval-risk-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="approval-info">
              <h3>${esc(a.ticket_id || a.session_id)}</h3>
              <p>${(a.intent || '').replace(/_/g,' ')} · ${esc(a.customer_name || 'Unknown')}</p>
            </div>
          </div>
          <span class="badge ${RISK_BADGE[a.risk_level] || 'badge-warning'}">${(a.risk_level || 'high').toUpperCase()} RISK</span>
        </div>
        <div class="approval-meta-grid">
          <div class="approval-meta-cell">
            <div class="amc-label">Amount</div>
            <div class="amc-value" style="color:var(--danger);font-size:var(--fs-18)">$${total.toFixed(2)}</div>
          </div>
          <div class="approval-meta-cell">
            <div class="amc-label">Actions</div>
            <div class="amc-value">${acts.map(x => esc(x.type)).join(', ') || '—'}</div>
          </div>
          <div class="approval-meta-cell">
            <div class="amc-label">Waiting</div>
            <div class="amc-value mono">${wait > 0 ? `${wait}m` : 'just now'}</div>
          </div>
        </div>
        <div class="approval-card-foot">
          <span class="text-xs text-secondary mono">${esc(a.session_id)}</span>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-ghost btn-sm" onclick='openApprovalModal("${a.session_id}", ${aJson})'>Review</button>
            <button class="btn btn-danger btn-sm" onclick="quickDecide('${a.session_id}', false)">Reject</button>
            <button class="btn btn-success btn-sm" onclick="quickDecide('${a.session_id}', true)">Approve</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

window.openApprovalModal = function (sessionId, data) {
  _approvalSessionId   = sessionId;
  _pendingApprovalData = data;

  const body = document.getElementById('approval-modal-body');
  if (!body) return;

  const acts  = data.proposed_actions || [];
  const total = acts.reduce((s, x) => s + (x.amount || 0), 0);

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-4)">
      <div class="approval-meta-cell"><div class="amc-label">Ticket</div><div class="mono" style="font-size:10px">${esc(data.ticket_id || '—')}</div></div>
      <div class="approval-meta-cell"><div class="amc-label">Customer</div><div class="amc-value">${esc(data.customer_name || 'Unknown')}</div></div>
      <div class="approval-meta-cell"><div class="amc-label">Intent</div><div class="amc-value">${(data.intent || '').replace(/_/g,' ')}</div></div>
      <div class="approval-meta-cell"><div class="amc-label">Total Amount</div><div class="amc-value" style="color:var(--danger);font-size:var(--fs-22)">$${total.toFixed(2)}</div></div>
    </div>
    <div style="margin-bottom:var(--sp-4)">
      <div class="form-label" style="margin-bottom:var(--sp-2)">Proposed Actions</div>
      ${acts.map(a => `
        <div style="background:var(--danger-dim);border:1px solid var(--danger-border);border-radius:var(--r-lg);padding:var(--sp-3);margin-bottom:var(--sp-2)">
          <div style="font-size:var(--fs-13);font-weight:var(--fw-semi);color:var(--danger-light)">${esc(a.type || '').toUpperCase()}</div>
          <div style="font-size:var(--fs-12);color:var(--text-tertiary);margin-top:2px">Amount: $${(a.amount || 0).toFixed(2)}</div>
        </div>`).join('') || '<p class="text-xs text-secondary">No specific actions listed.</p>'}
    </div>
    <div style="background:var(--warning-dim);border:1px solid var(--warning-border);border-radius:var(--r-lg);padding:var(--sp-3)">
      <div style="font-size:var(--fs-12);font-weight:var(--fw-semi);color:var(--warning)">⚠ Review carefully</div>
      <div style="font-size:var(--fs-12);color:var(--text-secondary);margin-top:4px">This action executes automatically once approved. Ensure all details are correct.</div>
    </div>`;

  document.getElementById('approval-modal')?.classList.remove('hidden');
  reIcons();
};

window.closeApprovalModal = function () {
  document.getElementById('approval-modal')?.classList.add('hidden');
  _approvalSessionId   = null;
  _pendingApprovalData = null;
};

window.submitApproval = async function (approved) {
  if (!_approvalSessionId) { showToast('No session selected.', 'error'); return; }
  const approverId = document.getElementById('approver-id')?.value.trim()    || 'supervisor';
  const notes      = document.getElementById('approver-notes')?.value.trim() || '';

  closeApprovalModal();
  showLoading(`${approved ? 'Approving' : 'Rejecting'} action…`);

  try {
    const d = await API.submitApproval({ session_id: _approvalSessionId, approved, approver_id: approverId, notes });
    hideLoading();
    showToast(
      `Decision: ${approved ? 'APPROVED ✓' : 'REJECTED ✗'} — Workflow ${d.workflow_complete ? 'completed' : 'resumed'}.`,
      approved ? 'success' : 'warning', 7000
    );
    loadApprovals();
  } catch (err) {
    hideLoading();
    showToast(`Approval error: ${err.message}`, 'error', 6000);
  }
};

window.quickDecide = async function (sessionId, approved) {
  _approvalSessionId = sessionId;
  await submitApproval(approved);
};

// ─────────────────────────────────────────────────────────────────────────────
// Metrics / Analytics
// ─────────────────────────────────────────────────────────────────────────────

window.loadMetrics = async function () {
  try {
    const data = await API.getMetrics();
    setKPI('kpi-total',   data.total_requests,      v => v?.toLocaleString());
    setKPI('kpi-success', data.successful_requests,  v => v?.toLocaleString());
    setKPI('kpi-rate',    data.success_rate,          v => v != null ? `${(v * 100).toFixed(1)}%` : null);
    setKPI('kpi-latency', data.avg_latency_ms,        v => v != null ? `${v.toFixed(0)}ms` : null);
    setKPI('kpi-hitl',    data.hitl_triggers,         v => v?.toLocaleString());
    setKPI('kpi-refunds', data.refunds_processed,     v => v?.toLocaleString());
    setKPI('kpi-failed',  data.failed_requests,       v => v?.toLocaleString());
    setKPI('kpi-uptime',  data.uptime_seconds,        v => v != null ? fmtUptime(v) : null);

    setKPI('an-total',   data.total_requests,     v => v?.toLocaleString());
    setKPI('an-success', data.successful_requests, v => v?.toLocaleString());
    setKPI('an-failed',  data.failed_requests,     v => v?.toLocaleString());
    setKPI('an-rate',    data.success_rate,         v => v != null ? `${(v * 100).toFixed(1)}%` : null);
    setKPI('an-latency', data.avg_latency_ms,       v => v != null ? `${v.toFixed(0)}ms` : null);
    setKPI('an-hitl',    data.hitl_triggers,        v => v?.toLocaleString());
    setKPI('an-refunds', data.refunds_processed,    v => v?.toLocaleString());
    setKPI('an-uptime',  data.uptime_seconds,       v => v != null ? fmtUptime(v) : null);

    renderIntentBars(data.top_intents || {}, 'ov-intent-bars');
    renderIntentBars(data.top_intents || {}, 'an-intent-bars');
  } catch { /* API may be offline */ }
};

function setKPI (id, raw, fmt) {
  const val = raw != null ? (fmt ? fmt(raw) : String(raw)) : null;
  setText(id, val ?? '—');
}

function renderIntentBars (intents, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const entries = Object.entries(intents);
  if (!entries.length) {
    el.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-8)">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <p>Send messages to populate intent analytics.</p>
      </div>`;
    return;
  }
  const max = Math.max(...entries.map(([, v]) => v), 1);
  el.innerHTML = entries.map(([intent, count]) => `
    <div class="intent-bar-row">
      <span class="intent-bar-label">${INTENT_ICONS[intent] || '❓'} ${intent.replace(/_/g,' ')}</span>
      <div class="intent-bar-track"><div class="intent-bar-fill" style="width:${(count / max * 100).toFixed(1)}%"></div></div>
      <span class="intent-bar-count">${count}</span>
    </div>`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions Page
// ─────────────────────────────────────────────────────────────────────────────

window.loadSessionsPage = async function () {
  showLoading('Loading sessions…');
  try {
    const data = await API.getSessions(50);
    state.allSessions = data.sessions || [];
    hideLoading();
    renderSessionsTable(state.allSessions, 'sessions-tbody');
    setText('sessions-count', `${state.allSessions.length} sessions`);
  } catch (err) {
    hideLoading();
    showToast(`Error: ${err.message}`, 'error');
  }
};

window.filterSessions = function (q) {
  q = q.toLowerCase();
  const filtered = q
    ? state.allSessions.filter(s =>
        s.session_id.toLowerCase().includes(q) ||
        (s.ticket_id || '').toLowerCase().includes(q) ||
        (s.intent    || '').toLowerCase().includes(q))
    : state.allSessions;
  renderSessionsTable(filtered, 'sessions-tbody');
  setText('sessions-count', `${filtered.length} sessions`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Base
// ─────────────────────────────────────────────────────────────────────────────

window.loadKnowledge = async function () {
  try {
    const data = await API.getKnowledgeStatus();
    setText('kb-status', (data.status || '—').toUpperCase());
    setText('kb-docs',   data.doc_count   ?? '—');
    setText('kb-chunks', data.chunk_count ?? '—');
    setText('kb-date',   data.created_at  ? new Date(data.created_at * 1000).toLocaleDateString() : '—');
  } catch {
    setText('kb-status', 'UNAVAILABLE');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// System Health
// ─────────────────────────────────────────────────────────────────────────────

window.loadHealth = async function () {
  try {
    const d = await API.getHealth();
    setText('h-version',        d.version         || '1.0.0');
    setText('h-uptime',         fmtUptime(d.uptime_seconds || 0));
    setText('h-sessions-count', d.total_sessions   ?? '—');

    const badge = document.getElementById('platform-status-badge');
    if (badge) { badge.className = 'badge badge-success'; badge.textContent = '● All Systems Operational'; }

    updateHealthCard('hc-backend',    'hc-healthy', 'hs-backend',    'Healthy');
    updateHealthCard('hc-supervisor', 'hc-healthy', 'hs-supervisor', 'Running');
    updateHealthCard('hc-llm',        'hc-healthy', 'hs-llm',        'Connected');

    // Also check RAG
    try {
      const kb = await API.getKnowledgeStatus();
      if (kb.status === 'ready') {
        updateHealthCard('hc-rag', 'hc-healthy', 'hs-rag', 'Indexed');
      } else {
        updateHealthCard('hc-rag', 'hc-warning', 'hs-rag', 'Building…');
      }
    } catch {
      updateHealthCard('hc-rag', 'hc-warning', 'hs-rag', 'Unknown');
    }

    if (d.config_warnings?.length) {
      updateHealthCard('hc-llm', 'hc-warning', 'hs-llm', 'Config Warn');
    }

  } catch {
    const badge = document.getElementById('platform-status-badge');
    if (badge) { badge.className = 'badge badge-danger'; badge.textContent = '● Platform Unreachable'; }
    updateHealthCard('hc-backend',    'hc-error', 'hs-backend',    'Offline');
    updateHealthCard('hc-supervisor', 'hc-error', 'hs-supervisor', 'Unavailable');
    updateHealthCard('hc-rag',        'hc-error', 'hs-rag',        'Unavailable');
    updateHealthCard('hc-llm',        'hc-error', 'hs-llm',        'Unavailable');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo Mode
// ─────────────────────────────────────────────────────────────────────────────

window.runDemo = async function () {
  showPanel('support');
  document.getElementById('chat-welcome')?.remove();

  const custEl = document.getElementById('cust-id');
  if (custEl) custEl.value = 'CUST-DEMO-001';

  const demoMsg = 'My payment failed twice and I appear to have been charged twice for $99.99 last Tuesday. I need this fixed urgently and my money back!';
  addUserBubble(demoMsg);

  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = true;

  resetPipeline();
  const typingEl = addTyping();

  showLoading('Running E2E Demo Scenario…', PIPE_AGENTS.map((id, i) => ({ id, label: PIPE_LABELS[i] })));

  let si = 0;
  const stTimer = setInterval(() => {
    if (si > 0) { stepDone(PIPE_AGENTS[si - 1]); setLoadStep(PIPE_AGENTS[si - 1], 'ls-done'); }
    if (si < PIPE_AGENTS.length) {
      stepActive(PIPE_AGENTS[si]);
      setLoadStep(PIPE_AGENTS[si], 'ls-active');
      setLoadText(`Demo: ${PIPE_LABELS[si]}…`);
      si++;
    }
  }, 700);

  try {
    const d = await API.runDemoE2E();
    clearInterval(stTimer);
    PIPE_AGENTS.forEach(a => { stepDone(a); setLoadStep(a, 'ls-done'); });
    typingEl?.remove();

    const result = d.result || d;
    if (result?.session_id) {
      state.sessionId = result.session_id;
      addAIBubble(result);
      updateSessionPanel(result);
      updateCustomerPanel(result);
      setText('active-session-label', `Demo: ${result.session_id.slice(0,10)}…`);

      if (result.requires_approval) {
        addHITLBanner(result);
        setApprovalBadge(1);
        loadApprovals();
        showToast('Demo complete! Approval required — go to Approval Center to review.', 'warning', 8000);
      } else {
        showToast('Demo scenario completed successfully!', 'success', 5000);
      }
      loadChatSessions();
      loadMetrics();
    } else {
      throw new Error(d.error || 'Demo returned no result.');
    }
  } catch (err) {
    clearInterval(stTimer);
    typingEl?.remove();
    addSysMsg(`Demo error: ${err.message}`, 'error');
    showToast(`Demo failed: ${err.message}`, 'error', 6000);
  } finally {
    hideLoading();
    if (sendBtn) sendBtn.disabled = false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Shortcuts
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('global-search');
    if (s) { s.focus(); s.select(); }
  }
  if (e.key === 'Escape') { closeApprovalModal(); hideLoading(); }
});

document.getElementById('approval-modal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeApprovalModal();
});

document.getElementById('global-search')?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const q = this.value.trim();
    if (q) {
      showPanel('tickets');
      document.getElementById('ticket-search').value = q;
      lookupTicket();
      this.value = '';
      this.blur();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Responsive
// ─────────────────────────────────────────────────────────────────────────────

function checkMobile () {
  const btn = document.getElementById('mob-menu-btn');
  if (btn) btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}
window.addEventListener('resize', checkMobile);

// ─────────────────────────────────────────────────────────────────────────────
// Utility Helpers
// ─────────────────────────────────────────────────────────────────────────────

function esc (s) {
  if (typeof s !== 'string') s = String(s ?? '');
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function setText (id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; }
function setClass (id, base, extra) { const el = document.getElementById(id); if (el) el.className = `${base} ${extra}`; }
function setBadge (id, text, cls) { const el = document.getElementById(id); if (el) el.innerHTML = `<span class="badge ${cls}">${esc(text)}</span>`; }

window.pushTerminalLog = function (level, msg) {
  const c = document.getElementById('health-terminal-streamer');
  if (!c) return;
  const line = document.createElement('div');
  line.className = 'term-line';
  const ts = new Date().toISOString().split('T')[1].slice(0, 12);
  line.innerHTML = `<span class="term-ts">[${ts}]</span> <span class="term-lvl">${esc(level.toUpperCase())}</span> <span class="term-msg">${esc(msg)}</span>`;
  c.appendChild(line);
  c.scrollTop = c.scrollHeight;
};

function fmtUptime (s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h)  return `${h}h ${m}m`;
  if (m)  return `${m}m`;
  return `${Math.floor(s)}s`;
}
function fmtRel (ts) {
  if (!ts) return '—';
  const d = Math.floor(Date.now() / 1000 - ts);
  if (d < 60)    return 'just now';
  if (d < 3600)  return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString();
}
function fmtTime (ms) { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function reIcons () {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication & Data Entry Modals
// ─────────────────────────────────────────────────────────────────────────────

window.openLoginModal = function () {
  document.getElementById('login-modal')?.classList.remove('hidden');
  reIcons();
};

window.closeLoginModal = function () {
  document.getElementById('login-modal')?.classList.add('hidden');
};

window.handleLogin = function (ev) {
  if (ev) ev.preventDefault();
  const username = document.getElementById('login-username')?.value.trim() || 'Uma Nagal';
  const role     = document.getElementById('login-role')?.value            || 'Supervisor';

  const nameParts = username.split('@')[0].split('.');
  const displayName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const initials = nameParts.map(p => p.charAt(0).toUpperCase()).join('');

  setText('topbar-user-name', displayName);
  setText('topbar-user-role', role);
  setText('topbar-avatar', initials || 'UN');
  setText('sidebar-user-name', displayName);
  setText('sidebar-user-role', role);
  setText('sidebar-avatar', initials || 'UN');
  setText('welcome-user-name', displayName.split(' ')[0]);

  closeLoginModal();
  showToast(`Authenticated successfully as ${displayName} (${role}).`, 'success', 5000);
  pushTerminalLog('INFO', `User authenticated: ${displayName} [Role: ${role}]`);
};

window.openDataEntryModal = function () {
  document.getElementById('data-entry-modal')?.classList.remove('hidden');
  reIcons();
};

window.closeDataEntryModal = function () {
  document.getElementById('data-entry-modal')?.classList.add('hidden');
};

window.submitDataEntry = function (ev) {
  if (ev) ev.preventDefault();
  const custId   = document.getElementById('de-customer-id')?.value.trim()   || 'CUST-98421';
  const custName = document.getElementById('de-customer-name')?.value.trim() || 'Customer';
  const desc     = document.getElementById('de-description')?.value.trim()   || '';

  closeDataEntryModal();
  showPanel('support');

  const custInp = document.getElementById('cust-id');
  if (custInp) custInp.value = custId;

  const chatInp = document.getElementById('chat-input');
  if (chatInp) chatInp.value = desc;

  sendMsg();
  showToast(`Ticket data dispatched for ${custName} (${custId}).`, 'info');
};

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  reIcons();
  setGreeting();
  checkMobile();
  checkAPI();
  setInterval(checkAPI, 30_000);

  // Initial data
  loadMetrics();
  loadApprovals();

  showPanel('overview');

  // Background approval badge poll
  setInterval(() => {
    API.getPendingApprovals()
       .then(d => setApprovalBadge((d.pending_approvals || []).length))
       .catch(() => {});
  }, 15_000);
});
