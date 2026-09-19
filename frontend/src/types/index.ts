export type UserRole = "ADMIN" | "SUPERVISOR" | "REVIEWER" | "ANALYST";

export type CaseStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "NEEDS_REVIEW"
  | "INCONCLUSIVE"
  | "ESCALATED"
  | "CLOSED";

export type ReviewPriority =
  | "LOW_CONCERN"
  | "NEEDS_REVIEW"
  | "HIGH_PRIORITY_REVIEW";

export type DocumentType =
  | "PASSPORT"
  | "VISA"
  | "NATIONAL_ID"
  | "DRIVING_LICENSE"
  | "PERMIT";

export type RuleSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

export type ValidationStatus = "PASS" | "FAIL" | "WARNING";

export type TamperStatus =
  | "NO_CLEAR_ANOMALY"
  | "POSSIBLE_ANOMALY"
  | "INCONCLUSIVE"
  | "REQUIRES_REVIEW";

export type FaceOutcome =
  | "SUPPORTING_MATCH"
  | "POTENTIAL_MISMATCH"
  | "INCONCLUSIVE"
  | "NOT_PERFORMED";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  bbox?: [number, number, number, number] | null; // [x, y, w, h] normalized 0..1
  is_mrz: boolean;
  validation_status: string;
}

export interface ValidationResultItem {
  rule_id: string;
  rule_name: string;
  category: string;
  status: ValidationStatus;
  severity: RuleSeverity;
  explanation: string;
  evidence?: Record<string, any>;
}

export interface TamperResultItem {
  anomaly_type: string;
  status: TamperStatus;
  score: number;
  heatmap_path?: string | null;
  explanation: string;
  evidence_regions?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    anomaly_score?: number;
  }>;
}

export interface FaceResultItem {
  document_face_detected: boolean;
  live_face_detected: boolean;
  similarity_score: number;
  quality_score: number;
  outcome: FaceOutcome;
  explanation: string;
  doc_portrait_url?: string | null;
  live_photo_url?: string | null;
  uncertainty_disclaimer?: string;
}

export interface ReviewActionItem {
  id: number;
  action: string;
  reason?: string | null;
  notes?: string | null;
  reviewer: string;
  created_at: string;
}

export interface CaseDetail {
  id: string;
  title: string;
  document_type: DocumentType;
  status: CaseStatus;
  review_priority: ReviewPriority;
  overall_confidence: number;
  applicant_name?: string | null;
  document_number?: string | null;
  nationality?: string | null;
  reviewer_outcome?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
  document_url?: string | null;
  live_photo_url?: string | null;
  fields: ExtractedField[];
  validation_results: ValidationResultItem[];
  tamper_results: TamperResultItem[];
  face_result?: FaceResultItem | null;
  review_actions: ReviewActionItem[];
}

export interface CaseListItem {
  id: string;
  title: string;
  document_type: DocumentType;
  status: CaseStatus;
  review_priority: ReviewPriority;
  overall_confidence: number;
  applicant_name: string;
  document_number: string;
  nationality: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEventItem {
  id: number;
  case_id?: string | null;
  action: string;
  status: string;
  user: string;
  details: Record<string, any>;
  timestamp: string;
  ip_address?: string;
}

export interface DemoPreset {
  id: string;
  title: string;
  document_type: string;
  applicant: string;
  document_number: string;
  expected_outcome: string;
  description: string;
  document_file: string;
  live_file?: string | null;
}
