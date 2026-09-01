import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Bot,
  ShieldCheck,
  Zap,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { SystemMetrics } from '../types';

interface AnalyticsDashboardViewProps {
  metrics: SystemMetrics | null;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  metrics
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('7d');

  const defaultRequestsOverTime = [
    { time: '00:00', requests: 120, automated: 112, escalated: 8 },
    { time: '04:00', requests: 95, automated: 90, escalated: 5 },
    { time: '08:00', requests: 430, automated: 395, escalated: 35 },
    { time: '12:00', requests: 680, automated: 625, escalated: 55 },
    { time: '16:00', requests: 740, automated: 680, escalated: 60 },
    { time: '20:00', requests: 416, automated: 382, escalated: 34 }
  ];

  const defaultTopIntents = [
    { intent: 'Duplicate Charge', count: 890, percentage: 35.8 },
    { intent: 'Refund Request', count: 640, percentage: 25.8 },
    { intent: 'Subscription Upgrade', count: 420, percentage: 16.9 },
    { intent: 'API Rate Limits', count: 310, percentage: 12.5 },
    { intent: 'Account Security', count: 221, percentage: 8.9 }
  ];

  const defaultLatencies = [
    { agent: 'Triage', avgLatencyMs: 180 },
    { agent: 'CRM Intel', avgLatencyMs: 220 },
    { agent: 'RAG Policy', avgLatencyMs: 310 },
    { agent: 'Investigation', avgLatencyMs: 290 },
    { agent: 'Resolution', avgLatencyMs: 340 },
    { agent: 'Review QA', avgLatencyMs: 190 }
  ];

  const chartData = metrics?.requestsOverTime || defaultRequestsOverTime;
  const intentsData = metrics?.topIntents || defaultTopIntents;
  const latencyData = metrics?.latencyDistribution || defaultLatencies;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Executive Analytics & KPIs
          </h2>
          <p className="text-xs text-slate-400">
            Real-time throughput metrics, automated resolution ratios, and multi-agent latency profiles
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {(['today', '7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">AI Automation Rate</div>
          <div className="text-2xl font-extrabold text-white">91.4%</div>
          <div className="text-[10px] text-emerald-400 font-semibold">+3.1% this week</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">SLA Adherence Compliance</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">99.8%</div>
          <div className="text-[10px] text-slate-500">Target &gt; 99.0%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Mean Resolution Time</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono">18.4s</div>
          <div className="text-[10px] text-emerald-400 font-semibold">-4.2s improvement</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Manual Escalation Rate</div>
          <div className="text-2xl font-extrabold text-white font-mono">1.4%</div>
          <div className="text-[10px] text-slate-500">35 of 2,481 cases</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume & Automation Trend (Area Chart) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Support Volume & Automation Trend
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Hourly Telemetry</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAutomated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="requests" name="Total Inquiries" stroke="#6366f1" fillOpacity={1} fill="url(#colorRequests)" />
                <Area type="monotone" dataKey="automated" name="AI Autonomous Resolutions" stroke="#10b981" fillOpacity={1} fill="url(#colorAutomated)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Agent Latency Profile (Bar Chart) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Multi-Agent Latency Distribution (ms)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Gemini 2.5 Flash</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="agent" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="avgLatencyMs" name="Avg Latency (ms)" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Intent Breakdown & Resolution Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Top Inquiries by Category</h3>
          <div className="space-y-3">
            {intentsData.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="font-semibold text-white">{item.intent}</span>
                  <span className="font-mono text-indigo-300">{item.count} cases ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Outcome Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Resolution Outcome Breakdown</h3>
          <div className="grid grid-cols-3 gap-3 text-center my-auto">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="text-2xl font-extrabold text-emerald-400">91.4%</div>
              <div className="text-xs font-bold text-white">AI Automated</div>
              <div className="text-[10px] text-slate-400">Zero human intervention</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="text-2xl font-extrabold text-amber-400">7.2%</div>
              <div className="text-xs font-bold text-white">HITL Approved</div>
              <div className="text-[10px] text-slate-400">Operator sign-off</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <div className="text-2xl font-extrabold text-rose-400">1.4%</div>
              <div className="text-xs font-bold text-white">Escalated</div>
              <div className="text-[10px] text-slate-400">Dispute team</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Total operations throughput verified under SOC2 Type II compliance audit criteria.
          </p>
        </div>
      </div>
    </div>
  );
};
