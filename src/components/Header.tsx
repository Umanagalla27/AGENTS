import React, { useState } from 'react';
import {
  Search,
  Bell,
  ShieldAlert,
  HelpCircle,
  Play,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';
import { ApprovalRequest, SystemMetrics } from '../types';

export interface HeaderProps {
  activeView?: string;
  currentView?: string;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onOpenCommandPalette: () => void;
  pendingApprovalsCount?: number;
  pendingApprovals?: ApprovalRequest[];
  metrics?: SystemMetrics | null;
  onOpenApprovalCenter?: () => void;
  onOpenApprovalModal?: (approval: ApprovalRequest) => void;
  onRunDemo: () => void;
  onSelectView?: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentView,
  onToggleSidebar,
  onOpenCommandPalette,
  pendingApprovalsCount = 0,
  pendingApprovals = [],
  onOpenApprovalCenter,
  onOpenApprovalModal,
  onRunDemo,
  onSelectView
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const view = activeView || currentView || 'overview';
  const approvalCount = pendingApprovalsCount || pendingApprovals.length;

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Executive Operations Overview', subtitle: 'Real-time multi-agent performance, automated workflows, and risk queues' },
    support: { title: 'AI Customer Support Hub', subtitle: 'Live customer conversation workspace with integrated agent trace & CRM profile' },
    tickets: { title: 'Enterprise Ticket Catalog', subtitle: 'Detailed multi-agent execution audit, policy citations, and anomaly diagnostics' },
    approvals: { title: 'Human-in-the-Loop Approval Center', subtitle: 'Review and authorize high-risk agent recommendations with audit compliance' },
    agents: { title: 'AI Multi-Agent Swarm Architecture', subtitle: 'Active orchestration across Triage, CRM, RAG, Investigation, Resolution & Review' },
    knowledge: { title: 'Enterprise RAG Knowledge Center', subtitle: 'Policy guidelines, refund thresholds, and hybrid semantic vector index' },
    analytics: { title: 'Performance Analytics & KPI Metrics', subtitle: 'Real-time automation rates, resolution latencies, and intent distributions' },
    sessions: { title: 'Customer Support Sessions', subtitle: 'Comprehensive history of multi-agent interactions and ticket lifecycle states' },
    health: { title: 'System Infrastructure & MCP Health', subtitle: 'Live connector monitoring across Database, CRM, Billing, and LLM gateways' }
  };

  const currentInfo = viewTitles[view] || { title: 'Enterprise Operations', subtitle: 'Intelligent multi-agent platform' };

  return (
    <header
      id="nexus-header"
      className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-all"
    >
      {/* Left: Mobile Menu Toggle + Breadcrumb / Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Nexus</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="capitalize text-slate-300 font-semibold">{view}</span>
        </div>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <h1 className="text-sm md:text-base font-bold text-white truncate flex items-center gap-2">
          {currentInfo.title}
        </h1>
      </div>

      {/* Right: Global Actions */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search / Command Palette Trigger */}
        <button
          id="btn-global-search"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-all shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Search tickets, policies, customers...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400 font-mono border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Demo Runner */}
        <button
          id="header-btn-demo"
          onClick={onRunDemo}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
          <span>Launch AI Demo</span>
        </button>

        {/* Pending Approvals Quick Alert Button */}
        {approvalCount > 0 && (
          <button
            id="btn-pending-approvals-alert"
            onClick={() => {
              if (onOpenApprovalCenter) onOpenApprovalCenter();
              else if (onSelectView) onSelectView('approvals');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse transition-all"
            title={`${approvalCount} High-Risk Approval Required`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Approvals:</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {approvalCount}
            </span>
          </button>
        )}

        {/* Notifications Button */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="System Audit & Notification Feed"
          >
            <Bell className="w-4 h-4" />
            {approvalCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              id="notifications-dropdown"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Stream</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                  Real-time Feed
                </span>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto my-2">
                {pendingApprovals.map((appr) => (
                  <div key={appr.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> High Risk Approval
                      </span>
                      <span className="text-[10px] text-slate-500">{appr.timeWaiting} ago</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{appr.requestedAction}</p>
                    <p className="text-[11px] text-slate-400 truncate">{appr.customerName} • {appr.reason}</p>
                    {onOpenApprovalModal && (
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          onOpenApprovalModal(appr);
                        }}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-1 flex items-center gap-1"
                      >
                        Review & Authorize <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> RAG Knowledge Sync
                    </span>
                    <span className="text-[10px] text-slate-500">5m ago</span>
                  </div>
                  <p className="text-xs text-slate-300">Hybrid BM25 + Vector embedding index refreshed (4 docs, 88 chunks).</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onOpenApprovalCenter) onOpenApprovalCenter();
                    else if (onSelectView) onSelectView('approvals');
                  }}
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  View Approval Queue
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Documentation / Help Trigger */}
        <button
          id="btn-help-docs"
          onClick={() => setShowHelpModal(true)}
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          title="Architecture Documentation & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Trigger */}
        <div className="relative">
          <button
            id="btn-user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              UN
            </div>
            <span className="text-xs font-semibold hidden md:inline">Uma Nagalla</span>
          </button>

          {/* User Menu */}
          {showUserMenu && (
            <div
              id="user-profile-menu"
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">Uma Nagalla</p>
                <p className="text-[10px] text-slate-400">Operations Lead • Enterprise Admin</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onSelectView) onSelectView('health');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  System Connectors
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowHelpModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Platform Architecture
                </button>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Enterprise Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Architecture & Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">NEXUS AI Architecture Guide</h3>
                  <p className="text-xs text-slate-400">Enterprise Multi-Agent Customer Operations Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-white text-sm mb-1 text-indigo-300">1. Multi-Agent Swarm Pipeline</h4>
                <p>
                  Every customer inquiry passes through a structured 6-stage pipeline:
                  <strong> Triage Agent</strong> (intent & priority) → 
                  <strong> Customer Intelligence</strong> (CRM & LTV context) → 
                  <strong> Knowledge / RAG</strong> (policy retrieval) → 
                  <strong> Investigation</strong> (ledger transaction anomaly detection) → 
                  <strong> Resolution</strong> (action synthesis & risk gate) → 
                  <strong> Review</strong> (compliance & brand guardrails).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1 text-indigo-300">2. Human-in-the-Loop (HITL) Safety Gate</h4>
                <p>
                  Financial transactions (refunds ≥ $50.00, high risk anomalies) automatically pause the agent workflow, queueing an item in the 
                  <strong> Approval Center</strong>. Operations managers review transaction evidence, policy citations, and click 
                  <strong> Approve Refund</strong> to execute the gateway reversal and notify the customer.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1 text-indigo-300">3. Canonical Demo Scenario</h4>
                <p>
                  Click <strong>"Run Canonical Demo"</strong> to simulate Alex Johnson reporting a duplicate $99.99 charge on Order #ORD-44919. 
                  Watch all 6 agents execute in real time, view the duplicate anomaly, and practice approving the refund.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
