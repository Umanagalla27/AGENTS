/**
 * NEXUS AI — Centralized API Service Layer
 *
 * All API communication is funnelled through this module.
 * No fetch() calls should exist anywhere else in the application.
 *
 * Base URL: http://localhost:8000
 * API Prefix: /api/v1
 */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? window.location.origin
  : 'http://localhost:8000';

const API_PREFIX = `${API_BASE_URL}/api/v1`;

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
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timerId);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let detail = `HTTP ${response.status}: ${response.statusText}`;
      if (isJson) {
        try {
          const errBody = await response.json();
          if (errBody.detail) detail = errBody.detail;
        } catch (_) {}
      }
      throw new APIError(detail, response.status);
    }

    if (!isJson) {
      // If backend returned HTML instead of JSON, attempt fallback to root endpoint without /api/v1 prefix
      if (url.includes('/api/v1/')) {
        const fallbackUrl = url.replace('/api/v1/', '/');
        console.warn(`[apiFetch] Endpoint ${url} returned non-JSON response. Retrying with fallback: ${fallbackUrl}`);
        return apiFetch(fallbackUrl, options, timeoutMs);
      }
      throw new APIError('Server returned unexpected HTML response instead of JSON. Ensure backend is running.', 500);
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
  return apiFetch(`${API_PREFIX}/health`, {}, 5000);
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
