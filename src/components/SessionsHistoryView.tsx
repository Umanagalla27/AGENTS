import React, { useState } from 'react';
import {
  ListOrdered,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react';
import { SupportSession, Ticket, ApprovalRequest, PolicyCitation } from '../types';
import { TicketDetailModal } from './TicketDetailModal';

interface SessionsHistoryViewProps {
  sessions: SupportSession[];
  currentTicket: Ticket | null;
  onSelectSession: (sessionId: string) => void;
  onOpenApproval: (approval: ApprovalRequest) => void;
  onViewCitation: (citation: PolicyCitation) => void;
}

export const SessionsHistoryView: React.FC<SessionsHistoryViewProps> = ({
  sessions,
  currentTicket,
  onSelectSession,
  onOpenApproval,
  onViewCitation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-indigo-400" /> Support Sessions History
          </h2>
          <p className="text-xs text-slate-400">
            End-to-end conversation logs, agent interaction traces, and SLA adherence records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            {filteredSessions.length} Total Sessions
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by session ID, customer, or intent..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sessions</option>
            <option value="resolved">Resolved</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Session ID</th>
                <th className="p-3.5 font-semibold">Customer</th>
                <th className="p-3.5 font-semibold">Associated Ticket</th>
                <th className="p-3.5 font-semibold">Intent</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Duration / Date</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.map(s => (
                <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-indigo-300 font-bold">{s.sessionId}</td>
                  <td className="p-3.5 font-semibold text-white">
                    <div>{s.customerName}</div>
                    <div className="text-[10px] text-indigo-300 font-normal">{s.customerTier}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">{s.ticketId}</td>
                  <td className="p-3.5 font-medium text-slate-200">{s.intent}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        s.status === 'resolved'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : s.status === 'waiting_approval'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px] font-mono">{s.createdAt}</td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        if (currentTicket && currentTicket.id === s.ticketId) {
                          setSelectedTicketForModal(currentTicket);
                        } else {
                          onSelectSession(s.sessionId);
                          setTimeout(() => setSelectedTicketForModal(currentTicket), 200);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                    <button
                      onClick={() => onSelectSession(s.sessionId)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-indigo-500/30"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Open Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketDetailModal
        ticket={selectedTicketForModal || currentTicket}
        isOpen={Boolean(selectedTicketForModal)}
        onClose={() => setSelectedTicketForModal(null)}
        onOpenApproval={onOpenApproval}
        onViewCitation={onViewCitation}
      />
    </div>
  );
};
