import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CustomerSupportView } from './components/CustomerSupportView';
import { TicketCatalogView } from './components/TicketCatalogView';
import { ApprovalsCenterView } from './components/ApprovalsCenterView';
import { AgentsArchitectureView } from './components/AgentsArchitectureView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { SessionsHistoryView } from './components/SessionsHistoryView';
import { SystemHealthView } from './components/SystemHealthView';
import { CommandPalette } from './components/CommandPalette';
import { ApprovalReviewModal } from './components/ApprovalReviewModal';
import { CitationPopoverModal } from './components/CitationPopoverModal';
import {
  Ticket,
  SupportSession,
  ApprovalRequest,
  SystemMetrics,
  AgentService,
  KnowledgeDocument,
  PolicyCitation
} from './types';
import {
  fetchMetrics,
  fetchTickets,
  fetchTicketById,
  fetchSessions,
  fetchPendingApprovals,
  submitApprovalDecision,
  sendSupportMessage,
  fetchAgents,
  fetchKnowledgeBase,
  runCanonicalDemo
} from './services/api';

export function App() {
  const [activeView, setActiveView] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Core Platform Data State
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [agents, setAgents] = useState<AgentService[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);

  // Modals state
  const [selectedApprovalForModal, setSelectedApprovalForModal] = useState<ApprovalRequest | null>(null);
  const [selectedCitationForModal, setSelectedCitationForModal] = useState<PolicyCitation | null>(null);

  // Loading States
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Initial Data Fetching & Polling
  const loadPlatformData = async () => {
    try {
      const [
        metricsData,
        ticketsData,
        sessionsData,
        approvalsData,
        agentsData,
        docsData
      ] = await Promise.all([
        fetchMetrics(),
        fetchTickets(),
        fetchSessions(),
        fetchPendingApprovals(),
        fetchAgents(),
        fetchKnowledgeBase()
      ]);

      setMetrics(metricsData);
      setTickets(ticketsData);
      setSessions(sessionsData);
      setPendingApprovals(approvalsData);
      setAgents(agentsData);
      setKnowledgeDocs(docsData);

      // Default active ticket to Alex Johnson case
      if (ticketsData.length > 0 && !currentTicket) {
        setCurrentTicket(ticketsData[0]);
      }
    } catch (err) {
      console.warn('Error loading platform state:', err);
    }
  };

  useEffect(() => {
    loadPlatformData();
    const interval = setInterval(loadPlatformData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleSelectSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.sessionId === sessionId);
      if (session) {
        const ticket = await fetchTicketById(session.ticketId);
        setCurrentTicket(ticket);
        setActiveView('support');
      }
    } catch (err) {
      console.error('Failed to select session:', err);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoadingMessage) return;
    setIsLoadingMessage(true);
    try {
      const result = await sendSupportMessage(
        currentTicket?.sessionId || 'SES-001-ALEX',
        currentTicket?.id || 'TKT-8F42A1C9',
        messageText
      );
      if (result.ticket) {
        setCurrentTicket(result.ticket);
      }
      await loadPlatformData();
    } catch (err) {
      console.error('Message failed:', err);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleSubmitApprovalDecision = async (
    ticketId: string,
    action: 'approve' | 'reject',
    notes: string
  ) => {
    try {
      const result = await submitApprovalDecision(ticketId, action, notes);
      if (result.ticket) {
        setCurrentTicket(result.ticket);
      }
      await loadPlatformData();
    } catch (err) {
      console.error('Approval submission failed:', err);
    }
  };

  const handleRunCanonicalDemo = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    try {
      const result = await runCanonicalDemo();
      if (result.ticket) {
        setCurrentTicket(result.ticket);
      }
      await loadPlatformData();
      setActiveView('support');
    } catch (err) {
      console.error('Demo run failed:', err);
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
        pendingApprovalsCount={pendingApprovals.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Global Enterprise Header */}
        <Header
          activeView={activeView}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onRunDemo={handleRunCanonicalDemo}
          pendingApprovalsCount={pendingApprovals.length}
          metrics={metrics}
          onOpenApprovalCenter={() => setActiveView('approvals')}
        />

        {/* View Router Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {activeView === 'overview' && (
            <OverviewDashboard
              metrics={metrics}
              pendingApprovals={pendingApprovals}
              sessions={sessions}
              onOpenApproval={(appr) => setSelectedApprovalForModal(appr)}
              onSelectView={setActiveView}
              onRunDemo={handleRunCanonicalDemo}
            />
          )}

          {activeView === 'support' && (
            <CustomerSupportView
              currentTicket={currentTicket}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessage || isDemoRunning}
              onOpenApproval={(appr) => setSelectedApprovalForModal(appr)}
              onViewCitation={(cit) => setSelectedCitationForModal(cit)}
              onRunDemo={handleRunCanonicalDemo}
            />
          )}

          {activeView === 'tickets' && (
            <TicketCatalogView
              currentTicket={currentTicket}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onOpenApproval={(appr) => setSelectedApprovalForModal(appr)}
              onViewCitation={(cit) => setSelectedCitationForModal(cit)}
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalsCenterView
              pendingApprovals={pendingApprovals}
              onSubmitDecision={handleSubmitApprovalDecision}
              isLoading={isLoadingMessage}
              onRunDemo={handleRunCanonicalDemo}
            />
          )}

          {activeView === 'agents' && (
            <AgentsArchitectureView agents={agents} />
          )}

          {activeView === 'knowledge' && (
            <KnowledgeBaseView
              documents={knowledgeDocs}
              onViewCitation={(cit) => setSelectedCitationForModal(cit)}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsDashboardView metrics={metrics} />
          )}

          {activeView === 'sessions' && (
            <SessionsHistoryView
              sessions={sessions}
              currentTicket={currentTicket}
              onSelectSession={handleSelectSession}
              onOpenApproval={(appr) => setSelectedApprovalForModal(appr)}
              onViewCitation={(cit) => setSelectedCitationForModal(cit)}
            />
          )}

          {activeView === 'health' && <SystemHealthView />}
        </main>
      </div>

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(v) => {
          setActiveView(v);
          setIsCommandPaletteOpen(false);
        }}
        onRunDemo={handleRunCanonicalDemo}
        pendingApprovals={pendingApprovals}
        sessions={sessions}
        onOpenApproval={(appr) => {
          setSelectedApprovalForModal(appr);
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* Global Approval Review Modal */}
      <ApprovalReviewModal
        approval={selectedApprovalForModal}
        isOpen={Boolean(selectedApprovalForModal)}
        onClose={() => setSelectedApprovalForModal(null)}
        onSubmitDecision={handleSubmitApprovalDecision}
        isLoading={isLoadingMessage}
      />

      {/* Grounded Policy Citation Popover Modal */}
      <CitationPopoverModal
        citation={selectedCitationForModal}
        isOpen={Boolean(selectedCitationForModal)}
        onClose={() => setSelectedCitationForModal(null)}
      />
    </div>
  );
}

export default App;
