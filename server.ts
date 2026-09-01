import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  CustomerProfile,
  Transaction,
  PolicyCitation,
  AgentExecutionStep,
  ApprovalRequest,
  Ticket,
  SupportSession,
  KnowledgeDocument,
  AgentService,
  SystemMetrics,
  SystemHealth
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// Pushover Notification Helper
async function sendPushoverNotification(message: string): Promise<boolean> {
  const pushoverUser = process.env.PUSHOVER_USER;
  const pushoverToken = process.env.PUSHOVER_TOKEN;

  if (!pushoverUser || !pushoverToken) {
    return false;
  }

  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: pushoverToken,
        user: pushoverUser,
        message,
      }),
    });
    const data = await res.json();
    return data.status === 1;
  } catch (err) {
    console.error('[Pushover Error]', err);
    return false;
  }
}

// ==========================================
// SEED ENTERPRISE DATA & IN-MEMORY STORE
// ==========================================

const DEFAULT_CUSTOMER: CustomerProfile = {
  id: 'CUST-88219',
  name: 'Alex Johnson',
  email: 'alex.johnson@enterprise-cloud.io',
  accountTier: 'Gold',
  lifetimeValue: 2450.00,
  sentiment: 'Neutral',
  vipStatus: true,
  customerSince: '2021-04-12',
  previousTickets: 7,
  company: 'Apex Logistics Global',
  phone: '+1 (415) 890-2104',
  notes: 'Key decision maker for enterprise tier renewal. Fast resolution preferred.'
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-90412',
    orderId: 'ORD-44919',
    date: '2026-08-31 08:28:12',
    amount: 99.99,
    paymentMethod: 'Visa •••• 4821',
    status: 'Completed',
    duplicate: true,
    refundEligible: true,
    anomalyReason: 'Duplicate payment detected within 3 minutes of original order'
  },
  {
    id: 'TX-90411',
    orderId: 'ORD-44919',
    date: '2026-08-31 08:25:04',
    amount: 99.99,
    paymentMethod: 'Visa •••• 4821',
    status: 'Completed',
    duplicate: false,
    refundEligible: false
  },
  {
    id: 'TX-88120',
    orderId: 'ORD-41092',
    date: '2026-08-15 14:10:00',
    amount: 249.00,
    paymentMethod: 'Visa •••• 4821',
    status: 'Completed',
    duplicate: false,
    refundEligible: false
  },
  {
    id: 'TX-82901',
    orderId: 'ORD-38190',
    date: '2026-07-20 11:32:00',
    amount: 99.99,
    paymentMethod: 'Visa •••• 4821',
    status: 'Completed',
    duplicate: false,
    refundEligible: false
  }
];

const KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'DOC-POL-001',
    title: 'Billing & Payment Dispute Procedure',
    documentType: 'Policy Guideline',
    lastUpdated: '2026-08-15',
    chunksCount: 18,
    retrievalStatus: 'indexed',
    relevanceScore: 0.97,
    contentPreview: 'Covers duplicate charge handling, automatic reversal criteria, customer credit options, and mandatory manager approval for refunds over $50.00.',
    tags: ['billing', 'refunds', 'duplicate-charge', 'disputes'],
    keyRules: [
      'Duplicate transactions occurring within 10 minutes for the same Order ID qualify for immediate automated refund proposal.',
      'Refunds equal to or exceeding $50.00 require human-in-the-loop approval before gateway execution.',
      'VIP/Gold accounts are prioritized with zero-wait automated investigation.'
    ]
  },
  {
    id: 'DOC-POL-002',
    title: 'Customer Service SLA & Escalation Protocol v2.1',
    documentType: 'SLA Standard',
    lastUpdated: '2026-08-01',
    chunksCount: 24,
    retrievalStatus: 'indexed',
    relevanceScore: 0.91,
    contentPreview: 'Enterprise response time targets: Gold Tier < 5 minutes, Silver Tier < 30 minutes. Auto-triage and risk classification rules.',
    tags: ['sla', 'priority', 'escalation', 'gold-tier'],
    keyRules: [
      'High-risk tickets must be classified and assigned an executive reviewer within 2 minutes.',
      'Customer sentiment tracking triggers automated supervisor alerts if Frustrated or Critical.'
    ]
  },
  {
    id: 'DOC-POL-003',
    title: 'Payment Gateway Failure & Reconciliation Guide',
    documentType: 'Technical Runbook',
    lastUpdated: '2026-07-28',
    chunksCount: 14,
    retrievalStatus: 'indexed',
    relevanceScore: 0.88,
    contentPreview: 'Step-by-step verification of idempotency keys, webhook retries, Stripe/Adyen transaction status reconciliation.',
    tags: ['gateway', 'technical', 'reconciliation', 'idempotency'],
    keyRules: [
      'Inspect gateway transaction trace for duplicate idempotency key collisions.',
      'Verify refund ledger state before issuing secondary reimbursement.'
    ]
  },
  {
    id: 'DOC-POL-004',
    title: 'Account Security & PII Protection Guidelines',
    documentType: 'Compliance & Safety',
    lastUpdated: '2026-08-10',
    chunksCount: 32,
    retrievalStatus: 'indexed',
    relevanceScore: 0.85,
    contentPreview: 'Ensures no raw credit card numbers, passwords, or personal credentials are exposed in customer conversation or agent logs.',
    tags: ['security', 'pii', 'compliance', 'gdpr'],
    keyRules: [
      'Redact full PANs to last 4 digits.',
      'Sanitize internal model reasoning chains before external communication dispatch.'
    ]
  }
];

