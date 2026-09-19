import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardStats } from "./components/DashboardStats";
import { CasesTable } from "./components/CasesTable";
import { DocumentViewer } from "./components/DocumentViewer";
import { ExtractedFields } from "./components/ExtractedFields";
import { EvidencePanel } from "./components/EvidencePanel";
import { ReviewActions } from "./components/ReviewActions";
import { NewScreeningModal } from "./components/NewScreeningModal";
import { ProcessingModal } from "./components/ProcessingModal";
import { AuditTrailView } from "./components/AuditTrailView";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { RulesCatalog } from "./components/RulesCatalog";
import { LoginModal } from "./components/LoginModal";
import { CaseDetail, CaseListItem, User, UserRole, AuditEventItem } from "./types";
import { api } from "./api/client";
import { ArrowLeft, History, RefreshCw } from "lucide-react";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Navigation
  const [currentView, setCurrentView] = useState<"dashboard" | "review" | "analytics" | "rules">("dashboard");

  // Dashboard state
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    active_cases: 0,
    needs_review: 0,
    completed: 0,
    high_priority: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // Active Case Review State
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCaseDetail, setActiveCaseDetail] = useState<CaseDetail | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Modals & Drawers
  const [isNewScreeningOpen, setIsNewScreeningOpen] = useState(false);
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [caseAuditEvents, setCaseAuditEvents] = useState<AuditEventItem[]>([]);

  // Initialize session
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          api.setToken(null);
          setIsLoginOpen(true);
        });
    } else {
      // Auto login as Reviewer Diaz for demo convenience
      api.login("reviewer", "Review@123")
        .then((res) => setUser(res.user))
        .catch(() => setIsLoginOpen(true));
    }
  }, []);

  // Fetch Cases list
  const loadCases = async () => {
    try {
      const data = await api.listCases({
        status: statusFilter,
        document_type: docTypeFilter,
        search: searchTerm,
      });
      setCases(data.items);
      setDashboardStats({
        total: data.total,
        active_cases: data.active_cases,
        needs_review: data.needs_review,
        completed: data.completed,
        high_priority: data.high_priority,
      });
    } catch (e) {
      console.error("Failed to load cases", e);
    }
  };

  useEffect(() => {
    if (user) {
      loadCases();
    }
  }, [user, searchTerm, statusFilter, docTypeFilter]);

  // Open Case Review
  const handleSelectCase = async (caseId: string) => {
    try {
      const detail = await api.getCase(caseId);
      setActiveCaseId(caseId);
      setActiveCaseDetail(detail);
      setSelectedFieldName(null);
      setCurrentView("review");
    } catch (e) {
      console.error("Failed to fetch case detail", e);
    }
  };

  // Seed Demo Cases
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoCases();
      await loadCases();
    } catch (e) {
      console.error("Failed to seed demo cases", e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Switch Role
  const handleSwitchRole = (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  // Logout
  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setIsLoginOpen(true);
  };

  // Start New Screening with simulated interactive step animation
  const handleStartScreening = async (
    docType: string,
    docFile: File,
    liveFile?: File | null,
    title?: string
  ) => {
    setIsNewScreeningOpen(false);
    setIsProcessingOpen(true);
    setProcessingStep(0);

    try {
      // 1. Create Case
      const { case_id } = await api.createCase(title || `${docType} Screening`, docType);

      // Step progress animation
      setProcessingStep(1); // Document classification
      await api.uploadDocuments(case_id, docFile, liveFile);

      setProcessingStep(2); // OCR
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(3); // Rules
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(4); // Tamper
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(5); // Face
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(6); // Evidence aggregation
      await api.processCase(case_id);

      await new Promise((r) => setTimeout(r, 400));
      setIsProcessingOpen(false);

      // Open case in review
      handleSelectCase(case_id);
    } catch (err) {
      console.error("Screening process failed", err);
      setIsProcessingOpen(false);
      alert("Screening failed: " + err);
    }
  };

  // Submit Review Decision
  const handleRecordReview = async (action: string, notes: string, reason?: string) => {
    if (!activeCaseId) return;
    setIsSubmittingReview(true);
    try {
      await api.recordReview(activeCaseId, action, notes, reason);
      const updated = await api.getCase(activeCaseId);
      setActiveCaseDetail(updated);
      await loadCases();
    } catch (e) {
      console.error("Review submission failed", e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Open Case Audit Drawer
  const handleOpenAudit = async () => {
    if (!activeCaseId) return;
    try {
      const res = await api.getAuditTrail(activeCaseId);
      setCaseAuditEvents(res.events);
      setIsAuditDrawerOpen(true);
    } catch (e) {
      console.error("Failed to load audit trail", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNewScreening={() => setIsNewScreeningOpen(true)}
        onSeedDemo={handleSeedDemo}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        isSeeding={isSeeding}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            <DashboardStats
              stats={dashboardStats}
              onFilterClick={(status) => setStatusFilter(status)}
            />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Screening Cases</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspection queue sorted by priority and intake time.
                </p>
              </div>
              <button
                onClick={loadCases}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Queue</span>
              </button>
            </div>

            <CasesTable
              cases={cases}
              onSelectCase={handleSelectCase}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              docTypeFilter={docTypeFilter}
              setDocTypeFilter={setDocTypeFilter}
              onRefresh={loadCases}
            />
          </div>
        )}

        {/* VIEW 2: 3-COLUMN CASE REVIEW WORKSPACE */}
        {currentView === "review" && activeCaseDetail && (
          <div className="space-y-4">
            {/* Review Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{activeCaseDetail.id}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                      {activeCaseDetail.document_type}
                    </span>
                  </div>
                  <h1 className="text-base font-bold text-white">{activeCaseDetail.title}</h1>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleOpenAudit}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-sm"
                >
                  <History className="h-4 w-4 text-blue-400" />
                  <span>View Case Audit Trail</span>
                </button>
              </div>
            </div>

            {/* 3-Column Workstation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
              {/* Left Column: Document & Forensics Viewer (5 cols) */}
              <div className="lg:col-span-5 h-[620px]">
                <DocumentViewer
                  documentUrl={activeCaseDetail.document_url}
                  livePhotoUrl={activeCaseDetail.live_photo_url}
                  fields={activeCaseDetail.fields}
                  tamperResults={activeCaseDetail.tamper_results}
                  faceResult={activeCaseDetail.face_result}
                  selectedFieldName={selectedFieldName}
                  onSelectField={setSelectedFieldName}
                />
              </div>

              {/* Center Column: Extracted Document Fields & MRZ (3.5 cols) */}
              <div className="lg:col-span-3.5 h-[620px]">
                <ExtractedFields
                  fields={activeCaseDetail.fields}
                  selectedFieldName={selectedFieldName}
                  onSelectField={setSelectedFieldName}
                />
              </div>

              {/* Right Column: Explainable Evidence & Risk Indicators (3.5 cols) */}
              <div className="lg:col-span-3.5 h-[620px]">
                <EvidencePanel
                  priority={activeCaseDetail.review_priority}
                  overallConfidence={activeCaseDetail.overall_confidence}
                  validationResults={activeCaseDetail.validation_results}
                  tamperResults={activeCaseDetail.tamper_results}
                  faceResult={activeCaseDetail.face_result}
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            <ReviewActions
              caseId={activeCaseDetail.id}
              onRecordReview={handleRecordReview}
              isSubmitting={isSubmittingReview}
            />
          </div>
        )}

        {/* VIEW 3: ANALYTICS DASHBOARD */}
        {currentView === "analytics" && <AnalyticsDashboard />}

        {/* VIEW 4: RULES CATALOG */}
        {currentView === "rules" && <RulesCatalog />}
      </main>

      {/* Modals */}
      <NewScreeningModal
        isOpen={isNewScreeningOpen}
        onClose={() => setIsNewScreeningOpen(false)}
        onStartScreening={handleStartScreening}
      />

      <ProcessingModal
        isOpen={isProcessingOpen}
        step={processingStep}
      />

      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <AuditTrailView
              caseId={activeCaseId || undefined}
              events={caseAuditEvents}
              onClose={() => setIsAuditDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={(u) => {
          setUser(u);
          setIsLoginOpen(false);
          loadCases();
        }}
      />
    </div>
  );
}

export default App;
