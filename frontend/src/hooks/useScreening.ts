import { useState, useCallback } from "react";
import { api } from "../api/client";

export function useScreening(onScreeningComplete?: (caseId: string) => void) {
  const [isNewScreeningOpen, setIsNewScreeningOpen] = useState(false);
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const handleStartScreening = useCallback(
    async (docType: string, docFile: File, liveFile?: File | null, title?: string) => {
      setIsNewScreeningOpen(false);
      setIsProcessingOpen(true);
      setProcessingStep(0);

      try {
        // 1. Create Case record
        const { case_id } = await api.createCase(title || `${docType} Screening`, docType);

        // Step 1: Upload and alignment
        setProcessingStep(1);
        await api.uploadDocuments(case_id, docFile, liveFile);

        // Step 2: OCR
        setProcessingStep(2);
        await new Promise((r) => setTimeout(r, 600));

        // Step 3: Rules
        setProcessingStep(3);
        await new Promise((r) => setTimeout(r, 600));

        // Step 4: Tampering forensics
        setProcessingStep(4);
        await new Promise((r) => setTimeout(r, 600));

        // Step 5: Biometric face verification
        setProcessingStep(5);
        await new Promise((r) => setTimeout(r, 600));

        // Step 6: Evidence aggregation & priority calculation
        setProcessingStep(6);
        await api.processCase(case_id);

        await new Promise((r) => setTimeout(r, 400));
        setIsProcessingOpen(false);

        if (onScreeningComplete) {
          onScreeningComplete(case_id);
        }
      } catch (err) {
        console.error("Screening process failed", err);
        setIsProcessingOpen(false);
        alert("Screening failed: " + err);
      }
    },
    [onScreeningComplete]
  );

  return {
    isNewScreeningOpen,
    setIsNewScreeningOpen,
    isProcessingOpen,
    setIsProcessingOpen,
    processingStep,
    handleStartScreening,
  };
}