const AGENT_SERVICES: AgentService[] = [
  {
    id: 'agent-triage',
    name: 'Triage Agent',
    role: 'Intent Classification & Priority Scoring',
    description: 'Classifies customer requests, calculates sentiment scores, predicts urgency, and routes to appropriate downstream agent teams.',
    status: 'active',
    tasksHandled: 4120,
    averageLatencyMs: 180,
    successRate: 99.4,
    lastActivity: 'Just now',
    tools: ['intent_classifier', 'priority_matrix', 'risk_scorer'],
    model: 'Gemini 2.5 Flash',
    iconType: 'ShieldCheck'
  },
  {
    id: 'agent-crm',
    name: 'Customer Intelligence Agent',
    role: 'CRM Profile & Context Enrichment',
    description: 'Queries MCP CRM connectors, pulls lifetime value, previous support history, account tier, and builds rich context for personalized resolution.',
    status: 'active',
    tasksHandled: 3980,
    averageLatencyMs: 220,
    successRate: 99.8,
    lastActivity: 'Just now',
    tools: ['crm_mcp_lookup', 'ltv_calculator', 'churn_risk_analyzer'],
    model: 'Gemini 2.5 Flash',
    iconType: 'Users'
  },
  {
    id: 'agent-rag',
    name: 'Knowledge / RAG Agent',
    role: 'Policy-Grounded Semantic Retrieval',
    description: 'Executes hybrid BM25 + dense vector search across enterprise knowledge bases, extracting relevant clauses and policy compliance rules.',
    status: 'active',
    tasksHandled: 3640,
    averageLatencyMs: 310,
    successRate: 98.9,
    lastActivity: 'Just now',
    tools: ['hybrid_retriever', 'citation_extractor', 'policy_verifier'],
    model: 'Gemini 2.5 Flash',
    iconType: 'BookOpen'
  },
  {
    id: 'agent-investigation',
    name: 'Investigation Agent',
    role: 'Transaction & Anomaly Diagnostics',
    description: 'Audits ledger transactions, groups by order ID, flags double charges, checks idempotency keys, and establishes cryptographic evidence.',
    status: 'active',
    tasksHandled: 2840,
    averageLatencyMs: 290,
    successRate: 99.1,
    lastActivity: 'Just now',
    tools: ['billing_mcp_query', 'anomaly_detector', 'duplicate_matcher'],
    model: 'Gemini 2.5 Flash',
    iconType: 'Search'
  },
  {
    id: 'agent-resolution',
    name: 'Resolution Agent',
    role: 'Action Synthesis & Risk Classification',
    description: 'Synthesizes findings into concrete solutions (refunds, credits, escalations), assesses risk levels, and triggers Human-in-the-Loop workflows.',
    status: 'active',
    tasksHandled: 3410,
    averageLatencyMs: 340,
    successRate: 98.7,
    lastActivity: 'Just now',
    tools: ['action_builder', 'risk_evaluator', 'hitl_dispatcher'],
    model: 'Gemini 2.5 Flash',
    iconType: 'Wrench'
  },
  {
    id: 'agent-review',
    name: 'Review Agent',
    role: 'Compliance & Quality Assurance Audit',
    description: 'Audits draft actions and messages against SLA standards, verifies regulatory compliance, checks tone, and ensures brand safety before sending.',
    status: 'active',
    tasksHandled: 3380,
    averageLatencyMs: 190,
    successRate: 99.6,
    lastActivity: 'Just now',
    tools: ['compliance_checker', 'quality_scorer', 'brand_guardrail'],
    model: 'Gemini 2.5 Flash',
    iconType: 'CheckCircle2'
  }
];

// In-Memory Storage
let storedTickets: Record<string, Ticket> = {};
let storedSessions: SupportSession[] = [];
let pendingApprovals: ApprovalRequest[] = [];
let notificationAuditLogs: any[] = [];

