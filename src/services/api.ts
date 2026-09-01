import {
  Ticket,
  SupportSession,
  ApprovalRequest,
  SystemMetrics,
  KnowledgeDocument,
  SystemHealth,
  AgentService
} from '../types';

export const api = {
  // 1. Submit customer message to the multi-agent workflow
  async sendChatMessage(message: string, sessionId?: string, customerId?: string): Promise<{
    reply: string;
    ticket: Ticket;
    session: SupportSession;
    approvalRequired: boolean;
    approval?: ApprovalRequest;
    executionTrace: any[];
    durationMs: number;
  }> {
    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, customerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to send chat: ${res.statusText}`);
    }
    return res.json();
  },

  // 2. Fetch full ticket details & execution trace
  async getTicket(sessionIdOrTicketId: string): Promise<Ticket> {
    const res = await fetch(`/api/v1/tickets/${encodeURIComponent(sessionIdOrTicketId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Ticket not found: ${res.statusText}`);
    }
    return res.json();
  },

  // 3. Fetch all tickets
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch('/api/v1/tickets');
    if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.statusText}`);
    return res.json();
  },

  // 4. Fetch all pending Human-in-the-Loop approvals
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const res = await fetch('/api/v1/approvals/pending');
    if (!res.ok) throw new Error(`Failed to fetch approvals: ${res.statusText}`);
    return res.json();
  },

  // 5. Submit approval / rejection
  async submitApproval(
    ticketId: string,
    action: 'approve' | 'reject',
    notes?: string,
    approver?: string
  ): Promise<{ success: boolean; message: string; approval: ApprovalRequest; ticket?: Ticket }> {
    const res = await fetch('/api/v1/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, action, notes, approver }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to submit approval: ${res.statusText}`);
    }
    return res.json();
  },

  // 6. Fetch support sessions list
  async getSessions(): Promise<SupportSession[]> {
    const res = await fetch('/api/v1/sessions');
    if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
    return res.json();
  },

  // 7. Fetch executive metrics & analytics
  async getMetrics(): Promise<SystemMetrics> {
    const res = await fetch('/api/v1/metrics');
    if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
    return res.json();
  },

  // 8. Fetch knowledge base status & documents
  async getKnowledgeStatus(): Promise<{
    status: string;
    ragType: string;
    embeddingModel: string;
    totalDocuments: number;
    totalChunks: number;
    lastIndexedAt: string;
    documents: KnowledgeDocument[];
  }> {
    const res = await fetch('/api/v1/knowledge/status');
    if (!res.ok) throw new Error(`Failed to fetch knowledge status: ${res.statusText}`);
    return res.json();
  },

  // 9. Fetch live system health
  async getHealth(): Promise<SystemHealth & { providers: any; defaultProvider: string }> {
    const res = await fetch('/health');
    if (!res.ok) throw new Error(`Failed to fetch health: ${res.statusText}`);
    return res.json();
  },

  // 10. Trigger Canonical E2E Demo Mode
  async runDemoE2E(): Promise<{
    status: string;
    scenario: string;
    sessionId: string;
    ticket: Ticket;
    approval: ApprovalRequest;
  }> {
    const res = await fetch('/api/v1/demo/run-e2e');
    if (!res.ok) throw new Error(`Failed to run demo: ${res.statusText}`);
    return res.json();
  },

  // 11. Fetch AI Agents Catalog
  async getAgents(): Promise<AgentService[]> {
    const res = await fetch('/api/v1/agents');
    if (!res.ok) throw new Error(`Failed to fetch agents: ${res.statusText}`);
    return res.json();
  },

  // 12. Fetch Notification Audit Logs
  async getNotifications(): Promise<any[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.statusText}`);
    return res.json();
  }
};

// Named Export Helpers
export const fetchMetrics = async (): Promise<SystemMetrics> => {
  return api.getMetrics();
};

export const fetchTickets = async (): Promise<Ticket[]> => {
  try {
    return await api.getTickets();
  } catch {
    return [];
  }
};

export const fetchTicketById = async (id: string): Promise<Ticket> => {
  return api.getTicket(id);
};

export const fetchSessions = async (): Promise<SupportSession[]> => {
  return api.getSessions();
};

export const fetchPendingApprovals = async (): Promise<ApprovalRequest[]> => {
  return api.getPendingApprovals();
};

export const submitApprovalDecision = async (
  ticketId: string,
  action: 'approve' | 'reject',
  notes: string
): Promise<{ success: boolean; message: string; approval: ApprovalRequest; ticket?: Ticket }> => {
  return api.submitApproval(ticketId, action, notes);
};

export const sendSupportMessage = async (
  sessionId: string,
  ticketId: string,
  message: string
): Promise<{
  reply: string;
  ticket: Ticket;
  session: SupportSession;
  approvalRequired: boolean;
  approval?: ApprovalRequest;
  executionTrace: any[];
  durationMs: number;
}> => {
  return api.sendChatMessage(message, sessionId);
};

export const fetchAgents = async (): Promise<AgentService[]> => {
  return api.getAgents();
};

export const fetchKnowledgeBase = async (): Promise<KnowledgeDocument[]> => {
  const result = await api.getKnowledgeStatus();
  return result.documents || [];
};

export const runCanonicalDemo = async (): Promise<{
  status: string;
  scenario: string;
  sessionId: string;
  ticket: Ticket;
  approval: ApprovalRequest;
}> => {
  return api.runDemoE2E();
};
