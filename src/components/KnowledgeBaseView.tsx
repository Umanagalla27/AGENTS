import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  Sparkles,
  CheckCircle2,
  Tag,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { KnowledgeDocument, PolicyCitation } from '../types';

interface KnowledgeBaseViewProps {
  documents: KnowledgeDocument[];
  onViewCitation?: (citation: PolicyCitation) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  documents
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [semanticTestQuery, setSemanticTestQuery] = useState('duplicate charge refund limit threshold');
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[] | null>(null);

  const defaultDocs: KnowledgeDocument[] = [
    {
      id: 'DOC-POL-001',
      title: 'Billing & Payment Dispute Procedure',
      documentType: 'Policy Guideline',
      lastUpdated: '2026-08-15',
      chunksCount: 18,
      retrievalStatus: 'indexed',
      relevanceScore: 0.97,
      contentPreview: 'Covers duplicate charge handling, automatic reversal criteria, customer credit options, and mandatory manager approval for refunds over $50.00.',
      tags: ['billing', 'refunds', 'duplicate-charge', 'disputes'],
      keyRules: [
        'Duplicate transactions occurring within 10 minutes for the same Order ID qualify for immediate automated refund proposal.',
        'Refunds equal to or exceeding $50.00 require human-in-the-loop approval before gateway execution.',
        'VIP/Gold accounts are prioritized with zero-wait automated investigation.'
      ]
    },
    {
      id: 'DOC-POL-002',
      title: 'Customer Service SLA & Escalation Protocol v2.1',
      documentType: 'SLA Standard',
      lastUpdated: '2026-08-01',
      chunksCount: 24,
      retrievalStatus: 'indexed',
      relevanceScore: 0.91,
      contentPreview: 'Enterprise response time targets: Gold Tier < 5 minutes, Silver Tier < 30 minutes. Auto-triage and risk classification rules.',
      tags: ['sla', 'priority', 'escalation', 'gold-tier'],
      keyRules: [
        'High-risk tickets must be classified and assigned an executive reviewer within 2 minutes.',
        'Customer sentiment tracking triggers automated supervisor alerts if Frustrated or Critical.'
      ]
    },
    {
      id: 'DOC-POL-003',
      title: 'Payment Gateway Failure & Reconciliation Guide',
      documentType: 'Technical Runbook',
      lastUpdated: '2026-07-28',
      chunksCount: 14,
      retrievalStatus: 'indexed',
      relevanceScore: 0.88,
      contentPreview: 'Step-by-step verification of idempotency keys, webhook retries, Stripe/Adyen transaction status reconciliation.',
      tags: ['gateway', 'technical', 'reconciliation', 'idempotency'],
      keyRules: [
        'Inspect gateway transaction trace for duplicate idempotency key collisions.',
        'Verify refund ledger state before issuing secondary reimbursement.'
      ]
    },
    {
      id: 'DOC-POL-004',
      title: 'Account Security & PII Protection Guidelines',
      documentType: 'Compliance & Safety',
      lastUpdated: '2026-08-10',
      chunksCount: 32,
      retrievalStatus: 'indexed',
      relevanceScore: 0.85,
      contentPreview: 'Ensures no raw credit card numbers, passwords, or personal credentials are exposed in customer conversation or agent logs.',
      tags: ['security', 'pii', 'compliance', 'gdpr'],
      keyRules: [
        'Redact full PANs to last 4 digits.',
        'Sanitize internal model reasoning chains before external communication dispatch.'
      ]
    }
  ];

  const docList = documents.length > 0 ? documents : defaultDocs;

  const allTags = ['all', ...Array.from(new Set(docList.flatMap(d => d.tags)))];

  const filteredDocs = docList.filter(d => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contentPreview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || d.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleTestSearch = () => {
    const q = semanticTestQuery.toLowerCase();
    const ranked = [...docList].sort((a, b) => {
      const aScore = a.tags.some(t => q.includes(t)) || a.title.toLowerCase().includes(q) ? 0.97 : 0.82;
      const bScore = b.tags.some(t => q.includes(t)) || b.title.toLowerCase().includes(q) ? 0.97 : 0.82;
      return bScore - aScore;
    });
    setSearchResults(ranked);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Enterprise RAG Knowledge Center
          </h2>
          <p className="text-xs text-slate-400">
            Policy standards, financial thresholds, and hybrid semantic retrieval grounding all AI responses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hybrid BM25 + Vector Search</span>
          </span>
        </div>
      </div>

      {/* RAG Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Indexed Documents</div>
          <div className="text-2xl font-extrabold text-white">{docList.length}</div>
          <div className="text-[10px] text-emerald-400">100% Vectorized</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Total Chunks</div>
          <div className="text-2xl font-extrabold text-indigo-400">
            {docList.reduce((acc, d) => acc + d.chunksCount, 0)}
          </div>
          <div className="text-[10px] text-slate-500">512 token chunking</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Embedding Model</div>
          <div className="text-sm font-bold text-white font-mono mt-1">text-embedding-004</div>
          <div className="text-[10px] text-indigo-300">768 dimensions</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="text-xs font-medium text-slate-400">Average Retrieval Latency</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">310ms</div>
          <div className="text-[10px] text-slate-500">BM25 + Dense RRF</div>
        </div>
      </div>

      {/* Semantic Search Interactive Sandbox */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Semantic Retrieval Testing Sandbox
          </h3>
          <span className="text-[10px] font-mono text-indigo-300">Test Vector Matches</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Test query (e.g. duplicate refund policy limit, gold tier SLA)..."
              value={semanticTestQuery}
              onChange={e => setSemanticTestQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleTestSearch}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Run Hybrid Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Documents Catalog */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-xl text-xs capitalize transition-colors font-medium ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(searchResults || filteredDocs).map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3.5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {doc.id}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {(doc.relevanceScore * 100).toFixed(0)}% Relevance
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{doc.contentPreview}</p>

                {/* Key Rules Checklist */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Governance Rules:
                  </div>
                  {doc.keyRules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <span className="capitalize">{doc.tags.join(', ')}</span>
                </div>
                <span>{doc.chunksCount} chunks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
