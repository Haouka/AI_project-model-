import React, { useState, useCallback } from "react";
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
import { Button } from "./components/ui/Button";
import { Badge } from "./components/ui/Badge";
import { Modal } from "./components/ui/Modal";
import { useAuth } from "./hooks/useAuth";
import { useCases } from "./hooks/useCases";
import { useScreening } from "./hooks/useScreening";
import { useReview } from "./hooks/useReview";
import { ArrowLeft, History, RefreshCw, FileText, Sliders, Eye, Layers } from "lucide-react";

export function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<"dashboard" | "review" | "analytics" | "rules">("dashboard");

  // Mobile Workstation segmented tab view switcher (< lg)
  const [mobileWorkstationTab, setMobileWorkstationTab] = useState<"document" | "fields" | "evidence" | "all">("document");

  // Phase 2 Hooks
  const {
    user,
    isLoginOpen,
    setIsLoginOpen,
    handleSwitchRole,
    handleLogout,
    handleLoginSuccess,
  } = useAuth();

  const {
    cases,
    dashboardStats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    docTypeFilter,
    setDocTypeFilter,
    isSeeding,
    loadCases,
    handleSeedDemo,
  } = useCases(user);

  const {
    activeCaseId,
    activeCaseDetail,
    selectedFieldName,
    setSelectedFieldName,
    isSubmittingReview,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    caseAuditEvents,
    handleSelectCase,
    handleRecordReview,
    handleOpenAudit,
  } = useReview(loadCases);

  const handleCaseSelected = useCallback(async (caseId: string) => {
    const detail = await handleSelectCase(caseId);
    if (detail) {
      setCurrentView("review");
      setMobileWorkstationTab("document");
    }
  }, [handleSelectCase]);

  const {
    isNewScreeningOpen,
    setIsNewScreeningOpen,
    isProcessingOpen,
    processingStep,
    handleStartScreening,
  } = useScreening((newCaseId: string) => {
    handleCaseSelected(newCaseId);
  });

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-ink flex flex-col font-sans selection:bg-coral selection:text-white">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* VIEW 1: DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="space-y-4">
            <DashboardStats
              stats={dashboardStats}
              onFilterClick={(status) => setStatusFilter(status)}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="font-display text-xl font-black text-ink tracking-tight">
                  Recent Screening Cases
                </h2>
                <p className="text-xs font-bold text-ink/70 mt-0.5">
                  Inspection queue sorted by priority and intake time.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={loadCases}
                className="self-start sm:self-auto h-9 px-3.5 text-xs font-black"
              >
                Refresh Queue
              </Button>
            </div>

            <CasesTable
              cases={cases}
              onSelectCase={handleCaseSelected}
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
            {/* Case Header: Clean 2-level structure as specified in Section 4 */}
            <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-neo space-y-2.5">
              {/* Row 1: Left [ Back ] [ CASE ID ] [ DOC TYPE ] | Right [ View Case Audit Trail ] */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentView("dashboard")}
                    aria-label="Back to Dashboard"
                    className="h-8 px-3 text-xs font-black gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Back</span>
                  </Button>
                  <Badge variant="blue" className="h-8 px-2.5 font-mono text-xs font-black flex items-center">
                    {activeCaseDetail.id}
                  </Badge>
                  <Badge variant="lavender" className="h-8 px-2.5 text-xs font-black flex items-center">
                    {activeCaseDetail.document_type}
                  </Badge>
                </div>

                <Button
                  variant="lavender"
                  size="sm"
                  icon={<History className="h-4 w-4 stroke-[2.5]" />}
                  onClick={handleOpenAudit}
                  className="h-8 px-3 text-xs font-black"
                >
                  View Case Audit Trail
                </Button>
              </div>

              {/* Row 2: Title */}
              <div className="pt-0.5">
                <h1 className="font-display text-lg font-black text-ink tracking-tight">
                  {activeCaseDetail.title}
                </h1>
              </div>
            </div>

            {/* Mobile Workstation Segmented View Switcher (< lg) */}
            <div className="lg:hidden flex items-center justify-between p-1.5 rounded-xl border-2 border-ink bg-white shadow-neo-sm overflow-x-auto gap-1">
              <button
                type="button"
                onClick={() => setMobileWorkstationTab("document")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                  mobileWorkstationTab === "document"
                    ? "bg-blue text-ink border-2 border-ink shadow-[1px_1px_0_#171717]"
                    : "text-ink/75 hover:bg-cream"
                }`}
              >
                <Eye className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Document</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileWorkstationTab("fields")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                  mobileWorkstationTab === "fields"
                    ? "bg-orange text-ink border-2 border-ink shadow-[1px_1px_0_#171717]"
                    : "text-ink/75 hover:bg-cream"
                }`}
              >
                <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Fields</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileWorkstationTab("evidence")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                  mobileWorkstationTab === "evidence"
                    ? "bg-coral text-white border-2 border-ink shadow-[1px_1px_0_#171717]"
                    : "text-ink/75 hover:bg-cream"
                }`}
              >
                <Sliders className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Evidence</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileWorkstationTab("all")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                  mobileWorkstationTab === "all"
                    ? "bg-lavender text-ink border-2 border-ink shadow-[1px_1px_0_#171717]"
                    : "text-ink/75 hover:bg-cream"
                }`}
              >
                <Layers className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>All Panels</span>
              </button>
            </div>

            {/* 3-Column Workstation Grid: Document (10fr) | Fields (7fr) | Evidence (7fr) */}
            <div className="grid grid-cols-1 lg:grid-cols-[10fr_7fr_7fr] gap-4 min-h-[620px]">
              {/* Left Column: Document & Forensics Viewer (10fr = ~42% width) */}
              <div
                className={`${
                  mobileWorkstationTab === "document" || mobileWorkstationTab === "all"
                    ? "block"
                    : "hidden"
                } lg:block h-[620px]`}
              >
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

              {/* Center Column: Extracted Document Fields & MRZ (7fr = ~29% width) */}
              <div
                className={`${
                  mobileWorkstationTab === "fields" || mobileWorkstationTab === "all"
                    ? "block"
                    : "hidden"
                } lg:block h-[620px]`}
              >
                <ExtractedFields
                  fields={activeCaseDetail.fields}
                  selectedFieldName={selectedFieldName}
                  onSelectField={setSelectedFieldName}
                />
              </div>

              {/* Right Column: Explainable Evidence & Risk Indicators (7fr = ~29% width) */}
              <div
                className={`${
                  mobileWorkstationTab === "evidence" || mobileWorkstationTab === "all"
                    ? "block"
                    : "hidden"
                } lg:block h-[620px]`}
              >
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

      <Modal
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        maxWidth="2xl"
        showCloseButton={false}
      >
        <AuditTrailView
          caseId={activeCaseId || undefined}
          events={caseAuditEvents}
          onClose={() => setIsAuditDrawerOpen(false)}
        />
      </Modal>

      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={(u) => {
          handleLoginSuccess(u);
          loadCases();
        }}
      />
    </div>
  );
}

export default App;

