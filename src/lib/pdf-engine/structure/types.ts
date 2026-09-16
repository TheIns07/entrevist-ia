export type ResumeSectionKind =
  | "header"
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "projects"
  | "achievements"
  | "interests"
  | "nationality"
  | "additional"
  | "unknown";

export interface DetectedHeading {
  text:
    string;

  lineIndex:
    number;

  confidence:
    number;
}

export interface DocumentStructure {
  lineCount:
    number;

  nonEmptyLineCount:
    number;

  paragraphCount:
    number;

  headingCount:
    number;

  headings:
    DetectedHeading[];

  hasEmail:
    boolean;

  hasPhone:
    boolean;

  hasDates:
    boolean;

  hasBullets:
    boolean;

  confidence:
    number;
}

export interface ResumeSection {
  kind:
    ResumeSectionKind;

  heading?:
    string;

  text:
    string;

  startLine:
    number;

  endLine:
    number;

  confidence:
    number;
}

export interface ResumeDetectionResult {
  isResume:
    boolean;

  confidence:
    number;

  sections:
    ResumeSection[];

  recognizedSectionCount:
    number;
}