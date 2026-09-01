import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  Ticket,
  SupportSession,
  ChatMessage,
  ApprovalRequest,
  PolicyCitation
} from '../types';

interface CustomerSupportViewProps {
  currentTicket: Ticket | null;
  sessions: SupportSession[];
  onSelectSession: (sessionId: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  onOpenApproval: (approval: ApprovalRequest) => void;
  onViewCitation: (citation: PolicyCitation) => void;
  onRunDemo: () => void;
}

export const CustomerSupportView: React.FC<CustomerSupportViewProps> = ({
  currentTicket,
  sessions,
  onSelectSession,
  onSendMessage,
  isLoading,
  onOpenApproval,
  onViewCitation,
  onRunDemo
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showTrace, setShowTrace] = useState(true);
  const [sessionSearch, setSessionSearch] = useState('');

  const quickPrompts = [
    'I was charged twice for $99.99 on my recent order #ORD-44919 and I need a refund immediately.',
    'How do I upgrade our organization to the Enterprise VIP plan?',
    'What is the standard SLA turnaround time for Gold Tier support tickets?'
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;
    onSendMessage(text);
    if (!textToSend) setInputMessage('');
  };

  const filteredSessions = sessions.filter(s =>
    s.customerName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.intent.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.ticketId.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-4 pb-4">
      {/* LEFT COLUMN: Sessions Browser List (280px) */}
      <div className="w-full lg:w-72 bg-slate-900/90 border border-slate-800/90 rounded-2xl flex flex-col overflow-hidden shadow-lg flex-shrink-0">
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Support Sessions</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {sessions.length} Cases
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={sessionSearch}
              onChange={e => setSessionSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredSessions.map(s => {
            const isSelected = currentTicket?.sessionId === s.sessionId || currentTicket?.id === s.ticketId;
            return (
              <button
                key={s.sessionId}
                onClick={() => onSelectSession(s.sessionId)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-inner'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {s.customerName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{s.ticketId}</span>
                </div>

                <div className="text-xs text-indigo-300 font-medium truncate mb-1.5">
                  {s.intent}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        s.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : s.priority === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.priority}
                    </span>
                    {s.risk === 'HIGH' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        HIGH RISK
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-semibold ${
                      s.status === 'resolved'
                        ? 'text-emerald-400'
                        : s.status === 'waiting_approval'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Demo button at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onRunDemo}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Load Duplicate $99.99 Case</span>
          </button>
        </div>
      </div>

      {/* MIDDLE COLUMN: Customer Conversation & Multi-Agent Trace (Flex 1) */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl flex flex-col overflow-hidden shadow-lg min-w-0">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {currentTicket ? currentTicket.customer.name.charAt(0) : 'A'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">
                  {currentTicket ? currentTicket.customer.name : 'Alex Johnson'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {currentTicket ? currentTicket.customer.accountTier : 'Gold Tier'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Ticket ID: {currentTicket?.id || 'TKT-8F42A1C9'} • Intent: {currentTicket?.intent || 'Duplicate Charge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Trace</span>
              {showTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Chat Stream & Agent Execution Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Prompts Selector */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suggested Scenario Queries:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="text-left text-xs bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-slate-700/70 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Message Bubble */}
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-xl bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-md">
              <div className="font-semibold text-[10px] text-indigo-200 mb-1 flex items-center justify-between">
                <span>{currentTicket ? currentTicket.customer.name : 'Alex Johnson'}</span>
                <span>{currentTicket?.createdAt || 'Today 08:29 AM'}</span>
              </div>
              <p>{currentTicket?.originalMessage || 'I was charged twice for $99.99 on my recent order #ORD-44919 and I need a refund immediately.'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* Multi-Agent Execution Trace Card (Expandable) */}
          {showTrace && currentTicket && currentTicket.executionTrace && (
            <div className="my-3 rounded-2xl bg-slate-950/90 border border-indigo-500/30 overflow-hidden shadow-xl animate-in fade-in duration-200">
              <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Autonomous Multi-Agent Swarm Trace</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40">
                  6 Pipeline Stages Executed
                </span>
              </div>

              <div className="p-3.5 space-y-3">
                {currentTicket.executionTrace.map((step, idx) => (
                  <div key={step.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5">
                      {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {step.status === 'waiting' && <Clock className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />}
                      {step.status === 'queued' && <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0" />}
                      {step.status === 'rejected' && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{step.agentName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{step.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{step.purpose}</p>
                      <div className="mt-1 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-200">
                        {step.outputSummary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomaly Callout Banner if Duplicate Detected */}
          {currentTicket?.intent === 'Duplicate Charge' && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-300">Transaction Anomaly Confirmed in Ledger</div>
                <p className="text-slate-300">
                  Duplicate transaction <span className="font-mono text-white font-semibold">TX-90412 ($99.99)</span> detected exactly 3 minutes after primary order <span className="font-mono text-white font-semibold">ORD-44919</span>.
                </p>
              </div>
            </div>
          )}

          {/* Policy Citations Used */}
          {currentTicket?.citations && currentTicket.citations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Grounded Citations:
              </span>
              {currentTicket.citations.map(cit => (
                <button
                  key={cit.id}
                  onClick={() => onViewCitation(cit)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-indigo-300 hover:text-indigo-200 text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>{cit.title} ({(cit.relevance * 100).toFixed(0)}%)</span>
                </button>
              ))}
            </div>
          )}

          {/* High-Risk HITL Alert Banner if Pending Approval */}
          {currentTicket?.status === 'waiting_approval' && currentTicket.approval && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Human-in-the-Loop Approval Required
                  </div>
                  <p className="text-xs text-slate-200">
                    Proposed: <span className="font-semibold text-white">{currentTicket.approval.requestedAction}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{currentTicket.approval.reason}</p>
                </div>
              </div>

              <button
                onClick={() => onOpenApproval(currentTicket.approval!)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md flex-shrink-0"
              >
                <span>Authorize Refund</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* AI Response Message Bubble */}
          {currentTicket?.finalCustomerResponse && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-xl bg-slate-800 border border-slate-700/80 text-slate-100 p-3.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-md space-y-2">
                <div className="font-semibold text-[10px] text-indigo-300 flex items-center justify-between border-b border-slate-700/60 pb-1">
                  <span>Nexus Customer Operations AI</span>
                  <span>Supervisor Verified</span>
                </div>
                <p className="whitespace-pre-line">{currentTicket.finalCustomerResponse}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-indigo-400 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Multi-Agent Swarm is analyzing ledger & formulating policy resolution...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="customer-support-input"
              type="text"
              placeholder="Type customer message or inquiry..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              id="btn-send-support-message"
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25"
            >
              <span>Dispatch</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Customer Intelligence CRM & Live Ticket Snapshot (320px) */}
      <div className="w-full lg:w-80 space-y-4 flex-shrink-0 overflow-y-auto">
        {/* Customer Profile Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-4 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Customer Profile
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
              VIP Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="text-sm font-bold text-white">{currentTicket?.customer.name || 'Alex Johnson'}</div>
              <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Mail className="w-3 h-3 text-slate-500" /> {currentTicket?.customer.email || 'alex.johnson@enterprise-cloud.io'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">Account Tier</div>
                <div className="font-bold text-indigo-300">{currentTicket?.customer.accountTier || 'Gold'}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">Lifetime Value</div>
                <div className="font-bold text-emerald-400">
                  ${currentTicket?.customer.lifetimeValue.toFixed(2) || '2,450.00'}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Apex Logistics Global</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>+1 (415) 890-2104</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Ledger Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Recent Transactions
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Ledger MCP</span>
          </div>

          <div className="space-y-2 text-xs">
            {currentTicket?.transactions.map(tx => (
              <div
                key={tx.id}
                className={`p-2.5 rounded-xl border transition-colors ${
                  tx.duplicate
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold">
                  <span className="text-white">${tx.amount.toFixed(2)}</span>
                  <span className={tx.duplicate ? 'text-rose-400 text-[10px]' : 'text-slate-500 text-[10px]'}>
                    {tx.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span>{tx.orderId}</span>
                  <span className="text-slate-400">{tx.date.split(' ')[1]}</span>
                </div>

                {tx.duplicate && (
                  <div className="mt-1.5 text-[10px] font-bold text-rose-300 flex items-center gap-1 bg-rose-500/20 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> Duplicate Charge Anomaly
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
