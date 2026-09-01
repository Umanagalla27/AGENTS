import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  DollarSign,
  ArrowRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { ApprovalRequest } from '../types';
import { ApprovalReviewModal } from './ApprovalReviewModal';

interface ApprovalsCenterViewProps {
  pendingApprovals: ApprovalRequest[];
  onSubmitDecision: (ticketId: string, action: 'approve' | 'reject', notes: string) => Promise<void>;
  isLoading: boolean;
  onRunDemo: () => void;
}

export const ApprovalsCenterView: React.FC<ApprovalsCenterViewProps> = ({
  pendingApprovals,
  onSubmitDecision,
  isLoading,
  onRunDemo
}) => {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApprovals = pendingApprovals.filter(a =>
    a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.requestedAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValueAtRisk = pendingApprovals.reduce((acc, a) => acc + (a.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Human-in-the-Loop Approval Center
          </h2>
          <p className="text-xs text-slate-400">
            Authorization gateway for high-risk agent recommendations, financial reversals, and policy exceptions
          </p>
        </div>

        {pendingApprovals.length === 0 && (
          <button
            onClick={onRunDemo}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Sample Approval Case ($99.99)</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Pending Authorization</div>
          <div className="text-2xl font-extrabold text-amber-400">{pendingApprovals.length}</div>
          <div className="text-[10px] text-amber-300 font-semibold">Active in Queue</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Value Under Review</div>
          <div className="text-2xl font-extrabold text-white font-mono">${totalValueAtRisk.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500">Financial Hold</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Avg Operator Latency</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">1m 45s</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Within Target SLA (&lt;5m)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Approved Today</div>
          <div className="text-2xl font-extrabold text-indigo-400">142</div>
          <div className="text-[10px] text-slate-500">99.2% Accuracy</div>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Pending Review Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {pendingApprovals.length} Action Required
            </span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter approvals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {filteredApprovals.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <p className="text-sm font-bold text-white">No Pending Approvals in Queue</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All high-risk financial reversals and exceptions have been processed. Click below to simulate a live duplicate charge case.
            </p>
            <button
              onClick={onRunDemo}
              className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
            >
              Run Canonical Duplicate Charge Demo ($99.99)
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Request ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Requested Action</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Risk Level</th>
                  <th className="pb-3 font-semibold">Waiting Time</th>
                  <th className="pb-3 font-semibold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredApprovals.map(appr => (
                  <tr key={appr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-amber-300">{appr.id}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-white">{appr.customerName}</div>
                      <div className="text-[10px] text-indigo-300">{appr.customerTier}</div>
                    </td>
                    <td className="py-3.5 font-medium text-slate-200">
                      <div>{appr.requestedAction}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-md">{appr.reason}</div>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-white">${appr.amount.toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        {appr.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{appr.timeWaiting}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedApproval(appr)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Review & Decide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Review Modal */}
      <ApprovalReviewModal
        approval={selectedApproval}
        isOpen={Boolean(selectedApproval)}
        onClose={() => setSelectedApproval(null)}
        onSubmitDecision={onSubmitDecision}
        isLoading={isLoading}
      />
    </div>
  );
};