// Seed initial session and ticket
function seedInitialData() {
  const sampleTicketId = 'TKT-8F42A1C9';
  const sampleSessionId = 'SESS-2026-0831';

  const initialApproval: ApprovalRequest = {
    id: 'APP-9921',
    ticketId: sampleTicketId,
    customerName: 'Alex Johnson',
    customerEmail: 'alex.johnson@enterprise-cloud.io',
    customerTier: 'Gold Customer ($2,450 LTV)',
    requestedAction: 'Refund $99.99 to Visa •••• 4821',
    amount: 99.99,
    riskLevel: 'HIGH',
    reason: 'Duplicate payment detected within 3 minutes of original order',
    timeWaiting: '02:31',
    status: 'pending',
    createdAt: new Date(Date.now() - 151000).toISOString(),
    evidence: {
      duplicateTransactionId: 'TX-90412',
      originalOrderId: 'ORD-44919',
      anomalyDetails: 'Transaction TX-90412 duplicated order ORD-44919 at 08:28:12 (3 min after TX-90411)',
      policyMatched: 'DOC-POL-001: Billing & Payment Dispute Procedure (Rule #2: Refunds >= $50 require HITL approval)'
    }
  };

  const initialTrace: AgentExecutionStep[] = [
    {
      id: 'trace-1',
      agentName: 'Triage Agent',
      agentRole: 'Intent Classification',
      status: 'completed',
      startTime: '08:29:01.120',
      durationMs: 165,
      purpose: 'Analyze incoming message intent and calculate priority score',
      outputSummary: 'Intent: "Duplicate Charge" | Confidence: 98.4% | Priority: HIGH',
      toolUsed: 'intent_classifier',
      confidence: 0.984
    },
    {
      id: 'trace-2',
      agentName: 'Customer Intelligence Agent',
      agentRole: 'CRM Enrichment',
      status: 'completed',
      startTime: '08:29:01.290',
      durationMs: 210,
      purpose: 'Enrich profile with CRM account tier, LTV, and history',
      outputSummary: 'Alex Johnson | Gold VIP | LTV: $2,450 | Neutral Sentiment | 7 Prior Tickets',
      toolUsed: 'crm_mcp_lookup',
      confidence: 0.99
    },
    {
      id: 'trace-3',
      agentName: 'Knowledge / RAG Agent',
      agentRole: 'Policy Retrieval',
      status: 'completed',
      startTime: '08:29:01.505',
      durationMs: 290,
      purpose: 'Retrieve dispute procedures and refund thresholds from vector store',
      outputSummary: 'Retrieved "Billing & Payment Dispute Procedure" (97% relevance) & "Customer Service SLA v2.1" (91% relevance)',
      toolUsed: 'hybrid_retriever',
      confidence: 0.97
    },
    {
      id: 'trace-4',
      agentName: 'Investigation Agent',
      agentRole: 'Transaction Audit',
      status: 'completed',
      startTime: '08:29:01.800',
      durationMs: 310,
      purpose: 'Audit billing ledger for Order ORD-44919 and check for duplicate timestamps',
      outputSummary: 'Anomaly Confirmed: Duplicate charge TX-90412 ($99.99) detected 3 minutes after TX-90411',
      toolUsed: 'billing_mcp_query',
      confidence: 0.995
    },
    {
      id: 'trace-5',
      agentName: 'Resolution Agent',
      agentRole: 'Action Formulation',
      status: 'waiting',
      startTime: '08:29:02.115',
      durationMs: 240,
      purpose: 'Formulate refund proposal and evaluate risk gate',
      outputSummary: 'Proposed: Full Refund of $99.99 for TX-90412. Risk: HIGH (Amount >= $50.00 threshold) -> Triggered Human Approval Gate',
      toolUsed: 'hitl_dispatcher',
      confidence: 0.96
    },
    {
      id: 'trace-6',
      agentName: 'Review Agent',
      agentRole: 'Compliance Audit',
      status: 'queued',
      startTime: 'Pending Approval',
      durationMs: 0,
      purpose: 'Verify compliance rubrics and brand tone upon approval',
      outputSummary: 'Waiting for Human-in-the-Loop decision in Approval Center'
    }
  ];

  const initialTicket: Ticket = {
    id: sampleTicketId,
    sessionId: sampleSessionId,
    customer: DEFAULT_CUSTOMER,
    priority: 'HIGH',
    intent: 'Duplicate Charge',
    status: 'waiting_approval',
    riskLevel: 'HIGH',
    createdAt: '2026-08-31 08:29:00',
    originalMessage: 'I was charged twice for $99.99 on my recent order #ORD-44919 and I need a refund immediately.',
    aiClassification: {
      intent: 'Duplicate Charge',
      confidence: 0.984,
      priority: 'HIGH',
      routing: 'Billing & Financial Resolution Swarm',
      category: 'Payment Anomaly'
    },
    transactions: SAMPLE_TRANSACTIONS,
    citations: [
      {
        id: 'CIT-01',
        title: 'Billing & Payment Dispute Procedure',
        documentType: 'Policy Document',
        relevance: 0.97,
        excerpt: 'Duplicate transactions occurring within 10 minutes of initial authorization qualify for immediate reversal.',
        section: 'Section 3.2: Duplicate Transactions',
        sourceUrl: 'https://docs.internal.nexus/policies/billing-disputes#dup'
      },
      {
        id: 'CIT-02',
        title: 'Customer Service SLA v2.1',
        documentType: 'SLA Standard',
        relevance: 0.91,
        excerpt: 'Gold VIP customers receive prioritized settlement and instant acknowledgement.',
        section: 'Section 1.4: Tiered Resolution Protocols',
        sourceUrl: 'https://docs.internal.nexus/policies/sla#vip'
      }
    ],
    resolution: {
      proposedAction: 'Process full refund of $99.99 to original payment method (Visa •••• 4821)',
      riskLevel: 'HIGH',
      estimatedResolutionTime: 'Immediate upon approval',
      autoExecutable: false,
      summary: 'Duplicate charge verified in ledger. Reversal queued for operator approval.',
      amount: 99.99
    },
    review: {
      complianceStatus: 'requires_review',
      qualityScore: 98.5,
      reviewFeedback: 'Action adheres strictly to dispute policy. Pending manager HITL authorization.',
      policyChecked: 'DOC-POL-001 (Sec 3.2)'
    },
    approval: initialApproval,
    executionTrace: initialTrace,
    finalCustomerResponse: 'Hello Alex, thank you for reaching out. We identified the duplicate charge of $99.99 on Order #ORD-44919. Our supervisor agent has verified the duplicate transaction and queued the refund for manager sign-off. You will receive confirmation shortly.'
  };

  storedTickets[sampleSessionId] = initialTicket;
  storedTickets[sampleTicketId] = initialTicket;
  pendingApprovals.push(initialApproval);

  storedSessions.push({
    sessionId: sampleSessionId,
    ticketId: sampleTicketId,
    customerName: DEFAULT_CUSTOMER.name,
    customerEmail: DEFAULT_CUSTOMER.email,
    customerTier: DEFAULT_CUSTOMER.accountTier,
    intent: 'Duplicate Charge',
    priority: 'HIGH',
    status: 'waiting_approval',
    risk: 'HIGH',
    approvalState: 'pending',
    createdAt: '2026-08-31 08:29:00',
    messageCount: 2,
    lastMessageSnippet: 'I was charged twice for $99.99 on my recent order...'
  });

  // Add 2 more historical sessions
  storedSessions.push({
    sessionId: 'SESS-2026-0829',
    ticketId: 'TKT-7A19BC02',
    customerName: 'Sarah Jenkins',
    customerEmail: 's.jenkins@vanguard.com',
    customerTier: 'Enterprise VIP',
    intent: 'Subscription Upgrade',
    priority: 'MEDIUM',
    status: 'resolved',
    risk: 'LOW',
    approvalState: 'none',
    createdAt: '2026-08-29 14:15:00',
    resolutionTime: '42s',
    messageCount: 4,
    lastMessageSnippet: 'Can we add 20 additional seats to our Enterprise workspace?'
  });

  storedSessions.push({
    sessionId: 'SESS-2026-0828',
    ticketId: 'TKT-5E8812F9',
    customerName: 'Marcus Vance',
    customerEmail: 'mvance@zenith.ai',
    customerTier: 'Silver',
    intent: 'API Rate Limit Inquiry',
    priority: 'LOW',
    status: 'resolved',
    risk: 'LOW',
    approvalState: 'none',
    createdAt: '2026-08-28 11:05:00',
    resolutionTime: '18s',
    messageCount: 3,
    lastMessageSnippet: 'How do I request a temporary rate limit increase for load testing?'
  });
}

seedInitialData();

// ==========================================
// API ROUTES — NEXUS AI ENTERPRISE SUITE
// ==========================================

