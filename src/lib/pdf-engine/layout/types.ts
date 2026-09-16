import type {
    PdfBoundingBox,
    PdfGlyph,
  } from "../types";
  
  export interface LayoutWord {
    text: string;
  
    page: number;
  
    bbox: PdfBoundingBox;
  
    font: string;
  
    fontSize: number;
  
    confidence: number;
  
    glyphs: PdfGlyph[];
  
    sourceOrder: number;
  }
  
  export interface LayoutLine {
    text: string;
  
    page: number;
  
    bbox: PdfBoundingBox;
  
    fontSize: number;
  
    confidence: number;
  
    words: LayoutWord[];
  
    sourceOrder: number;
  }
  
  export type LayoutBlockKind =
    | "text"
    | "heading";
  
  export interface LayoutBlock {
    text: string;
  
    page: number;
  
    bbox: PdfBoundingBox;
  
    fontSize: number;
  
    confidence: number;
  
    lines: LayoutLine[];
  
    kind: LayoutBlockKind;
  
    sourceOrder: number;
  
    columnIndex?: number;
  }
  
  export interface LayoutColumn {
    index: number;
  
    bbox: PdfBoundingBox;
  
    blocks: LayoutBlock[];
  }
  
  export interface ColumnDetectionResult {
    columns: LayoutColumn[];
  
    spanningBlocks: LayoutBlock[];
  
    blocks: LayoutBlock[];
  
    columnCount: number;
  }
  
  export interface PageLayoutResult {
    words: LayoutWord[];
  
    lines: LayoutLine[];
  
    blocks: LayoutBlock[];
  
    columns: LayoutColumn[];
  
    orderedBlocks: LayoutBlock[];
  
    text: string;
  
    columnCount: number;
  }