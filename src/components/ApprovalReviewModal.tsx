import React, { useState } from 'react';
import {
  ApprovalRequest
} from '../types';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ApprovalReviewModalProps {
  approval: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDecision: (ticketId: string, action: 'approve' | 'reject', notes: string) => Promise<void>;
  isLoading: boolean;
}

export const ApprovalReviewModal: React.FC<ApprovalReviewModalProps> = ({
  approval,
  isOpen,
  onClose,
  onSubmitDecision,
  isLoading
}) => {
  const [operatorNotes, setOperatorNotes] = useState('');

  if (!isOpen || !approval) return null;

  const handleDecision = async (action: 'approve' | 'reject') => {
    await onSubmitDecision(approval.ticketId, action, operatorNotes);
    setOperatorNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Human-in-the-Loop Authorization</h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                  HIGH RISK GATE
                </span>
              </div>
              <p className="text-xs text-slate-400">Approval Request ID: {approval.id} • Waiting: {approval.timeWaiting}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Action Callout Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Proposed Action</div>
              <div className="text-sm font-bold text-indigo-300">{approval.requestedAction}</div>
              <div className="text-xs text-slate-400 mt-0.5">{approval.reason}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Amount</div>
              <div className="text-xl font-extrabold text-white font-mono">${approval.amount.toFixed(2)}</div>
            </div>
          </div>

          {/* Customer Context */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Beneficiary Customer
            </div>
            <div className="text-xs font-semibold text-white">{approval.customerName} ({approval.customerEmail})</div>
            <div className="text-[11px] text-indigo-300">{approval.customerTier}</div>
          </div>

          {/* Ledger Evidence Box */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
            <div className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Cryptographic Ledger Evidence
            </div>
            <p className="text-slate-300 leading-relaxed">
              {approval.evidence.anomalyDetails || 'Duplicate transaction TX-90412 detected for order ORD-44919 with identical charge within 3 minutes.'}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              Policy Compliance: {approval.evidence.policyMatched || 'DOC-POL-001 (Rule #2: Refunds >= $50 require operator authorization)'}
            </div>
          </div>

          {/* Operator Audit Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Operator Audit Trail Notes (Required)</span>
              <span className="text-[10px] text-slate-500 font-normal">Logged to SOC2 ledger</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Verified duplicate charge anomaly on ledger. Approving immediate reversal to card ending in 4821..."
              value={operatorNotes}
              onChange={e => setOperatorNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Authorized by Uma Nagalla (Operations Lead)</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleDecision('reject')}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors"
            >
              Reject Action
            </button>

            <button
              id="btn-confirm-approve-refund"
              onClick={() => handleDecision('approve')}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Execute Gateway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
