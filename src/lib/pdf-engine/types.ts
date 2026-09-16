export type PdfEngineErrorCode =
  | "INVALID_PDF"
  | "UNSUPPORTED_PDF"
  | "ENCRYPTED_PDF"
  | "CORRUPTED_XREF"
  | "STREAM_DECODE_FAILED"
  | "FONT_DECODE_FAILED"
  | "PAGE_PARSE_FAILED"
  | "NO_TEXT"
  | "UNKNOWN";

  export type PdfWarningCode =
  | "UNSUPPORTED_XREF_STREAM"
  | "UNSUPPORTED_OBJECT_STREAM"
  | "UNSUPPORTED_STREAM_FILTER"
  | "STREAM_LENGTH_FALLBACK"
  | "STREAM_LENGTH_MISMATCH"
  | "MALFORMED_OBJECT"
  | "MALFORMED_XREF_ENTRY"
  | "HYBRID_XREF_NOT_SUPPORTED"
  | "PAGE_TREE_CYCLE"
  | "PAGE_TREE_DEPTH_LIMIT"
  | "MISSING_PAGE_CONTENTS"
  | "MISSING_PAGE_RESOURCES"
  | "MISSING_CATALOG"
  | "MISSING_PAGE_TREE"
  | "MISSING_XREF_ENTRY"
  | "MISSING_FONT"
  | "UNSUPPORTED_FONT"
  | "MISSING_TOUNICODE"
  | "FONT_ENCODING_FALLBACK"
  | "MALFORMED_CMAP"
  | "CONTENT_STREAM_PARSE_FAILED"
  | "UNSUPPORTED_INLINE_IMAGE";

export type PdfQuality =
  | "excellent"
  | "good"
  | "degraded"
  | "poor"
  | "unreadable";

export type PdfBlockType =
  | "paragraph"
  | "heading"
  | "list"
  | "list-item"
  | "header"
  | "footer"
  | "contact"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "languages"
  | "noise"
  | "unknown";

export interface PdfBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfGlyph {
  text: string;

  page: number;

  bbox: PdfBoundingBox;

  font?: string;

  fontSize: number;

  visible: boolean;

  confidence: number;
}

export interface PdfWord {
  text: string;

  page: number;

  bbox: PdfBoundingBox;

  glyphs: PdfGlyph[];

  confidence: number;
}

export interface PdfLine {
  text: string;

  page: number;

  bbox: PdfBoundingBox;

  words: PdfWord[];

  confidence: number;
}

export interface PdfBlock {
  id: string;

  text: string;

  type: PdfBlockType;

  page: number;

  bbox: PdfBoundingBox;

  confidence: number;

  trustScore: number;

  reasons: string[];
}

export interface PdfMetadata {
  version?: string;

  title?: string;

  author?: string;

  subject?: string;

  keywords?: string[];

  creator?: string;

  producer?: string;

  createdAt?: string;

  modifiedAt?: string;

  pageCount: number;

  byteLength: number;
}

export interface PdfWarning {
  code: PdfWarningCode;

  message: string;

  objectNumber?: number;

  page?: number;

  offset?: number;

  details?: Record<string, unknown>;
}

export interface PdfName {
  type: "name";

  value: string;
}

export interface PdfString {
  type: "string";

  bytes: Uint8Array;

  literal: boolean;
}

export interface PdfArray {
  type: "array";

  items: PdfObject[];
}

export interface PdfDictionary {
  type: "dictionary";

  entries: Map<string, PdfObject>;
}

export interface PdfReference {
  type: "reference";

  objectNumber: number;

  generationNumber: number;
}

export interface PdfKeyword {
  type: "keyword";

  value: string;
}

export interface PdfStream {
  type: "stream";

  dictionary: PdfDictionary;

  data: Uint8Array;
}

export type PdfObject =
  | null
  | boolean
  | number
  | PdfName
  | PdfString
  | PdfArray
  | PdfDictionary
  | PdfReference
  | PdfKeyword
  | PdfStream;

export interface PdfIndirectObject {
  objectNumber: number;

  generationNumber: number;

