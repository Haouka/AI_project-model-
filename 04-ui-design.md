# AI-Based Fake Identity & Document Screening System
## UI / UX Design

## 1. Design Principles

The interface should be:

- Fast
- Minimal
- Evidence-first
- Accessible
- Easy to scan
- Clear about uncertainty
- Designed for trained reviewers

Avoid relying on color alone to communicate risk. Use labels, icons, text, and patterns together.

## 2. Main Screens

### Screen 1 — Login

```text
┌──────────────────────────────────────┐
│        ID SCREENING PLATFORM         │
│                                      │
│  Email / Employee ID                 │
│  [____________________________]      │
│                                      │
│  Password                            │
│  [____________________________]      │
│                                      │
│            [ SIGN IN ]               │
│                                      │
│  MFA verification required           │
└──────────────────────────────────────┘
```

## 3. Dashboard

### Layout

```text
┌────────────────────────────────────────────────────┐
│ Logo     Dashboard   Cases   Analytics   Settings │
├────────────────────────────────────────────────────┤
│                                                    │
│  ACTIVE CASES     NEEDS REVIEW     COMPLETED      │
│      18               6                142         │
│                                                    │
├────────────────────────────────────────────────────┤
│ Recent Cases                                       │
│                                                    │
│ Case ID | Type     | Status         | Updated      │
│ 00123   | Passport | Needs Review   | 10:04       │
│ 00122   | Visa     | Processing     | 10:02       │
│ 00121   | ID       | Completed      | 09:58       │
└────────────────────────────────────────────────────┘
```

## 4. New Screening Screen

```text
┌──────────────────────────────────────────┐
│ New Document Screening                   │
├──────────────────────────────────────────┤
│                                          │
│ Document Type                            │
│ [ Passport ▼ ]                           │
│                                          │
│ Upload / Capture                         │
│ ┌──────────────────────────────────────┐ │
│ │       Drag & Drop Document           │ │
│ │             or                       │ │
│ │        [ TAKE PHOTO ]                │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Additional authorized image              │
│ [ Upload / Capture ]                     │
│                                          │
│            [ START ANALYSIS ]             │
└──────────────────────────────────────────┘
```

## 5. Processing Screen

Show progress without exposing internal model complexity:

```text
ANALYZING DOCUMENT

✓ Image quality
✓ Document type
✓ OCR extraction
● Validation
○ Tamper analysis
○ Face verification

Estimated remaining time: ~3 sec
```

If processing fails:

```text
We could not confidently analyze this image.

Reason:
Image quality is too low.

[ Capture Again ]    [ Continue to Manual Review ]
```

## 6. Case Details Screen

This is the most important UI.

### Recommended three-column layout

```text
┌──────────────────────────────────────────────────────────────┐
│ CASE-00123                         STATUS: NEEDS REVIEW      │
├──────────────────────┬──────────────────────┬───────────────┤
│ DOCUMENT             │ EXTRACTED DATA       │ EVIDENCE      │
│                      │                      │               │
│ [Document viewer]    │ Name: Example       │ OCR 96%       │
│                      │ Passport: XXXXXXX    │               │
│ [Zoom] [Rotate]      │ DOB: 01/01/2000     │ MRZ PASS      │
│                      │ Expiry: 01/01/2030  │               │
│                      │                      │ Template !    │
│                      │                      │ Tamper ?      │
├──────────────────────┴──────────────────────┴───────────────┤
│ REVIEW NOTES                                                 │
│ [________________________________________________________]   │
│                                                             │
│ [Request Better Image] [Escalate] [Record Review Outcome]   │
└──────────────────────────────────────────────────────────────┘
```

## 7. Evidence Panel

Each alert should explain:

```text
TEMPLATE CONSISTENCY — REVIEW

What was detected:
The detected layout differs from the expected template.

Confidence:
Medium

Evidence:
[ Highlight Region ]

Recommended reviewer action:
Compare with the current authorized document specification.
```

Avoid statements such as:

> "This document is fake."

Prefer:

> "An anomaly was detected that requires review."

## 8. OCR Field Viewer

When a reviewer clicks a field:

```text
Passport Number
Value: XXXXXXX
OCR Confidence: 99%

Source region:
[highlighted area on document]

Validation:
✓ Format valid
✓ MRZ consistent
```

This provides traceability between the AI result and the original document.

## 9. Tampering View

Use an evidence overlay:

```text
Original Image
      ↓
Analysis Overlay
      ↓
Highlighted Regions
```

Possible tabs:

- Original
- Analysis
- Compression
- Text regions
- Portrait region
- Metadata

Never imply that a heatmap is conclusive proof of manipulation.

## 10. Face Verification View

```text
┌─────────────────────┬─────────────────────┐
│ DOCUMENT PHOTO      │ PRESENTED PHOTO     │
│                     │                     │
│      [IMAGE]        │       [IMAGE]       │
│                     │                     │
└─────────────────────┴─────────────────────┘

Result: SUPPORTING EVIDENCE AVAILABLE

Image quality: Good
Face detected: Yes
Comparison: Within configured review threshold

[View Details]
```

The wording should avoid presenting a biometric match as infallible.

## 11. Case Statuses

Use clear textual statuses:

- PROCESSING
- COMPLETE
- NEEDS REVIEW
- INCONCLUSIVE
- ESCALATED
- CLOSED

Do not use color as the only indicator.

## 12. Analytics Screen

Useful aggregate metrics:

```text
Documents Processed
Average Processing Time
OCR Confidence Distribution
Validation Alert Rate
Tamper Analysis Review Rate
Inconclusive Rate
Reviewer Turnaround Time
```

Analytics should avoid exposing unnecessary personally identifiable information.

## 13. Design System

### Typography

- Inter or another highly readable sans-serif
- Clear hierarchy
- Minimum comfortable body size
- Monospace font for document numbers/MRZ where useful

### Components

- Cards
- Tables
- Status badges
- Tabs
- Evidence drawers
- Image viewer
- Timeline
- Tooltips
- Confirmation dialogs

### Accessibility

- Keyboard navigation
- Screen-reader labels
- Strong focus states
- Text + icon + label for statuses
- Sufficient contrast
- Avoid flashing/rapid animation

## 14. Mobile / Tablet

A tablet-friendly reviewer interface is useful for controlled checkpoints.

On smaller screens:

```text
Case Header
     ↓
Document Viewer
     ↓
Extracted Fields
     ↓
Evidence
     ↓
Review Actions
```

## 15. UX Error Handling

Bad upload:

> "The image is too blurry to analyze reliably. Please capture a clearer image."

OCR uncertainty:

> "Some fields could not be extracted confidently. Review the highlighted fields."

Tamper uncertainty:

> "Analysis is inconclusive. This result should not be treated as proof of alteration."

Database unavailable:

> "Reference verification is temporarily unavailable. Continue according to manual procedure."

## 16. Recommended UI Flow

```text
LOGIN
  ↓
DASHBOARD
  ↓
NEW SCREENING
  ↓
UPLOAD / CAPTURE
  ↓
QUALITY CHECK
  ↓
OCR
  ↓
VALIDATION
  ↓
TAMPER ANALYSIS
  ↓
FACE VERIFICATION
  ↓
EVIDENCE REPORT
  ↓
HUMAN REVIEW
  ↓
REVIEW OUTCOME
  ↓
AUDIT LOG
```
