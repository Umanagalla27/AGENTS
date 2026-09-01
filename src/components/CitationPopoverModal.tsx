import React from 'react';
import { PolicyCitation } from '../types';
import { X, BookOpen, FileText, CheckCircle2, Shield } from 'lucide-react';

interface CitationPopoverModalProps {
  citation: PolicyCitation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CitationPopoverModal: React.FC<CitationPopoverModalProps> = ({
  citation,
  isOpen,
  onClose
}) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">RAG Policy Citation</h3>
              <p className="text-[11px] text-slate-400 font-mono">{citation.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Title</div>
            <div className="text-sm font-bold text-white mt-0.5">{citation.title}</div>
            <div className="text-[11px] text-indigo-300 font-mono mt-0.5">{citation.section}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <span>Grounded Policy Excerpt</span>
              <span className="font-mono">{(citation.relevance * 100).toFixed(0)}% Vector Match</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-serif italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              "{citation.excerpt}"
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Strict compliance check verified by Nexus Review Agent before final dispatch.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
