/**
 * NEXUS AI — Centralized API Service Layer
 *
 * All API communication is funnelled through this module.
 * No fetch() calls should exist anywhere else in the application.
 *
 * Base URL: http://localhost:8000
 * API Prefix: /api/v1
 */

const API_BASE_URL = 'http://localhost:8000';
const API_PREFIX   = `${API_BASE_URL}/api/v1`;

// ---------------------------------------------------------------------------
// Internal fetch wrapper with consistent error handling
// ---------------------------------------------------------------------------

/**
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function apiFetch(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timerId);

    if (!response.ok) {
      let detail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errBody = await response.json();
        if (errBody.detail) detail = errBody.detail;
      } catch (_) { /* ignore JSON parse errors on error responses */ }
      throw new APIError(detail, response.status);
    }

    return await response.json();

  } catch (err) {
    clearTimeout(timerId);
    if (err.name === 'AbortError') {
      throw new APIError('Request timed out. The agent pipeline may still be running.', 408);
    }
    if (err instanceof APIError) throw err;
    throw new APIError(err.message || 'Network error — is the backend running?', 0);
  }
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class APIError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/**
 * GET /health
 * @returns {Promise<{status: string, platform: string, version: string, uptime_seconds: number, total_sessions: number}>}
 */
export async function getHealth() {
  return apiFetch(`${API_BASE_URL}/health`, {}, 5000);
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/chat
 * @param {{ message: string, customer_id?: string, channel?: string, session_id?: string }} payload
 * @returns {Promise<ChatResponse>}
 */
export async function sendChatMessage(payload) {
  return apiFetch(`${API_PREFIX}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message: payload.message,
      customer_id: payload.customer_id || null,
      channel: payload.channel || 'web',
      session_id: payload.session_id || null,
    }),
  }, 120000); // 2-minute timeout for agent pipeline
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tickets/{session_id}
 * @param {string} sessionId
 * @returns {Promise<TicketDetail>}
 */
export async function getTicket(sessionId) {
  return apiFetch(`${API_PREFIX}/tickets/${encodeURIComponent(sessionId)}`);
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/approvals/pending
 * @returns {Promise<{pending_approvals: PendingApproval[], count: number}>}
 */
export async function getPendingApprovals() {
  return apiFetch(`${API_PREFIX}/approvals/pending`);
}

/**
 * POST /api/v1/approvals
 * @param {{ session_id: string, approved: boolean, approver_id: string, notes?: string }} payload
 * @returns {Promise<ApprovalResponse>}
 */
export async function submitApproval(payload) {
  return apiFetch(`${API_PREFIX}/approvals`, {
    method: 'POST',
    body: JSON.stringify({
      session_id: payload.session_id,
      approved: payload.approved,
      approver_id: payload.approver_id,
      notes: payload.notes || '',
    }),
  });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/sessions
 * @param {number} limit
 * @returns {Promise<{sessions: SessionSummary[], total: number}>}
 */
export async function getSessions(limit = 20) {
  return apiFetch(`${API_PREFIX}/sessions?limit=${limit}`);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/metrics
 * @returns {Promise<MetricsResponse>}
 */
export async function getMetrics() {
  return apiFetch(`${API_PREFIX}/metrics`);
}

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/knowledge/status
 * @returns {Promise<{status: string, doc_count: number, chunk_count: number, created_at: string}>}
 */
export async function getKnowledgeStatus() {
  return apiFetch(`${API_PREFIX}/knowledge/status`, {}, 10000);
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/demo/run-e2e
 * Runs the canonical E2E duplicate charge demo scenario.
 * @returns {Promise<{demo: string, result: ChatResponse}>}
 */
export async function runDemoE2E() {
  return apiFetch(`${API_PREFIX}/demo/run-e2e`, {}, 120000);
}

// ---------------------------------------------------------------------------
// JSDoc type stubs (for IDE hints only — no runtime effect)
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   session_id: string,
 *   ticket_id: string,
 *   response: string,
 *   intent: string,
 *   priority: string,
 *   risk_level: string,
 *   requires_approval: boolean,
 *   approval_status: string,
 *   workflow_complete: boolean,
 *   latency_ms: number,
 *   agents_completed: string[]
 * }} ChatResponse
 */

/**
 * @typedef {{
 *   session_id: string,
 *   ticket_id: string,
 *   intent: string,
 *   priority: string,
 *   risk_level: string,
 *   customer_profile: { customer_id: string, name: string, tier: string },
 *   investigation_findings: string,
 *   knowledge_summary: string,
 *   proposed_actions: Array<{ type: string, description: string, risk_level: string, requires_approval: boolean, executed: boolean }>,
 *   review_passed: boolean,
 *   compliance_flags: string[],
 *   requires_human_approval: boolean,
 *   approval_status: string,
 *   final_response: string,
 *   workflow_complete: boolean,
 *   execution_trace: Array<{ agent: string, step: string, input: string, output: string, duration_ms: number, timestamp: number, error: string|null }>,
 *   total_latency_ms: number,
 *   agents_completed: string[]
 * }} TicketDetail
 */

/**
 * @typedef {{
 *   session_id: string,
 *   ticket_id: string,
 *   customer_name: string,
 *   intent: string,
 *   risk_level: string,
 *   proposed_actions: Array<{ type: string, amount: number }>,
 *   created_at: number
 * }} PendingApproval
 */

/**
 * @typedef {{
 *   session_id: string,
 *   ticket_id: string,
 *   intent: string,
 *   priority: string,
 *   complete: boolean,
 *   latency_ms: number,
 *   created_at: number
 * }} SessionSummary
 */

/**
 * @typedef {{
 *   total_requests: number,
 *   successful_requests: number,
 *   failed_requests: number,
 *   success_rate: number,
 *   avg_latency_ms: number,
 *   hitl_triggers: number,
 *   refunds_processed: number,
 *   top_intents: Record<string, number>,
 *   uptime_seconds: number
 * }} MetricsResponse
 */
