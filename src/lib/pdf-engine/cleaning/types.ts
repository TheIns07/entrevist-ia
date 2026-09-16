export type RemovedTextReason =
  | "header"
  | "footer"
  | "duplicate"
  | "noise";

export interface CleaningLine {
  text: string;

  lineNumber: number;
}

export interface RemovedTextFragment {
  page: number;

  lineNumber: number;

  text: string;

  reason: RemovedTextReason;
}

export interface CleanPageResult {
  pageNumber: number;

  originalText: string;

  cleanText: string;

  removed:
    RemovedTextFragment[];
}

export interface DocumentCleaningResult {
  cleanText: string;

  pages:
    CleanPageResult[];

  removed:
    RemovedTextFragment[];
}

export interface HeaderFooterDetectionResult {
  headers:
    Set<string>;

  footers:
    Set<string>;
}