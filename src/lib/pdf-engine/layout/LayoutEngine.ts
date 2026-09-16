import type {
  PdfGlyph,
} from "../types";

import {
  BlockBuilder,
} from "./BlockBuilder";

import {
  ColumnDetector,
} from "./ColumnDetector";

import {
  LineBuilder,
} from "./LineBuilder";

import {
  ReadingOrderResolver,
} from "./ReadingOrderResolver";

import type {
  PageLayoutResult,
} from "./types";

import {
  WordBuilder,
} from "./WordBuilder";

export class LayoutEngine {
  private readonly wordBuilder =
    new WordBuilder();

  private readonly lineBuilder =
    new LineBuilder();

  private readonly blockBuilder =
    new BlockBuilder();

  private readonly columnDetector =
    new ColumnDetector();

  private readonly readingOrderResolver =
    new ReadingOrderResolver();

  buildPage(
    glyphs:
      PdfGlyph[]
  ): PageLayoutResult {
    const words =
      this.wordBuilder.build(
        glyphs
      );

    const lines =
      this.lineBuilder.build(
        words
      );

    const blocks =
      this.blockBuilder.build(
        lines
      );

    const columnDetection =
      this.columnDetector.detect(
        blocks
      );

    const readingOrder =
      this.readingOrderResolver.resolve(
        columnDetection,
        lines
      );

    console.log(
      "[PDF Engine] Layout reading mode:",
      readingOrder.mode
    );

    return {
      words,

      lines,

      blocks:
        columnDetection.blocks,

      columns:
        columnDetection.columns,

      orderedBlocks:
        readingOrder.blocks,

      text:
        readingOrder.text,

      columnCount:
        columnDetection.columnCount,
    };
  }
}