  value: PdfObject;

  offset: number;
}

export type PdfXrefEntryType =
  | "free"
  | "normal";

export interface PdfXrefEntry {
  objectNumber: number;

  generationNumber: number;

  offset: number;

  type: PdfXrefEntryType;

  inUse: boolean;
}

export interface PdfXrefSection {
  offset: number;

  entries: Map<
    number,
    PdfXrefEntry
  >;

  trailer: PdfDictionary;

  previousOffset?: number;
}

export interface PdfTrailerInfo {
  dictionary: PdfDictionary;

  root?: PdfReference;

  info?: PdfReference;

  encrypt?: PdfObject;

  id?: PdfArray;

  size?: number;

  previousOffset?: number;

  xrefStreamOffset?: number;
}

export interface PdfRectangle {
  x1: number;

  y1: number;

  x2: number;

  y2: number;
}

export interface PdfPage {
  pageNumber: number;

  reference: PdfReference;

  dictionary: PdfDictionary;

  contents: Array<
    PdfReference | PdfStream
  >;

  resources?: PdfObject;

  mediaBox?: PdfRectangle;

  cropBox?: PdfRectangle;

  rotate: number;

  /*
   * Se poblarán en fases
   * posteriores.
   */
  glyphs?: PdfGlyph[];

  words?: PdfWord[];

  lines?: PdfLine[];

  blocks?: PdfBlock[];
}

export interface PdfPageTreeResult {
  pages: PdfPage[];

  warnings: PdfWarning[];
}

/*
 * Interfaz final pública.
 *
 * Todavía no la construimos en
 * FASE 1, pero la definimos desde
 * ahora para que todas las fases
 * apunten al mismo resultado.
 */
export interface PdfDocument {
  metadata: PdfMetadata;

  pages: PdfPage[];

  rawText: string;

  cleanText: string;

  aiText: string;

  blocks: PdfBlock[];

  removedBlocks: PdfBlock[];

  quality: PdfQuality;

  confidence: number;

  warnings: PdfWarning[];
}

/*
 * Resultado interno de FASE 1.
 */
export interface PdfParseResult {
  version: string;

  byteLength: number;

  startXref: number;

  xref: Map<
    number,
    PdfXrefEntry
  >;

  trailer: PdfTrailerInfo;

  pages: PdfPage[];

  warnings: PdfWarning[];
}

export type PdfLexerTokenType =
  | "number"
  | "name"
  | "string"
  | "hexString"
  | "keyword"
  | "arrayStart"
  | "arrayEnd"
  | "dictStart"
  | "dictEnd"
  | "eof";

export interface PdfLexerToken {
  type: PdfLexerTokenType;

  value?:
    | string
    | number
    | Uint8Array;

  start: number;

  end: number;
}

export interface PdfObjectParserOptions {
  resolveReference?: (
    reference: PdfReference
  ) => PdfObject | undefined;

  onWarning?: (
    warning: PdfWarning
  ) => void;
}

export interface PdfStreamDecodeOptions {
  resolveReference?: (
    reference: PdfReference
  ) => PdfObject | undefined;

  onWarning?: (
    warning: PdfWarning
  ) => void;
}

export function isPdfName(
  value:
    | PdfObject
    | undefined
): value is PdfName {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type === "name"
  );
}

export function isPdfString(
  value:
    | PdfObject
    | undefined
): value is PdfString {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type === "string"
  );
}

export function isPdfArray(
  value:
    | PdfObject
    | undefined
): value is PdfArray {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type === "array"
  );
}

export function isPdfDictionary(
  value:
    | PdfObject
    | undefined
): value is PdfDictionary {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type ===
      "dictionary"
  );
}

export function isPdfReference(
  value:
    | PdfObject
    | undefined
): value is PdfReference {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type ===
      "reference"
  );
}

export function isPdfStream(
  value:
    | PdfObject
    | undefined
): value is PdfStream {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type === "stream"
  );
}

export function isPdfKeyword(
  value:
    | PdfObject
    | undefined
): value is PdfKeyword {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    value.type ===
      "keyword"
  );
}