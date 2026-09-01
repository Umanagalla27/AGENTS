import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquareText,
  Ticket as TicketIcon,
  ShieldAlert,
  Bot,
  BookOpen,
  BarChart3,
  ListOrdered,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

export interface SidebarProps {
  activeView?: string;
  currentView?: string;
  onSelectView: (view: string) => void;
  pendingApprovalsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRunDemo?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentView,
  onSelectView,
  pendingApprovalsCount = 0,
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
  onRunDemo
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed || internalCollapsed;
  const view = activeView || currentView || 'overview';

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse();
    else setInternalCollapsed(!internalCollapsed);
  };

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, badge: null },
    { id: 'support', label: 'Customer Support', icon: MessageSquareText, badge: 'Live' },
    { id: 'tickets', label: 'Ticket Catalog', icon: TicketIcon, badge: null },
    {
      id: 'approvals',
      label: 'Approval Center',
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    { id: 'agents', label: 'AI Multi-Agent Swarm', icon: Bot, badge: '6 Active' },
    { id: 'knowledge', label: 'Enterprise RAG', icon: BookOpen, badge: null },
    { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3, badge: null },
    { id: 'sessions', label: 'Session History', icon: ListOrdered, badge: null },
    { id: 'health', label: 'System Health', icon: Activity, badge: '99.9%' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="nexus-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white text-base">NEXUS</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Enterprise Operations</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto hidden lg:block">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            id="btn-collapse-sidebar"
            onClick={handleToggle}
            className="hidden lg:block text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close toggle */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Interactive Demo Action Button */}
        {onRunDemo && (
          <div className="p-3">
            <button
              id="btn-run-canonical-demo"
              onClick={onRunDemo}
              className={`w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/25 border border-indigo-400/30 flex items-center ${
                isCollapsed ? 'lg:justify-center lg:p-3 p-2.5 gap-2.5' : 'px-3.5 py-2.5 gap-2.5'
              }`}
              title="Run Canonical E2E AI Resolution Demo"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse flex-shrink-0" />
              {(!isCollapsed || isOpen) && (
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">Run Canonical Demo</div>
                  <div className="text-[10px] text-indigo-200 truncate font-normal">Duplicate $99.99 E2E flow</div>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div
            className={`px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
              isCollapsed ? 'lg:text-center' : ''
            }`}
          >
            {isCollapsed ? '•••' : 'Platform Modules'}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectView(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center rounded-xl transition-all group ${
                  isCollapsed ? 'lg:justify-center lg:p-3 px-3.5 py-2.5 gap-3' : 'px-3.5 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/40 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {(!isCollapsed || isOpen) && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Swarm Live Status & User Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          {!isCollapsed || isOpen ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-medium text-emerald-300">Swarm Online</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">6 Agents</span>
              </div>

              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-600 flex items-center justify-center font-bold text-xs text-white border border-slate-600">
                  UN
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">Uma Nagalla</div>
                  <div className="text-[10px] text-slate-400 truncate">Lead AI Operations</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Swarm Active" />
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200">
                UN
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