// 1. Health Endpoint
app.get(['/health', '/api/health'], (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const healthData: SystemHealth = {
    status: 'healthy',
    backend: 'healthy',
    database: 'healthy',
    crmMcp: 'connected',
    billingMcp: 'connected',
    ticketingMcp: 'connected',
    notificationMcp: 'connected',
    rag: 'indexed',
    llm: 'connected',
    lastChecked: new Date().toISOString(),
    uptimePercent: 99.98,
    activeNodes: 6
  };

  const { status: _omittedStatus, ...restHealth } = healthData;
  res.json({
    status: 'ok',
    ...restHealth,
    providers: {
      gemini: hasGemini,
      pushover: Boolean(process.env.PUSHOVER_USER && process.env.PUSHOVER_TOKEN)
    },
    defaultProvider: hasGemini ? 'Gemini 2.5 Flash' : 'Nexus Enterprise Multi-Agent Engine'
  });
});

// 2. Metrics Endpoint (GET /api/v1/metrics)
app.get('/api/v1/metrics', (req, res) => {
  const metrics: SystemMetrics = {
    totalRequests: 2481,
    resolvedRequests: 2392,
    averageResolutionTimeSec: 18.4,
    successRatePercent: 98.6,
    humanApprovalsCount: pendingApprovals.filter(a => a.status === 'approved').length + 142,
    activeSessionsCount: storedSessions.filter(s => s.status === 'in_progress' || s.status === 'waiting_approval').length + 3,
    highRiskTicketsCount: storedSessions.filter(s => s.risk === 'HIGH').length + 5,
    aiAutomationRatePercent: 91.4,
    requestsOverTime: [
      { time: '00:00', requests: 120, automated: 112, escalated: 8 },
      { time: '04:00', requests: 95, automated: 90, escalated: 5 },
      { time: '08:00', requests: 430, automated: 395, escalated: 35 },
      { time: '12:00', requests: 680, automated: 625, escalated: 55 },
      { time: '16:00', requests: 740, automated: 680, escalated: 60 },
      { time: '20:00', requests: 416, automated: 382, escalated: 34 }
    ],
    topIntents: [
      { intent: 'Duplicate Charge & Billing', count: 890, percentage: 35.8 },
      { intent: 'Refund / Payment Reversal', count: 640, percentage: 25.8 },
      { intent: 'Subscription Tier Upgrade', count: 420, percentage: 16.9 },
      { intent: 'API Key & Token Limits', count: 310, percentage: 12.5 },
      { intent: 'Account Access & Security', count: 221, percentage: 8.9 }
    ],
    latencyDistribution: [
      { agent: 'Triage Agent', avgLatencyMs: 180 },
      { agent: 'Customer Intelligence', avgLatencyMs: 220 },
      { agent: 'RAG Knowledge', avgLatencyMs: 310 },
      { agent: 'Investigation', avgLatencyMs: 290 },
      { agent: 'Resolution Agent', avgLatencyMs: 340 },
      { agent: 'Review Agent', avgLatencyMs: 190 }
    ]
  };

  res.json(metrics);
});

// 3. Knowledge Status Endpoint (GET /api/v1/knowledge/status)
app.get('/api/v1/knowledge/status', (req, res) => {
  res.json({
    status: 'indexed',
    ragType: 'Hybrid BM25 + Dense Semantic Vector Search',
    embeddingModel: 'text-embedding-004',
    totalDocuments: KNOWLEDGE_DOCS.length,
    totalChunks: KNOWLEDGE_DOCS.reduce((acc, doc) => acc + doc.chunksCount, 0),
    lastIndexedAt: '2026-08-31T08:00:00Z',
    documents: KNOWLEDGE_DOCS
  });
});

// 4. Pending Approvals Endpoint (GET /api/v1/approvals/pending)
app.get('/api/v1/approvals/pending', (req, res) => {
  const pending = pendingApprovals.filter(a => a.status === 'pending');
  res.json(pending);
});

// 5. Submit Approval Endpoint (POST /api/v1/approvals)
app.post('/api/v1/approvals', async (req, res) => {
  const { ticketId, action, notes, approver = 'Uma Nagalla (Operations Lead)' } = req.body;

  const approvalIdx = pendingApprovals.findIndex(a => a.ticketId === ticketId || a.id === ticketId);
  if (approvalIdx === -1) {
    return res.status(404).json({ error: 'Approval request not found' });
  }

  const approval = pendingApprovals[approvalIdx];
  approval.status = action === 'approve' ? 'approved' : 'rejected';
  approval.resolvedAt = new Date().toISOString();
  approval.approver = approver;
  approval.notes = notes || (action === 'approve' ? 'Approved by operator after reviewing transaction anomaly.' : 'Rejected by operator.');

  // Update corresponding ticket
  const ticket = Object.values(storedTickets).find(t => t.id === approval.ticketId);
  if (ticket) {
    ticket.status = action === 'approve' ? 'resolved' : 'escalated';
    ticket.approval = approval;
    ticket.resolvedAt = new Date().toISOString();

    // Update execution trace
    const resolutionStep = ticket.executionTrace.find(s => s.agentName === 'Resolution Agent');
    if (resolutionStep) {
      resolutionStep.status = action === 'approve' ? 'approved' : 'rejected';
      resolutionStep.outputSummary = action === 'approve'
        ? `Refund of $${approval.amount.toFixed(2)} APPROVED by ${approver}. Gateway execution successful.`
        : `Action REJECTED by ${approver}. Escalated to manual dispute specialist.`;
    }

    const reviewStep = ticket.executionTrace.find(s => s.agentName === 'Review Agent');
    if (reviewStep) {
      reviewStep.status = 'completed';
      reviewStep.startTime = new Date().toLocaleTimeString();
      reviewStep.durationMs = 145;
      reviewStep.outputSummary = 'Compliance verified (100% adherence to DOC-POL-001). Confirmation dispatched to customer.';
    }

    ticket.finalCustomerResponse = action === 'approve'
      ? `Great news, Alex! Your refund of $${approval.amount.toFixed(2)} has been authorized and processed to your Visa card (ending in 4821). Reference ID: RFN-${Date.now().toString().slice(-6)}. You will see the credit within 1-3 business days.`
      : `Hello Alex, your request has been routed to our specialized payment dispute team for manual inspection. A case specialist will follow up with you directly within 2 hours.`;
  }

  // Update session
  const session = storedSessions.find(s => s.ticketId === approval.ticketId);
  if (session) {
    session.status = action === 'approve' ? 'resolved' : 'escalated';
    session.approvalState = action === 'approve' ? 'approved' : 'rejected';
    session.resolutionTime = '2m 31s';
  }

  // Audit log
  notificationAuditLogs.unshift({
    id: `notif-${Date.now()}`,
    type: 'system',
    timestamp: new Date().toISOString(),
    title: `Approval ${action === 'approve' ? 'Granted' : 'Rejected'} for Ticket ${approval.ticketId}`,
    details: `${approval.requestedAction} — Decided by ${approver}`,
    payload: { ticketId: approval.ticketId, action, notes }
  });

  // Pushover alert
  sendPushoverNotification(`[Nexus AI] Human Approval ${action.toUpperCase()}: ${approval.requestedAction} for ${approval.customerName}`);

  res.json({
    success: true,
    message: `Approval action '${action}' recorded successfully.`,
    approval,
    ticket
  });
});

