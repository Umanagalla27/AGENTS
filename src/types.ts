export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'in_progress' | 'waiting_approval' | 'resolved' | 'escalated' | 'closed';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type AgentStepStatus = 'queued' | 'running' | 'completed' | 'waiting' | 'approved' | 'rejected' | 'failed';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  accountTier: 'Gold' | 'Enterprise VIP' | 'Silver' | 'Standard';
  lifetimeValue: number;
  sentiment: 'Positive' | 'Neutral' | 'Frustrated' | 'Critical';
  vipStatus: boolean;
  customerSince: string;
  previousTickets: number;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: 'Completed' | 'Pending' | 'Flagged' | 'Refunded';
  duplicate: boolean;
  refundEligible: boolean;
  anomalyReason?: string;
}

export interface PolicyCitation {
  id: string;
  title: string;
  documentType: string;
  relevance: number; // e.g. 0.97
  excerpt: string;
  section: string;
  sourceUrl?: string;
}

export interface AgentExecutionStep {
  id: string;
  agentName: string;
  agentRole: string;
  status: AgentStepStatus;
  startTime: string;
  durationMs: number;
  purpose: string;
  outputSummary: string;
  toolUsed?: string;
  tokenUsage?: number;
  confidence?: number;
  error?: string;
}

export interface ApprovalRequest {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  customerTier: string;
  requestedAction: string;
  amount: number;
  riskLevel: RiskLevel;
  reason: string;
  timeWaiting: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  approver?: string;
  notes?: string;
  evidence: {
    duplicateTransactionId?: string;
    originalOrderId?: string;
    anomalyDetails?: string;
    policyMatched?: string;
  };
}

export interface Ticket {
  id: string;
  sessionId: string;
  customer: CustomerProfile;
  priority: PriorityLevel;
  intent: string;
  status: TicketStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  resolvedAt?: string;
  originalMessage: string;
  aiClassification: {
    intent: string;
    confidence: number;
    priority: PriorityLevel;
    routing: string;
    category: string;
  };
  transactions: Transaction[];
  citations: PolicyCitation[];
  resolution: {
    proposedAction: string;
    riskLevel: RiskLevel;
    estimatedResolutionTime: string;
    autoExecutable: boolean;
    summary: string;
    amount?: number;
  };
  review: {
    complianceStatus: 'compliant' | 'requires_review' | 'flagged';
    qualityScore: number;
    reviewFeedback: string;
    policyChecked: string;
  };
  approval?: ApprovalRequest;
  executionTrace: AgentExecutionStep[];
  finalCustomerResponse?: string;
}

export interface SupportSession {
  sessionId: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  customerTier: string;
  intent: string;
  priority: PriorityLevel;
  status: TicketStatus;
  risk: RiskLevel;
  approvalState: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolutionTime?: string;
  messageCount: number;
  lastMessageSnippet: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  documentType: string;
  lastUpdated: string;
  chunksCount: number;
  retrievalStatus: 'indexed' | 'updating' | 'cached';
  relevanceScore: number;
  contentPreview: string;
  tags: string[];
  keyRules: string[];
}

export interface AgentService {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'busy' | 'standby' | 'error';
  tasksHandled: number;
  averageLatencyMs: number;
  successRate: number;
  lastActivity: string;
  tools: string[];
  model: string;
  iconType: string;
}

export interface SystemMetrics {
  totalRequests: number;
  resolvedRequests: number;
  averageResolutionTimeSec: number;
  successRatePercent: number;
  humanApprovalsCount: number;
  activeSessionsCount: number;
  highRiskTicketsCount: number;
  aiAutomationRatePercent: number;
  requestsOverTime: {
    time: string;
    requests: number;
    automated: number;
    escalated: number;
  }[];
  topIntents: {
    intent: string;
    count: number;
    percentage: number;
  }[];
  latencyDistribution: {
    agent: string;
    avgLatencyMs: number;
  }[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  backend: 'healthy' | 'degraded';
  database: 'healthy' | 'degraded';
  crmMcp: 'connected' | 'disconnected';
  billingMcp: 'connected' | 'disconnected';
  ticketingMcp: 'connected' | 'disconnected';
  notificationMcp: 'connected' | 'disconnected';
  rag: 'indexed' | 'degraded';
  llm: 'connected' | 'degraded';
  lastChecked: string;
  uptimePercent: number;
  activeNodes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent_event';
  content: string;
  timestamp: string;
  ticketId?: string;
  sessionId?: string;
  agentName?: string;
  citations?: PolicyCitation[];
  approvalRequired?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  riskLevel?: RiskLevel;
  actionsTaken?: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

