import React from 'react';
import {
  Ticket,
  CustomerProfile,
  PolicyCitation,
  ApprovalRequest
} from '../types';
import {
  X,
  User,
  CreditCard,
  BookOpen,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  Building2,
  Mail
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenApproval: (approval: ApprovalRequest) => void;
  onViewCitation: (citation: PolicyCitation) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onOpenApproval,
  onViewCitation
}) => {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Ticket Audit: {ticket.id}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ticket.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : ticket.status === 'waiting_approval'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  {ticket.priority} PRIORITY
                </span>
              </div>
              <p className="text-xs text-slate-400">Session ID: {ticket.sessionId} • Created: {ticket.createdAt}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & AI Classification Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Customer Information
              </div>
              <div className="text-sm font-bold text-white">{ticket.customer.name}</div>
              <div className="text-xs text-slate-400">{ticket.customer.email}</div>
              <div className="flex items-center gap-4 text-xs pt-1">
                <div>Tier: <span className="font-semibold text-indigo-300">{ticket.customer.accountTier}</span></div>
                <div>LTV: <span className="font-semibold text-emerald-400">${ticket.customer.lifetimeValue.toFixed(2)}</span></div>
                <div>Sentiment: <span className="font-semibold text-amber-300">{ticket.customer.sentiment}</span></div>
              </div>
            </div>

            {/* AI Classification Box */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Intent Classification
              </div>
              <div className="text-sm font-bold text-white">{ticket.aiClassification.intent}</div>
              <div className="text-xs text-slate-400">
                Confidence: <span className="font-semibold text-emerald-400">{(ticket.aiClassification.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-slate-400">
                Routing: <span className="font-semibold text-indigo-300">{ticket.aiClassification.routing}</span>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Customer Complaint</div>
            <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
              "{ticket.originalMessage}"
            </p>
          </div>

          {/* Transaction Ledger & Anomaly Evidence */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Billing Ledger Diagnostic
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="pb-2 font-semibold">Tx ID</th>
                    <th className="pb-2 font-semibold">Order ID</th>
                    <th className="pb-2 font-semibold">Timestamp</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Anomaly Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ticket.transactions.map(tx => (
                    <tr key={tx.id} className={tx.duplicate ? 'bg-rose-500/10 text-rose-300' : 'text-slate-300'}>
                      <td className="py-2 font-mono">{tx.id}</td>
                      <td className="py-2">{tx.orderId}</td>
                      <td className="py-2">{tx.date}</td>
                      <td className="py-2 font-bold">${tx.amount.toFixed(2)}</td>
                      <td className="py-2">{tx.status}</td>
                      <td className="py-2">
                        {tx.duplicate ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                            DUPLICATE ANOMALY
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Citations */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Policy & SLA Citations (RAG)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticket.citations.map(cit => (
                <div key={cit.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{cit.title}</span>
                    <span className="text-emerald-400 font-mono">{(cit.relevance * 100).toFixed(0)}% Match</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{cit.excerpt}</p>
                  <div className="text-[10px] text-slate-500 font-mono">{cit.section}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Agent Swarm Execution Trace */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" /> Multi-Agent Swarm Execution Trace
            </div>
            <div className="space-y-2">
              {ticket.executionTrace.map((step, idx) => (
                <div key={step.id || idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-3">
                  <div className="mt-0.5">
                    {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step.status === 'waiting' && <Clock className="w-4 h-4 text-amber-400" />}
                    {step.status === 'queued' && <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{step.agentName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{step.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{step.purpose}</p>
                    <div className="mt-1 p-2 rounded bg-slate-900 font-mono text-[11px] text-indigo-200">
                      {step.outputSummary}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            {ticket.status === 'waiting_approval' && ticket.approval && (
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Pending Human Authorization
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {ticket.status === 'waiting_approval' && ticket.approval && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApproval(ticket.approval!);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                Review & Authorize Refund
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
