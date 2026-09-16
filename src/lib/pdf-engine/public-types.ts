import type {
    RemovedTextFragment,
  } from "./cleaning/types";
  
  import type {
    DocumentQuality,
  } from "./quality/types";
  
  import type {
    DocumentStructure,
    ResumeDetectionResult,
  } from "./structure/types";
  
  export type PdfExtractionStage =
    | "starting"
    | "parsing"
    | "pages-found"
    | "page-start"
    | "text-extracted"
    | "layout-complete"
    | "page-complete"
    | "cleaning"
    | "analyzing"
    | "complete";
  
  export interface PdfExtractionProgress {
    stage:
      PdfExtractionStage;
  
    message:
      string;
  
    progress:
      number;
  
    page?:
      number;
  
    totalPages?:
      number;
  
    partialText?:
      string;
  }
  
  export type PdfExtractionProgressCallback =
    (
      progress:
        PdfExtractionProgress
    ) => void;
  
  export interface PdfSourceMetadata {
    fileName:
      string;
  
    fileSize:
      number;
  
    mimeType:
      string;
  
    lastModified?:
      number;
  }
  
  export interface PdfBoundingBoxResult {
    x:
      number;
  
    y:
      number;
  
    width:
      number;
  
    height:
      number;
  }
  
  export type PdfExtractedBlockKind =
    | "heading"
    | "text";
  
  export interface PdfExtractedBlock {
    id:
      string;
  
    page:
      number;
  
    text:
      string;
  
    kind:
      PdfExtractedBlockKind;
  
    bbox:
      PdfBoundingBoxResult;
  
    confidence:
      number;
  
    trustScore:
      number;
  
    reasons:
      string[];
  
    sourceOrder:
      number;
  
    columnIndex?:
      number;
  }
  
  export interface PdfRemovedBlock {
    id:
      string;
  
    page:
      number;
  
    text:
      string;
  
    reason:
      string;
  
    lineNumber:
      number;
  }
  
  export interface PdfExtractedPage {
    pageNumber:
      number;
  
    rawText:
      string;
  
    layoutText:
      string;
  
    cleanText:
      string;
  
    width?:
      number;
  
    height?:
      number;
  
    rotation:
      number;
  
    glyphCount:
      number;
  
    wordCount:
      number;
  
    lineCount:
      number;
  
    blockCount:
      number;
  
    columnCount:
      number;
  
    blocks:
      PdfExtractedBlock[];
  }
  
  export interface PdfExtractionWarning {
    code:
      string;
  
    message:
      string;
  
    page?:
      number;
  
    objectNumber?:
      number;
  }
  
  export interface PdfDocumentMetadata
    extends PdfSourceMetadata {
    pdfVersion:
      string;
  
    pageCount:
      number;
  
    processedAt:
      string;
  
    processingTimeMs:
      number;
  
    possibleScanned:
      boolean;
  }
  
  export interface PdfDocumentResult {
    /*
     * Compatibilidad práctica con
     * la UI actual.
     */
    fileName:
      string;
  
    fileSize:
      number;
  
    pageCount:
      number;
  
    metadata:
      PdfDocumentMetadata;
  
    /*
     * Las tres representaciones
     * principales del documento.
     */
    rawText:
      string;
  
    layoutText:
      string;
  
    cleanText:
      string;
  
    aiText:
      string;
  
    /*
     * Versiones por página.
     */
    pageTexts:
      string[];
  
    pageLayoutTexts:
      string[];
  
    pageCleanTexts:
      string[];
  
    pages:
      PdfExtractedPage[];
  
    blocks:
      PdfExtractedBlock[];
  
    removedBlocks:
      PdfRemovedBlock[];
  
    /*
     * Lo conservamos también con su
     * nombre anterior para debugging
     * y compatibilidad.
     */
    removedFragments:
      RemovedTextFragment[];
  
    structure:
      DocumentStructure;
  
    resume:
      ResumeDetectionResult;
  
    quality:
      DocumentQuality;
  
    confidence:
      number;
  
    warnings:
      PdfExtractionWarning[];
  }
  
  /*
   * =========================================================
   * WORKER PROTOCOL
   * =========================================================
   */
  
  export interface PdfWorkerExtractRequest {
    type:
      "extract";
  
    buffer:
      ArrayBuffer;
  
    source:
      PdfSourceMetadata;
  }
  
  export interface PdfWorkerProgressResponse {
    type:
      "progress";
  
    progress:
      PdfExtractionProgress;
  }
  
  export interface PdfWorkerResultResponse {
    type:
      "result";
  
    result:
      PdfDocumentResult;
  }
  
  export interface PdfWorkerErrorResponse {
    type:
      "error";
  
    error: {
      code:
        string;
  
      message:
        string;
    };
  }
  
  export type PdfWorkerResponse =
    | PdfWorkerProgressResponse
    | PdfWorkerResultResponse
    | PdfWorkerErrorResponse;