import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  MessageSquareText,
  Ticket,
  ShieldAlert,
  Bot,
  BookOpen,
  BarChart3,
  ListOrdered,
  Activity,
  Play,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { ApprovalRequest, SupportSession } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: string) => void;
  onRunDemo: () => void;
  pendingApprovals: ApprovalRequest[];
  sessions: SupportSession[];
  onOpenApproval: (approval: ApprovalRequest) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onRunDemo,
  pendingApprovals,
  sessions,
  onOpenApproval
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { id: 'overview', title: 'Executive Overview Dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'support', title: 'Customer Support Workspace', icon: MessageSquareText, category: 'Navigation' },
    { id: 'tickets', title: 'Enterprise Ticket Catalog', icon: Ticket, category: 'Navigation' },
    { id: 'approvals', title: 'Approval Center (HITL Queue)', icon: ShieldAlert, category: 'Navigation' },
    { id: 'agents', title: 'Multi-Agent Swarm Architecture', icon: Bot, category: 'Navigation' },
    { id: 'knowledge', title: 'Enterprise RAG & Policy Center', icon: BookOpen, category: 'Navigation' },
    { id: 'analytics', title: 'Analytics & KPI Metrics', icon: BarChart3, category: 'Navigation' },
    { id: 'sessions', title: 'Support Sessions History', icon: ListOrdered, category: 'Navigation' },
    { id: 'health', title: 'System Health & Connectors', icon: Activity, category: 'Navigation' }
  ];

  const filteredNav = quickNav.filter(n => n.title.toLowerCase().includes(query.toLowerCase()));
  const filteredApprovals = pendingApprovals.filter(a =>
    a.customerName.toLowerCase().includes(query.toLowerCase()) ||
    a.requestedAction.toLowerCase().includes(query.toLowerCase()) ||
    a.ticketId.toLowerCase().includes(query.toLowerCase())
  );
  const filteredSessions = sessions.filter(s =>
    s.customerName.toLowerCase().includes(query.toLowerCase()) ||
    s.intent.toLowerCase().includes(query.toLowerCase()) ||
    s.ticketId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div
        id="command-palette-dialog"
        className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search tickets, or jump to module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {/* Quick Actions */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">Quick Actions</div>
            <button
              onClick={() => {
                onClose();
                onRunDemo();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-white hover:bg-indigo-600/20 rounded-xl group transition-colors"
            >
              <div className="flex items-center gap-2.5 font-medium">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Run Canonical E2E AI Resolution Demo</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Pending Approvals */}
          {filteredApprovals.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Pending High-Risk Approvals ({filteredApprovals.length})
              </div>
              {filteredApprovals.map(appr => (
                <button
                  key={appr.id}
                  onClick={() => {
                    onClose();
                    onOpenApproval(appr);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-amber-500/10 rounded-xl group transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-white">{appr.customerName}</span> — {appr.requestedAction}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Review
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Navigation Views */}
          {filteredNav.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</div>
              {filteredNav.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onSelectView(item.id);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl group transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                      <span>{item.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Sessions */}
          {filteredSessions.length > 0 && query.length > 1 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Sessions</div>
              {filteredSessions.slice(0, 4).map(s => (
                <button
                  key={s.sessionId}
                  onClick={() => {
                    onClose();
                    onSelectView('support');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl group transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-white">{s.customerName}</span>
                    <span className="text-slate-400 truncate">({s.intent})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{s.ticketId}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="flex items-center gap-1 text-indigo-400">
            <Sparkles className="w-3 h-3" /> Nexus Intelligence Command
          </span>
        </div>
      </div>
    </div>
  );
};
