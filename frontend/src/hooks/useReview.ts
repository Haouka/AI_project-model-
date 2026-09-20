import { useState, useCallback } from "react";
import { CaseDetail, AuditEventItem } from "../types";
import { api } from "../api/client";

export function useReview(onReviewSubmitted?: () => void) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCaseDetail, setActiveCaseDetail] = useState<CaseDetail | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Audit trail drawer state
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [caseAuditEvents, setCaseAuditEvents] = useState<AuditEventItem[]>([]);

  const handleSelectCase = useCallback(async (caseId: string) => {
    try {
      const detail = await api.getCase(caseId);
      setActiveCaseId(caseId);
      setActiveCaseDetail(detail);
      setSelectedFieldName(null);
      return detail;
    } catch (e) {
      console.error("Failed to fetch case detail", e);
      return null;
    }
  }, []);

  const handleRecordReview = useCallback(
    async (action: string, notes: string, reason?: string) => {
      if (!activeCaseId) return;
      setIsSubmittingReview(true);
      try {
        await api.recordReview(activeCaseId, action, notes, reason);
        const updated = await api.getCase(activeCaseId);
        setActiveCaseDetail(updated);
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
      } catch (e) {
        console.error("Review submission failed", e);
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [activeCaseId, onReviewSubmitted]
  );

  const handleOpenAudit = useCallback(async () => {
    if (!activeCaseId) return;
    try {
      const res = await api.getAuditTrail(activeCaseId);
      setCaseAuditEvents(res.events);
      setIsAuditDrawerOpen(true);
    } catch (e) {
      console.error("Failed to load audit trail", e);
    }
  }, [activeCaseId]);

  return {
    activeCaseId,
    setActiveCaseId,
    activeCaseDetail,
    setActiveCaseDetail,
    selectedFieldName,
    setSelectedFieldName,
    isSubmittingReview,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    caseAuditEvents,
    handleSelectCase,
    handleRecordReview,
    handleOpenAudit,
  };
}
