import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  Eye,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { Ticket, SupportSession, ApprovalRequest, PolicyCitation } from '../types';
import { TicketDetailModal } from './TicketDetailModal';

interface TicketCatalogViewProps {
  currentTicket: Ticket | null;
  sessions: SupportSession[];
  onSelectSession: (sessionId: string) => void;
  onOpenApproval: (approval: ApprovalRequest) => void;
  onViewCitation: (citation: PolicyCitation) => void;
}

export const TicketCatalogView: React.FC<TicketCatalogViewProps> = ({
  currentTicket,
  sessions,
  onSelectSession,
  onOpenApproval,
  onViewCitation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch =
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || s.risk === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-400" /> Enterprise Ticket Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Multi-agent triage classifications, anomaly evidence, and compliance audit records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            {filteredSessions.length} Total Tickets Listed
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticket ID, customer name, or issue intent..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="waiting_approval">Waiting Approval</option>
              <option value="resolved">Resolved</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Risk:</span>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Risks</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Ticket ID</th>
                <th className="p-3.5 font-semibold">Customer</th>
                <th className="p-3.5 font-semibold">Intent / Issue</th>
                <th className="p-3.5 font-semibold">Priority</th>
                <th className="p-3.5 font-semibold">Risk Level</th>
                <th className="p-3.5 font-semibold">Lifecycle Status</th>
                <th className="p-3.5 font-semibold">Created</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.map(s => (
                <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-300">{s.ticketId}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{s.customerName}</div>
                    <div className="text-[10px] text-slate-500">{s.customerEmail}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-200">{s.intent}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : s.priority === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.risk === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {s.risk}
                    </span>
                  </td>
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
                      title="Inspect full execution trace"
                    >
                      <Eye className="w-3.5 h-3.5" /> Deep Audit
                    </button>
                    <button
                      onClick={() => onSelectSession(s.sessionId)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-indigo-500/30"
                      title="Open in Customer Support Workspace"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Ticket Inspector Modal */}
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
