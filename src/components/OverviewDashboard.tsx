import React from 'react';
import {
  Users,
  Bot,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { SystemMetrics, ApprovalRequest, SupportSession } from '../types';

interface OverviewDashboardProps {
  metrics: SystemMetrics | null;
  pendingApprovals: ApprovalRequest[];
  sessions: SupportSession[];
  onOpenApproval: (approval: ApprovalRequest) => void;
  onSelectView: (view: string) => void;
  onRunDemo: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  pendingApprovals,
  sessions,
  onOpenApproval,
  onSelectView,
  onRunDemo
}) => {
  const kpis = [
    {
      id: 'kpi-requests',
      title: 'Total Requests Handled',
      value: metrics ? metrics.totalRequests.toLocaleString() : '2,481',
      change: '+12.4% vs last week',
      trend: 'up',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'kpi-automation',
      title: 'AI Automation Rate',
      value: metrics ? `${metrics.aiAutomationRatePercent}%` : '91.4%',
      change: '+3.1% automated triage',
      trend: 'up',
      icon: Bot,
      color: 'from-indigo-600 to-purple-600',
      badgeColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'kpi-latency',
      title: 'Average Resolution Time',
      value: metrics ? `${metrics.averageResolutionTimeSec}s` : '18.4s',
      change: '-4.2s faster SLA',
      trend: 'up',
      icon: Clock,
      color: 'from-cyan-600 to-teal-600',
      badgeColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'kpi-approvals',
      title: 'Pending Human Approvals',
      value: pendingApprovals.length.toString(),
      change: pendingApprovals.length > 0 ? 'Requires Operator Decision' : 'All Clear',
      trend: pendingApprovals.length > 0 ? 'warning' : 'neutral',
      icon: ShieldAlert,
      color: 'from-amber-600 to-orange-600',
      badgeColor: pendingApprovals.length > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-slate-400 bg-slate-800'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Canonical E2E Runner Callout */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Multi-Agent Swarm in Active Production</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Nexus AI Intelligent Customer Operations Platform
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Autonomous resolution with policy-grounded RAG, real-time ledger anomaly verification, and strict Human-in-the-Loop oversight for financial reversals.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              id="btn-overview-run-demo"
              onClick={onRunDemo}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Run Canonical Demo (Duplicate $99.99)</span>
            </button>
            <button
              onClick={() => onSelectView('support')}
              className="hidden sm:flex px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold items-center gap-2 transition-colors"
            >
              <span>Live Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg flex flex-col justify-between group hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{kpi.value}</div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${kpi.badgeColor} flex items-center gap-1`}>
                  {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {kpi.trend === 'warning' && <AlertTriangle className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Pending Approvals & Swarm Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Risk Approvals Queue & Live Customer Cases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals Widget */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pending Human-in-the-Loop Approvals</h3>
                  <p className="text-[11px] text-slate-400">High-risk financial reversions requiring operator sign-off</p>
                </div>
              </div>
              <button
                onClick={() => onSelectView('approvals')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                View Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-75" />
                <p className="text-xs text-slate-300 font-medium">All financial actions authorized. Queue clear.</p>
                <button
                  onClick={onRunDemo}
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  Generate sample high-risk duplicate charge ticket →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {pendingApprovals.map(appr => (
                  <div key={appr.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{appr.customerName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                          HIGH RISK
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{appr.ticketId}</span>
                      </div>
                      <p className="text-xs text-indigo-300 font-medium">{appr.requestedAction}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{appr.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onOpenApproval(appr)}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                      >
                        Review & Decide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Support Sessions Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Active & Recent Support Cases</h3>
                  <p className="text-[11px] text-slate-400">Live multi-agent customer engagements</p>
                </div>
              </div>
              <button
                onClick={() => onSelectView('sessions')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                All Sessions <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Customer</th>
                    <th className="pb-2.5 font-semibold">Intent</th>
                    <th className="pb-2.5 font-semibold">Priority</th>
                    <th className="pb-2.5 font-semibold">Risk</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessions.slice(0, 4).map(s => (
                    <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-semibold text-white">
                        <div>{s.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{s.customerTier}</div>
                      </td>
                      <td className="py-2.5 text-slate-300 font-medium">{s.intent}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.priority === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : s.priority === 'MEDIUM'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.risk === 'HIGH'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {s.risk}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            s.status === 'resolved'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : s.status === 'waiting_approval'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-blue-500/15 text-blue-300'
                          }`}
                        >
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onSelectView('support')}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Multi-Agent Swarm Telemetry & Top Intent Breakdown */}
        <div className="space-y-6">
          {/* Swarm Live Telemetry */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Agent Swarm Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                6 Active Nodes
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Triage Agent</span>
                </div>
                <span className="text-slate-400 font-mono">180ms • 99.4%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Customer Intel (CRM)</span>
                </div>
                <span className="text-slate-400 font-mono">220ms • 99.8%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">RAG Knowledge Agent</span>
                </div>
                <span className="text-slate-400 font-mono">310ms • 98.9%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Investigation Agent</span>
                </div>
                <span className="text-slate-400 font-mono">290ms • 99.1%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Resolution Agent</span>
                </div>
                <span className="text-slate-400 font-mono">340ms • 98.7%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">Review & QA Agent</span>
                </div>
                <span className="text-slate-400 font-mono">190ms • 99.6%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onSelectView('agents')}
                className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs text-center border border-indigo-500/30 transition-colors"
              >
                Inspect Swarm Graph Architecture
              </button>
            </div>
          </div>

          {/* Top Intents */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white">Top Customer Inquiries</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Duplicate Charge & Billing</span>
                  <span className="font-bold text-white">35.8%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Refund / Payment Reversal</span>
                  <span className="font-bold text-white">25.8%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '25.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Subscription Tier Upgrade</span>
                  <span className="font-bold text-white">16.9%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '16.9%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>API Key & Rate Limits</span>
                  <span className="font-bold text-white">12.5%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12.5%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
