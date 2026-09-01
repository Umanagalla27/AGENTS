import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  CreditCard,
  Lock,
  Cpu,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

export const SystemHealthView: React.FC = () => {
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState('Just now');

  const connectors = [
    {
      id: 'conn-gemini',
      name: 'Gemini 2.5 Flash Model Gateway',
      type: 'AI Inference Engine',
      status: 'operational',
      latency: '180ms',
      uptime: '99.99%',
      icon: Cpu
    },
    {
      id: 'conn-rag',
      name: 'Hybrid Vector + BM25 RAG Store',
      type: 'Vector Database',
      status: 'operational',
      latency: '24ms',
      uptime: '99.98%',
      icon: Database
    },
    {
      id: 'conn-billing',
      name: 'Billing & Ledger Connector (MCP)',
      type: 'Financial Gateway',
      status: 'operational',
      latency: '45ms',
      uptime: '99.95%',
      icon: CreditCard
    },
    {
      id: 'conn-crm',
      name: 'Enterprise CRM Sync Connector',
      type: 'Customer Data Platform',
      status: 'operational',
      latency: '62ms',
      uptime: '99.99%',
      icon: Server
    },
    {
      id: 'conn-guardrails',
      name: 'Security & PII Sanitizer Shield',
      type: 'Compliance Firewall',
      status: 'operational',
      latency: '12ms',
      uptime: '100.0%',
      icon: Shield
    },
    {
      id: 'conn-webhook',
      name: 'Omnichannel Ingress Webhooks',
      type: 'Event Bus',
      status: 'operational',
      latency: '18ms',
      uptime: '99.99%',
      icon: Globe
    }
  ];

  const handlePingAll = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setLastCheckTime('Just now');
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> System Health & MCP Connectors
          </h2>
          <p className="text-xs text-slate-400">
            Real-time status of multi-agent runtimes, database connections, and security guardrails
          </p>
        </div>

        <button
          onClick={handlePingAll}
          disabled={isPinging}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isPinging ? 'animate-spin' : ''}`} />
          <span>Ping All Connectors</span>
        </button>
      </div>

      {/* Hero Health Status Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">All Systems Operational</h3>
            <p className="text-xs text-slate-400">Zero service disruptions detected across all 6 agent clusters</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">Global Uptime:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">99.98%</span>
          </div>
          <div>
            <span className="text-slate-400">Last Verified:</span>{' '}
            <span className="font-semibold text-slate-200">{lastCheckTime}</span>
          </div>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map(conn => {
          const Icon = conn.icon;
          return (
            <div
              key={conn.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{conn.name}</h4>
                    <p className="text-[11px] text-slate-400">{conn.type}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Status</div>
                  <div className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Latency</div>
                  <div className="font-bold text-white font-mono">{conn.latency}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Uptime</div>
                  <div className="font-bold text-indigo-300 font-mono">{conn.uptime}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Compliance Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" /> Enterprise Governance & Guardrails
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PII Masking & Redaction
            </div>
            <p className="text-slate-400 text-[11px]">
              Credit cards (PANs), SSNs, and private credentials are automatically masked before prompt construction.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Prompt Injection Firewall
            </div>
            <p className="text-slate-400 text-[11px]">
              Inbound customer inputs are scanned against adversarial jailbreaks before reaching downstream agents.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SOC2 Type II Audit Logging
            </div>
            <p className="text-slate-400 text-[11px]">
              Immutable cryptographic audit logs recorded for every tool invocation and human operator decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
