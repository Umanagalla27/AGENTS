import React, { useState } from 'react';
import {
  Bot,
  ShieldCheck,
  Users,
  BookOpen,
  Search,
  Wrench,
  CheckCircle2,
  Zap,
  ArrowRight,
  Activity,
  Layers,
  Cpu,
  Sparkles,
  Terminal
} from 'lucide-react';
import { AgentService } from '../types';

interface AgentsArchitectureViewProps {
  agents: AgentService[];
  onTestAgent?: (agentId: string, testPrompt: string) => void;
}

export const AgentsArchitectureView: React.FC<AgentsArchitectureViewProps> = ({
  agents
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('agent-triage');
  const [testInput, setTestInput] = useState('Customer reports duplicate charge of $99.99 on Order #ORD-44919');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const defaultAgents: AgentService[] = [
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

  const agentList = agents.length > 0 ? agents : defaultAgents;
  const currentAgent = agentList.find(a => a.id === selectedAgent) || agentList[0];

  const handleSimulate = () => {
    setIsSimulating(true);
    setTestResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      if (selectedAgent === 'agent-triage') {
        setTestResult(JSON.stringify({
          intent: 'Duplicate Charge',
          confidence: 0.988,
          priority: 'HIGH',
          sentiment: 'Neutral / Frustrated',
          riskLevel: 'HIGH',
          suggestedRouting: 'Billing & Financial Resolution Swarm'
        }, null, 2));
      } else if (selectedAgent === 'agent-crm') {
        setTestResult(JSON.stringify({
          customerId: 'CUST-88219',
          name: 'Alex Johnson',
          accountTier: 'Gold VIP',
          lifetimeValue: 2450.00,
          previousTicketsCount: 7,
          slaTargetMinutes: 5
        }, null, 2));
      } else if (selectedAgent === 'agent-rag') {
        setTestResult(JSON.stringify({
          query: testInput,
          matchedDocument: 'DOC-POL-001: Billing & Payment Dispute Procedure',
          relevance: 0.97,
          relevantRule: 'Duplicate transactions occurring within 10 minutes qualify for immediate reversal. Reversals >= $50 require operator authorization.'
        }, null, 2));
      } else if (selectedAgent === 'agent-investigation') {
        setTestResult(JSON.stringify({
          orderId: 'ORD-44919',
          anomalyDetected: true,
          type: 'DUPLICATE_TRANSACTION_COLLISION',
          tx1: { id: 'TX-90411', timestamp: '08:25:04', amount: 99.99 },
          tx2: { id: 'TX-90412', timestamp: '08:28:12', amount: 99.99 },
          deltaSeconds: 188
        }, null, 2));
      } else if (selectedAgent === 'agent-resolution') {
        setTestResult(JSON.stringify({
          proposedAction: 'Process full refund of $99.99 for TX-90412',
          riskGate: 'HIGH_RISK_TRIGGERED',
          requiresHumanApproval: true,
          approvalReason: 'Refund amount ($99.99) >= $50.00 security threshold',
          estimatedResolutionTime: 'Immediate upon operator approval'
        }, null, 2));
      } else {
        setTestResult(JSON.stringify({
          complianceStatus: 'COMPLIANT_WITH_POLICIES',
          qualityScore: 99.4,
          policyChecked: 'DOC-POL-001 (Section 3.2)',
          toneAudit: 'Professional, Empathetic, Concise'
        }, null, 2));
      }
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" /> Multi-Agent Swarm Architecture
          </h2>
          <p className="text-xs text-slate-400">
            Coordinated autonomous execution across 6 specialized AI agents powered by Gemini 2.5 Flash
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>6 Nodes Synchronized</span>
          </span>
        </div>
      </div>

      {/* Visual Pipeline Graph Diagram */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Execution Pipeline Topology
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Sequential Swarm with Fallback Gate</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {agentList.map((agent, idx) => {
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-3.5 rounded-2xl text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-600/25 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                    0{idx + 1}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
                </div>
                <div className="font-bold text-xs text-white truncate mb-1">{agent.name}</div>
                <div className="text-[10px] text-indigo-300 line-clamp-2 leading-tight">{agent.role}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-2">{agent.averageLatencyMs}ms</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deep Agent Inspector & Testing Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Agent Detail Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{currentAgent.name}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{currentAgent.role}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {currentAgent.model}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{currentAgent.description}</p>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Tasks Handled</div>
              <div className="text-sm font-extrabold text-white">{currentAgent.tasksHandled.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Avg Latency</div>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">{currentAgent.averageLatencyMs}ms</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Success Rate</div>
              <div className="text-sm font-extrabold text-indigo-300 font-mono">{currentAgent.successRate}%</div>
            </div>
          </div>

          {/* Registered Tools */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Registered MCP Tools
            </div>
            <div className="flex flex-wrap gap-2">
              {currentAgent.tools.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3 text-slate-500" />
                  {t}()
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Interactive Simulator */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Agent Testing Sandbox
            </h3>
            <span className="text-[10px] text-slate-500">Live Simulation</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400">Simulate Input Payload:</label>
            <textarea
              rows={3}
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>{isSimulating ? 'Executing Node...' : `Test ${currentAgent.name}`}</span>
          </button>

          {/* Test Output Box */}
          {testResult && (
            <div className="space-y-1 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Structured Output:</div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-48">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