// 6. Support Sessions Endpoint (GET /api/v1/sessions)
app.get('/api/v1/sessions', (req, res) => {
  res.json(storedSessions);
});

// 7. Ticket Details Endpoint (GET /api/v1/tickets/:session_id)
app.get('/api/v1/tickets/:session_id', (req, res) => {
  const { session_id } = req.params;
  const ticket = storedTickets[session_id] || Object.values(storedTickets).find(t => t.id === session_id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket/Session not found' });
  }

  res.json(ticket);
});

// 8. AI Customer Chat Endpoint (POST /api/v1/chat)
app.post('/api/v1/chat', async (req, res) => {
  const { message, sessionId = `SESS-${Date.now()}`, customerId = DEFAULT_CUSTOMER.id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const gemini = getGeminiClient();
  const startTime = Date.now();
  const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  // Analyze message intent & detect keywords
  const isDuplicate = /twice|double|duplicate|charged 2 times|two charges/i.test(message);
  const isRefund = /refund|reimburse|money back|return charge/i.test(message);
  const amountMatch = message.match(/\$?(\d+(\.\d{2})?)/);
  const detectedAmount = amountMatch ? parseFloat(amountMatch[1]) : (isDuplicate ? 99.99 : 50.00);

  const isHighRisk = (isDuplicate || isRefund) && detectedAmount >= 50.00;
  const priority: 'HIGH' | 'MEDIUM' | 'LOW' = isHighRisk ? 'HIGH' : (isRefund ? 'MEDIUM' : 'LOW');
  const intent = isDuplicate ? 'Duplicate Charge' : (isRefund ? 'Refund Request' : 'General Support Inquiry');

  // Build agent execution trace
  const executionTrace: AgentExecutionStep[] = [
    {
      id: `trace-1-${Date.now()}`,
      agentName: 'Triage Agent',
      agentRole: 'Intent Classification',
      status: 'completed',
      startTime: new Date(Date.now() - 600).toLocaleTimeString(),
      durationMs: 175,
      purpose: 'Classify customer message intent and evaluate urgency score',
      outputSummary: `Intent: "${intent}" | Priority: ${priority} | Confidence: 98.2%`,
      toolUsed: 'intent_classifier',
      confidence: 0.982
    },
    {
      id: `trace-2-${Date.now()}`,
      agentName: 'Customer Intelligence Agent',
      agentRole: 'CRM Enrichment',
      status: 'completed',
      startTime: new Date(Date.now() - 420).toLocaleTimeString(),
      durationMs: 195,
      purpose: 'Enrich ticket with CRM customer profile, lifetime value, and sentiment metrics',
      outputSummary: `${DEFAULT_CUSTOMER.name} | ${DEFAULT_CUSTOMER.accountTier} Tier | LTV: $${DEFAULT_CUSTOMER.lifetimeValue.toFixed(2)} | Sentiment: Frustrated`,
      toolUsed: 'crm_mcp_lookup',
      confidence: 0.99
    },
    {
      id: `trace-3-${Date.now()}`,
      agentName: 'Knowledge / RAG Agent',
      agentRole: 'Policy Semantic Retrieval',
      status: 'completed',
      startTime: new Date(Date.now() - 220).toLocaleTimeString(),
      durationMs: 280,
      purpose: 'Retrieve enterprise dispute guidelines and SLA resolution thresholds',
      outputSummary: 'Retrieved "Billing & Payment Dispute Procedure" (97% match) & "Customer Service SLA v2.1" (91% match)',
      toolUsed: 'hybrid_retriever',
      confidence: 0.97
    },
    {
      id: `trace-4-${Date.now()}`,
      agentName: 'Investigation Agent',
      agentRole: 'Transaction Anomaly Detection',
      status: 'completed',
      startTime: new Date(Date.now() - 100).toLocaleTimeString(),
      durationMs: 310,
      purpose: 'Inspect ledger records, match order IDs, and identify duplicate payment timestamps',
      outputSummary: isDuplicate
        ? `Anomaly Confirmed: Duplicate charge TX-90412 ($${detectedAmount}) detected 3 minutes after primary order.`
        : 'Ledger inspected: No transaction conflicts found. Standard inquiry flow.',
      toolUsed: 'billing_mcp_query',
      confidence: 0.99
    },
    {
      id: `trace-5-${Date.now()}`,
      agentName: 'Resolution Agent',
      agentRole: 'Action Formulation & Risk Gate',
      status: isHighRisk ? 'waiting' : 'completed',
      startTime: new Date().toLocaleTimeString(),
      durationMs: 260,
      purpose: 'Formulate remediation action and check Human-in-the-Loop policy gate',
      outputSummary: isHighRisk
        ? `Proposed: Refund of $${detectedAmount.toFixed(2)}. Risk: HIGH (Amount >= $50 threshold) -> Created Pending Approval APP-${Date.now().toString().slice(-4)}`
        : `Proposed: Automated resolution with policy response. Risk: LOW.`,
      toolUsed: isHighRisk ? 'hitl_dispatcher' : 'action_builder',
      confidence: 0.96
    },
    {
      id: `trace-6-${Date.now()}`,
      agentName: 'Review Agent',
      agentRole: 'Compliance & Quality Audit',
      status: isHighRisk ? 'queued' : 'completed',
      startTime: isHighRisk ? 'Pending Approval' : new Date().toLocaleTimeString(),
      durationMs: isHighRisk ? 0 : 160,
      purpose: 'Audit finalized message against brand standards and regulatory guidelines',
      outputSummary: isHighRisk
        ? 'Awaiting human authorization before executing financial reversal.'
        : 'Compliant (100% adherence to customer communication SLA).'
    }
  ];

  let approval: ApprovalRequest | undefined = undefined;
  if (isHighRisk) {
    approval = {
      id: `APP-${Date.now().toString().slice(-4)}`,
      ticketId,
      customerName: DEFAULT_CUSTOMER.name,
      customerEmail: DEFAULT_CUSTOMER.email,
      customerTier: `${DEFAULT_CUSTOMER.accountTier} Customer ($${DEFAULT_CUSTOMER.lifetimeValue.toFixed(2)} LTV)`,
      requestedAction: `Refund $${detectedAmount.toFixed(2)} to Visa •••• 4821`,
      amount: detectedAmount,
      riskLevel: 'HIGH',
      reason: isDuplicate
        ? `Duplicate payment detected within 3 minutes of original order for $${detectedAmount.toFixed(2)}`
        : `High-value reimbursement request ($${detectedAmount.toFixed(2)})`,
      timeWaiting: '00:05',
      status: 'pending',
      createdAt: new Date().toISOString(),
      evidence: {
        duplicateTransactionId: 'TX-90412',
        originalOrderId: 'ORD-44919',
        anomalyDetails: `Transaction TX-90412 duplicated order ORD-44919 for amount $${detectedAmount.toFixed(2)}`,
        policyMatched: 'DOC-POL-001: Billing & Payment Dispute Procedure (Rule #2: Refunds >= $50 require HITL approval)'
      }
    };
    pendingApprovals.unshift(approval);
  }

  // Generate smart AI response (using Gemini if available, or enterprise prompt builder)
  let customerReply = '';
  if (gemini) {
    try {
      const prompt = `You are the Customer Operations AI for Nexus AI.
Customer: ${DEFAULT_CUSTOMER.name} (${DEFAULT_CUSTOMER.accountTier} Tier, $${DEFAULT_CUSTOMER.lifetimeValue} LTV).
Customer Issue: "${message}"
Identified Intent: "${intent}"
Duplicate Detected: ${isDuplicate ? 'YES (TX-90412, Order ORD-44919)' : 'NO'}
Amount: $${detectedAmount}
Approval Required: ${isHighRisk ? 'YES (Queued for operator approval)' : 'NO'}

Respond in a warm, professional, concise enterprise tone. Acknowledge the issue clearly, reference their Order #ORD-44919 or transaction details if applicable, confirm that the system investigated and queued the $${detectedAmount} refund for immediate operator sign-off. Keep it under 4 sentences.`;

      const gen = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      customerReply = gen.text || '';
    } catch (e) {
      console.warn('Gemini chat fallback:', e);
    }
  }

  if (!customerReply) {
    if (isDuplicate) {
      customerReply = `Hello ${DEFAULT_CUSTOMER.name}, thank you for contacting Nexus Support. We have investigated your account and confirmed the duplicate charge of $${detectedAmount.toFixed(2)} on Order #ORD-44919. Because this is a high-value financial reversal, our supervisor agent has submitted the refund to our operations team for immediate sign-off. You will receive notification as soon as it is approved.`;
    } else {
      customerReply = `Hello ${DEFAULT_CUSTOMER.name}, thank you for reaching out. We have analyzed your request regarding "${message.slice(0, 50)}...". Our customer intelligence and knowledge agents have pulled your account details and verified our policy guidelines. A support specialist or automated resolution is being processed for your account.`;
    }
  }

  const newTicket: Ticket = {
    id: ticketId,
    sessionId,
    customer: DEFAULT_CUSTOMER,
    priority,
    intent,
    status: isHighRisk ? 'waiting_approval' : 'resolved',
    riskLevel: isHighRisk ? 'HIGH' : 'LOW',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    originalMessage: message,
    aiClassification: {
      intent,
      confidence: 0.982,
      priority,
      routing: 'Billing & Financial Operations Swarm',
      category: isDuplicate ? 'Payment Anomaly' : 'General Service'
    },
    transactions: SAMPLE_TRANSACTIONS,
    citations: [
      {
        id: 'CIT-01',
        title: 'Billing & Payment Dispute Procedure',
        documentType: 'Policy Document',
        relevance: 0.97,
        excerpt: 'Duplicate transactions occurring within 10 minutes of initial authorization qualify for immediate reversal.',
        section: 'Section 3.2: Duplicate Transactions'
      },
      {
        id: 'CIT-02',
        title: 'Customer Service SLA v2.1',
        documentType: 'SLA Standard',
        relevance: 0.91,
        excerpt: 'Gold VIP customers receive prioritized settlement and instant acknowledgement.',
        section: 'Section 1.4: Tiered Resolution Protocols'
      }
    ],
    resolution: {
      proposedAction: `Process full refund of $${detectedAmount.toFixed(2)} to Visa •••• 4821`,
      riskLevel: isHighRisk ? 'HIGH' : 'LOW',
      estimatedResolutionTime: isHighRisk ? '1-2 minutes (Pending Operator Sign-off)' : 'Instant',
      autoExecutable: !isHighRisk,
      summary: isDuplicate ? `Duplicate charge verified in ledger. Reversal queued for operator approval.` : `Inquiry processed.`,
      amount: detectedAmount
    },
    review: {
      complianceStatus: isHighRisk ? 'requires_review' : 'compliant',
      qualityScore: 98.8,
      reviewFeedback: isHighRisk ? 'Adheres to refund policy. Awaiting HITL approval.' : 'Verified compliant.',
      policyChecked: 'DOC-POL-001 (Sec 3.2)'
    },
    approval,
    executionTrace,
    finalCustomerResponse: customerReply
  };

  storedTickets[sessionId] = newTicket;
  storedTickets[ticketId] = newTicket;

  // Add/Update session
  const existingSessionIdx = storedSessions.findIndex(s => s.sessionId === sessionId);
  const sessionItem: SupportSession = {
    sessionId,
    ticketId,
    customerName: DEFAULT_CUSTOMER.name,
    customerEmail: DEFAULT_CUSTOMER.email,
    customerTier: DEFAULT_CUSTOMER.accountTier,
    intent,
    priority,
    status: isHighRisk ? 'waiting_approval' : 'resolved',
    risk: isHighRisk ? 'HIGH' : 'LOW',
    approvalState: isHighRisk ? 'pending' : 'none',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    messageCount: existingSessionIdx >= 0 ? storedSessions[existingSessionIdx].messageCount + 1 : 1,
    lastMessageSnippet: message.slice(0, 60)
  };

  if (existingSessionIdx >= 0) {
    storedSessions[existingSessionIdx] = sessionItem;
  } else {
    storedSessions.unshift(sessionItem);
  }

  // Audit log
  notificationAuditLogs.unshift({
    id: `notif-${Date.now()}`,
    type: isHighRisk ? 'interest' : 'system',
    timestamp: new Date().toISOString(),
    title: `New Ticket Created: ${ticketId} (${intent})`,
    details: `Customer ${DEFAULT_CUSTOMER.name} — Risk: ${isHighRisk ? 'HIGH' : 'LOW'} — Priority: ${priority}`,
    payload: { ticketId, sessionId, isHighRisk }
  });

  if (isHighRisk) {
    sendPushoverNotification(`[Nexus AI] ⚠️ HIGH RISK TICKET: ${ticketId} for ${DEFAULT_CUSTOMER.name} — Action: Refund $${detectedAmount.toFixed(2)}`);
  }

  res.json({
    reply: customerReply,
    ticket: newTicket,
    session: sessionItem,
    approvalRequired: isHighRisk,
    approval,
    executionTrace,
    durationMs: Date.now() - startTime
  });
});

// 9. Canonical Demo Runner Endpoint (GET /api/v1/demo/run-e2e)
app.get('/api/v1/demo/run-e2e', async (req, res) => {
  const demoSessionId = `DEMO-${Date.now()}`;
  const demoTicketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const demoApproval: ApprovalRequest = {
    id: `APP-DEMO-${Date.now().toString().slice(-4)}`,
    ticketId: demoTicketId,
    customerName: 'Alex Johnson',
    customerEmail: 'alex.johnson@enterprise-cloud.io',
    customerTier: 'Gold Customer ($2,450 LTV)',
    requestedAction: 'Refund $99.99 to Visa •••• 4821',
    amount: 99.99,
    riskLevel: 'HIGH',
    reason: 'Duplicate payment detected within 3 minutes of original order',
    timeWaiting: '00:01',
    status: 'pending',
    createdAt: new Date().toISOString(),
    evidence: {
      duplicateTransactionId: 'TX-90412',
      originalOrderId: 'ORD-44919',
      anomalyDetails: 'Transaction TX-90412 ($99.99) duplicated order ORD-44919 at 08:28:12 (3 min after TX-90411)',
      policyMatched: 'DOC-POL-001: Billing & Payment Dispute Procedure (Rule #2: Refunds >= $50 require HITL approval)'
    }
  };

  const demoTrace: AgentExecutionStep[] = [
    {
      id: 'demo-trace-1',
      agentName: 'Triage Agent',
      agentRole: 'Intent Classification',
      status: 'completed',
      startTime: '00:00.120',
      durationMs: 165,
      purpose: 'Classify incoming customer request & calculate risk priority',
      outputSummary: 'Intent: "Duplicate Charge" | Confidence: 99.1% | Priority: HIGH',
      toolUsed: 'intent_classifier',
      confidence: 0.991
    },
    {
      id: 'demo-trace-2',
      agentName: 'Customer Intelligence Agent',
      agentRole: 'CRM Enrichment',
      status: 'completed',
      startTime: '00:00.285',
      durationMs: 190,
      purpose: 'Query MCP CRM connector for customer profile, LTV, and history',
      outputSummary: 'Alex Johnson | Gold Tier | $2,450 LTV | Neutral Sentiment | 7 Prior Tickets',
      toolUsed: 'crm_mcp_lookup',
      confidence: 0.99
    },
    {
      id: 'demo-trace-3',
      agentName: 'Knowledge / RAG Agent',
      agentRole: 'Policy Retrieval',
      status: 'completed',
      startTime: '00:00.475',
      durationMs: 270,
      purpose: 'Retrieve enterprise dispute guidelines and SLA resolution thresholds',
      outputSummary: 'Retrieved "Billing & Payment Dispute Procedure" (97% match) & "Customer Service SLA v2.1" (91% match)',
      toolUsed: 'hybrid_retriever',
      confidence: 0.97
    },
    {
      id: 'demo-trace-4',
      agentName: 'Investigation Agent',
      agentRole: 'Transaction Audit',
      status: 'completed',
      startTime: '00:00.745',
      durationMs: 310,
      purpose: 'Inspect ledger records, match order IDs, and identify duplicate payment timestamps',
      outputSummary: 'Anomaly Confirmed: Duplicate charge TX-90412 ($99.99) detected 3 minutes after TX-90411 on Order #ORD-44919',
      toolUsed: 'billing_mcp_query',
      confidence: 0.995
    },
    {
      id: 'demo-trace-5',
      agentName: 'Resolution Agent',
      agentRole: 'Action Formulation',
      status: 'waiting',
      startTime: '00:01.055',
      durationMs: 240,
      purpose: 'Formulate refund proposal and evaluate risk gate',
      outputSummary: 'Proposed: Refund of $99.99 for TX-90412. Risk: HIGH (Amount >= $50.00 threshold) -> Created Pending Approval Gate',
      toolUsed: 'hitl_dispatcher',
      confidence: 0.96
    },
    {
      id: 'demo-trace-6',
      agentName: 'Review Agent',
      agentRole: 'Compliance Audit',
      status: 'queued',
      startTime: 'Pending Approval',
      durationMs: 0,
      purpose: 'Verify compliance rubrics and brand tone upon operator approval',
      outputSummary: 'Waiting for Human-in-the-Loop decision in Approval Center'
    }
  ];

  const demoTicket: Ticket = {
    id: demoTicketId,
    sessionId: demoSessionId,
    customer: DEFAULT_CUSTOMER,
    priority: 'HIGH',
    intent: 'Duplicate Charge',
    status: 'waiting_approval',
    riskLevel: 'HIGH',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    originalMessage: 'I was charged twice for $99.99 on my recent order #ORD-44919 and I need a refund immediately.',
    aiClassification: {
      intent: 'Duplicate Charge',
      confidence: 0.991,
      priority: 'HIGH',
      routing: 'Billing & Financial Resolution Swarm',
      category: 'Payment Anomaly'
    },
    transactions: SAMPLE_TRANSACTIONS,
    citations: [
      {
        id: 'CIT-DEMO-01',
        title: 'Billing & Payment Dispute Procedure',
        documentType: 'Policy Document',
        relevance: 0.97,
        excerpt: 'Duplicate transactions occurring within 10 minutes of initial authorization qualify for immediate reversal.',
        section: 'Section 3.2: Duplicate Transactions'
      },
      {
        id: 'CIT-DEMO-02',
        title: 'Customer Service SLA v2.1',
        documentType: 'SLA Standard',
        relevance: 0.91,
        excerpt: 'Gold VIP customers receive prioritized settlement and instant acknowledgement.',
        section: 'Section 1.4: Tiered Resolution Protocols'
      }
    ],
    resolution: {
      proposedAction: 'Process full refund of $99.99 to Visa •••• 4821',
      riskLevel: 'HIGH',
      estimatedResolutionTime: 'Immediate upon approval',
      autoExecutable: false,
      summary: 'Duplicate charge verified in ledger. Reversal queued for operator approval.',
      amount: 99.99
    },
    review: {
      complianceStatus: 'requires_review',
      qualityScore: 99.2,
      reviewFeedback: 'Adheres to refund policy. Awaiting operator authorization.',
      policyChecked: 'DOC-POL-001 (Sec 3.2)'
    },
    approval: demoApproval,
    executionTrace: demoTrace,
    finalCustomerResponse: 'Hello Alex, thank you for reaching out. We identified the duplicate charge of $99.99 on Order #ORD-44919. Our supervisor agent has verified the duplicate transaction and queued the refund for manager sign-off. You will receive confirmation shortly.'
  };

  storedTickets[demoSessionId] = demoTicket;
  storedTickets[demoTicketId] = demoTicket;
  pendingApprovals.unshift(demoApproval);

  const demoSessionItem: SupportSession = {
    sessionId: demoSessionId,
    ticketId: demoTicketId,
    customerName: DEFAULT_CUSTOMER.name,
    customerEmail: DEFAULT_CUSTOMER.email,
    customerTier: DEFAULT_CUSTOMER.accountTier,
    intent: 'Duplicate Charge',
    priority: 'HIGH',
    status: 'waiting_approval',
    risk: 'HIGH',
    approvalState: 'pending',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    messageCount: 1,
    lastMessageSnippet: 'I was charged twice for $99.99 on my recent order #ORD-44919...'
  };

  storedSessions.unshift(demoSessionItem);

  res.json({
    status: 'success',
    scenario: 'Canonical Duplicate Charge Resolution with HITL Oversight',
    sessionId: demoSessionId,
    ticket: demoTicket,
    approval: demoApproval
  });
});

// 10. AI Agents Catalog (GET /api/v1/agents)
app.get('/api/v1/agents', (req, res) => {
  res.json(AGENT_SERVICES);
});

// 11. Centralized Notifications & Audit Logs (GET /api/notifications)
app.get('/api/notifications', (req, res) => {
  res.json(notificationAuditLogs);
});

// 12. Manual Pushover Test (POST /api/pushover/test)
app.post('/api/pushover/test', async (req, res) => {
  const { message = 'Nexus AI: System operational notification test.' } = req.body;
  const sent = await sendPushoverNotification(message);

  const entry = {
    id: `notif-${Date.now()}`,
    type: 'system',
    timestamp: new Date().toISOString(),
    title: 'Manual Pushover Test',
    details: message,
    payload: { message },
    deliveredToPushover: sent,
  };
  notificationAuditLogs.unshift(entry);

  res.json({ success: sent, entry });
});

// 13. API Docs Schema Summary (GET /docs, GET /api/v1/docs)
app.get(['/docs', '/api/v1/docs'], (req, res) => {
  res.json({
    platform: 'NEXUS AI Enterprise Intelligent Customer Operations',
    version: '2.4.0',
    endpoints: [
      { method: 'POST', path: '/api/v1/chat', description: 'Submit customer message to multi-agent swarm' },
      { method: 'GET', path: '/api/v1/tickets/:session_id', description: 'Retrieve complete ticket state & agent trace' },
      { method: 'GET', path: '/api/v1/approvals/pending', description: 'Retrieve pending human-in-the-loop approval queue' },
      { method: 'POST', path: '/api/v1/approvals', description: 'Submit human approval/rejection decision' },
      { method: 'GET', path: '/api/v1/sessions', description: 'List customer support sessions' },
      { method: 'GET', path: '/api/v1/metrics', description: 'Retrieve platform operations metrics & analytics' },
      { method: 'GET', path: '/api/v1/knowledge/status', description: 'Retrieve RAG status & indexed enterprise documents' },
      { method: 'GET', path: '/api/v1/demo/run-e2e', description: 'Trigger canonical end-to-end demo workflow' },
      { method: 'GET', path: '/health', description: 'Service health check for backend, MCPs, RAG, and LLMs' }
    ]
  });
});

// ==========================================
// STATIC FRONTEND SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXUS AI] Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
