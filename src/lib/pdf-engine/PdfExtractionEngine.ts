import {
    DocumentIntelligenceEngine,
  } from "./ai/DocumentIntelligenceEngine";
  
  import {
    DocumentCleaner,
  } from "./cleaning/DocumentCleaner";
  
  import {
    GlyphExtractor,
  } from "./content/GlyphExtractor";
  
  import {
    LayoutEngine,
  } from "./layout/LayoutEngine";
  
  import type {
    LayoutBlock,
    PageLayoutResult,
  } from "./layout/types";
  
  import {
    PdfParser,
  } from "./parser/PdfParser";
  
  import type {
    PdfWarning,
  } from "./types";
  
  import type {
    PdfDocumentResult,
    PdfExtractedBlock,
    PdfExtractedPage,
    PdfExtractionProgress,
    PdfExtractionProgressCallback,
    PdfExtractionWarning,
    PdfRemovedBlock,
    PdfSourceMetadata,
  } from "./public-types";
  
  interface ExtractedPageIntermediate {
    pageNumber:
      number;
  
    rawText:
      string;
  
    layout:
      PageLayoutResult;
  
    rotation:
      number;
  
    width?:
      number;
  
    height?:
      number;
  
    glyphCount:
      number;
  }
  
  export async function extractPdfFromBuffer(
    buffer:
      ArrayBuffer,
  
    source:
      PdfSourceMetadata,
  
    onProgress?:
      PdfExtractionProgressCallback
  ): Promise<PdfDocumentResult> {
    const startedAt =
      performance.now();
  
    emitProgress(
      onProgress,
      {
        stage:
          "starting",
  
        message:
          "Inicializando motor PDF...",
  
        progress:
          5,
      }
    );
  
    /*
     * =====================================================
     * FASE 1
     * PARSER
     * =====================================================
     */
  
    emitProgress(
      onProgress,
      {
        stage:
          "parsing",
  
        message:
          "Analizando estructura PDF...",
  
        progress:
          10,
      }
    );
  
    const parser =
      new PdfParser(
        buffer
      );
  
    const parsed =
      parser.parse();
  
    const coreWarnings:
      PdfWarning[] = [
        ...parsed.warnings,
      ];
  
    const totalPages =
      parsed.pages.length;
  
    emitProgress(
      onProgress,
      {
        stage:
          "pages-found",
  
        message:
          `${totalPages} página(s) encontrada(s).`,
  
        progress:
          20,
  
        totalPages,
      }
    );
  
    /*
     * =====================================================
     * FASE 2 + 3
     * GLYPHS + LAYOUT
     * =====================================================
     */
  
    const glyphExtractor =
      new GlyphExtractor(
        parser
      );
  
    const layoutEngine =
      new LayoutEngine();
  
    const extractedPages:
      ExtractedPageIntermediate[] =
        [];
  
    const pageTexts:
      string[] = [];
  
    const pageLayoutTexts:
      string[] = [];
  
    let totalGlyphs =
      0;
  
    for (
      let index = 0;
      index <
      totalPages;
      index += 1
    ) {
      const page =
        parsed.pages[
          index
        ];
  
      const pageNumber =
        index + 1;
  
      emitProgress(
        onProgress,
        {
          stage:
            "page-start",
  
          message:
            `Procesando página ${pageNumber} de ${totalPages}...`,
  
          progress:
            calculatePageProgress(
              index,
              totalPages
            ),
  
          page:
            pageNumber,
  
          totalPages,
        }
      );
  
      const extraction =
        await glyphExtractor.extractPage(
          page
        );
  
      coreWarnings.push(
        ...extraction.warnings
      );
  
      totalGlyphs +=
        extraction.glyphs.length;
  
      pageTexts.push(
        extraction.rawText
      );
  
      emitProgress(
        onProgress,
        {
          stage:
            "text-extracted",
  
          message:
            `Página ${pageNumber}: ${extraction.glyphs.length} glifos recuperados.`,
  
          progress:
            calculatePageProgress(
              index +
                0.35,
              totalPages
            ),
  
          page:
            pageNumber,
  
          totalPages,
        }
      );
  
      const layout =
        layoutEngine.buildPage(
          extraction.glyphs
        );
  
      pageLayoutTexts.push(
        layout.text
      );
  
      const dimensions =
        getPageDimensions(
          page.mediaBox
        );
  
      extractedPages.push({
        pageNumber,
  
        rawText:
          extraction.rawText,
  
        layout,
  
        rotation:
          page.rotate ??
          0,
  
        width:
          dimensions.width,
  
        height:
          dimensions.height,
  
        glyphCount:
          extraction.glyphs.length,
      });
  
      emitProgress(
        onProgress,
        {
          stage:
            "layout-complete",
  
          message:
            `Página ${pageNumber}: ${layout.blocks.length} bloque(s), ${layout.columnCount} columna(s).`,
  
          progress:
            calculatePageProgress(
              index +
                0.8,
              totalPages
            ),
  
          page:
            pageNumber,
  
          totalPages,
  
          partialText:
            layout.text,
        }
      );
  
      emitProgress(
        onProgress,
        {
          stage:
            "page-complete",
  
          message:
            `Página ${pageNumber} procesada.`,
  
          progress:
            calculatePageProgress(
              index + 1,
              totalPages
            ),
  
          page:
            pageNumber,
  
          totalPages,
  
          partialText:
            layout.text,
        }
      );
    }
  
    const rawText =
      joinPages(
        pageTexts
      );
  
    const layoutText =
      joinPages(
        pageLayoutTexts
      );
  
    /*
     * =====================================================
     * FASE 4
     * CLEANING
     * =====================================================
     */
  
    emitProgress(
      onProgress,
      {
        stage:
          "cleaning",
  
        message:
          "Limpiando y normalizando el documento...",
  
        progress:
          94,
  
        totalPages,
      }
    );
  
    const cleaner =
      new DocumentCleaner();
  
    const cleaning =
      cleaner.clean(
        pageLayoutTexts
      );
  
    const cleanText =
      cleaning.cleanText;
  
    const pageCleanTexts =
      cleaning.pages.map(
        (
          page
        ) =>
          page.cleanText
      );
  
    /*
     * =====================================================
     * FASE 5
     * INTELIGENCIA DOCUMENTAL
     * =====================================================
     */
  
    emitProgress(
      onProgress,
      {
        stage:
          "analyzing",
  
        message:
          "Analizando estructura y preparando contenido para IA...",
  
        progress:
          97,
  
        totalPages,
      }
    );
  
    const intelligenceEngine =
      new DocumentIntelligenceEngine();
  
    const intelligence =
      intelligenceEngine.analyze({
        cleanText,
  
        warnings:
          coreWarnings,
      });
  
    const meaningfulCharacters =
      cleanText.replace(
        /\s/g,
        ""
      ).length;
  
    const possibleScanned =
      totalPages >
        0 &&
      (
        totalGlyphs <
          Math.max(
            12,
            totalPages *
              8
          ) ||
        meaningfulCharacters <
          Math.max(
            30,
            totalPages *
              20
          )
      );
  
    /*
     * Un documento sin texto real no
     * debe generar contenido artificial
     * para la IA.
     */
    const aiText =
      meaningfulCharacters >
        0
        ? intelligence.aiText
        : "";
  
    const pages =
      buildPublicPages(
        extractedPages,
        pageCleanTexts
      );
  
    const blocks =
      pages.flatMap(
        (
          page
        ) =>
          page.blocks
      );
  
    const removedBlocks =
      cleaning.removed.map(
        (
          fragment,
          index
        ): PdfRemovedBlock => ({
          id:
            `p${fragment.page}-removed-${index + 1}`,
  
          page:
            fragment.page,
  
          text:
            fragment.text,
  
          reason:
            fragment.reason,
  
          lineNumber:
            fragment.lineNumber,
        })
      );
  
    const warnings =
      coreWarnings.map(
        toPublicWarning
      );
  
    if (
      possibleScanned
    ) {
      warnings.push({
        code:
          "POSSIBLE_SCANNED_PDF",
  
        message:
          "El documento contiene muy poco texto extraíble. Puede tratarse de un PDF escaneado o compuesto principalmente por imágenes.",
      });
    }
  
    const processingTimeMs =
      performance.now() -
      startedAt;
  
    const result:
      PdfDocumentResult = {
        fileName:
          source.fileName,
  
        fileSize:
          source.fileSize,
  
        pageCount:
          totalPages,
  
        metadata: {
          ...source,
  
          pdfVersion:
            parsed.version,
  
          pageCount:
            totalPages,
  
          processedAt:
            new Date()
              .toISOString(),
  
          processingTimeMs,
  
          possibleScanned,
        },
  
        rawText,
  
        layoutText,
  
        cleanText,
  
        aiText,
  
        pageTexts,
  
        pageLayoutTexts,
  
        pageCleanTexts,
  
        pages,
  
        blocks,
  
        removedBlocks,
  
        removedFragments:
          cleaning.removed,
  
        structure:
          intelligence.structure,
  
        resume:
          intelligence.resume,
  
        quality:
          intelligence.quality,
  
        confidence:
          intelligence.confidence,
  
        warnings,
      };
  
    emitProgress(
      onProgress,
      {
        stage:
          "complete",
  
        message:
          `Extracción terminada. Confianza ${Math.round(
            result.confidence *
              100
          )}%.`,
  
        progress:
          100,
  
        totalPages,
  
        partialText:
          aiText,
      }
    );
  
    return result;
  }
  
  function buildPublicPages(
    pages:
      ExtractedPageIntermediate[],
  
    pageCleanTexts:
      string[]
  ): PdfExtractedPage[] {
    return pages.map(
      (
        page,
        pageIndex
      ) => {
        const blocks =
          page.layout.blocks.map(
            (
              block,
              blockIndex
            ) =>
              toPublicBlock(
                block,
                page.pageNumber,
                blockIndex
              )
          );
  
        return {
          pageNumber:
            page.pageNumber,
  
          rawText:
            page.rawText,
  
          layoutText:
            page.layout.text,
  
          cleanText:
            pageCleanTexts[
              pageIndex
            ] ??
            page.layout.text,
  
          width:
            page.width,
  
          height:
            page.height,
  
          rotation:
            page.rotation,
  
          glyphCount:
            page.glyphCount,
  
          wordCount:
            page.layout.words.length,
  
          lineCount:
            page.layout.lines.length,
  
          blockCount:
            blocks.length,
  
          columnCount:
            page.layout.columnCount,
  
          blocks,
        };
      }
    );
  }
  
  function toPublicBlock(
    block:
      LayoutBlock,
  
    pageNumber:
      number,
  
    blockIndex:
      number
  ): PdfExtractedBlock {
    const trust =
      calculateBlockTrust(
        block
      );
  
    return {
      id:
        `p${pageNumber}-b${blockIndex + 1}`,
  
      page:
        pageNumber,
  
      text:
        block.text,
  
      kind:
        block.kind,
  
      bbox: {
        x:
          block.bbox.x,
  
        y:
          block.bbox.y,
  
        width:
          block.bbox.width,
  
        height:
          block.bbox.height,
      },
  
      confidence:
        clamp01(
          block.confidence
        ),
  
      trustScore:
        trust.score,
  
      reasons:
        trust.reasons,
  
      sourceOrder:
        block.sourceOrder,
  
      columnIndex:
        block.columnIndex,
    };
  }
  
  function calculateBlockTrust(
    block:
      LayoutBlock
  ): {
    score:
      number;
  
    reasons:
      string[];
  } {
    const text =
      block.text.trim();
  
    const reasons:
      string[] = [];
  
    let score =
      clamp01(
        block.confidence
      );
  
    if (
      text.length ===
      0
    ) {
      reasons.push(
        "EMPTY_TEXT"
      );
  
      score *=
        0.1;
  
      return {
        score:
          clamp01(
            score
          ),
  
        reasons,
      };
    }
  
    const replacementCharacters =
      countMatches(
        text,
        /\uFFFD/g
      );
  
    if (
      replacementCharacters >
      0
    ) {
      reasons.push(
        "UNICODE_REPLACEMENT_CHARACTERS"
      );
  
      score -=
        Math.min(
          0.4,
          replacementCharacters *
            0.08
        );
    }
  
    const privateCharacters =
      countPrivateUseCharacters(
        text
      );
  
    if (
      privateCharacters >
      0
    ) {
      reasons.push(
        "PRIVATE_USE_CHARACTERS"
      );
  
      score -=
        Math.min(
          0.3,
          privateCharacters *
            0.05
        );
    }
  
    const visibleCharacters =
      text.replace(
        /\s/g,
        ""
      ).length;
  
    const alphabeticCharacters =
      (
        text.match(
          /[A-Za-zÀ-ÖØ-öø-ÿ]/g
        ) ??
        []
      ).length;
  
    if (
      visibleCharacters >=
        8 &&
      alphabeticCharacters /
        visibleCharacters <
        0.15
    ) {
      reasons.push(
        "LOW_ALPHABETIC_RATIO"
      );
  
      score -=
        0.12;
    }
  
    return {
      score:
        clamp01(
          score
        ),
  
      reasons,
    };
  }
  
  function countMatches(
    input:
      string,
  
    pattern:
      RegExp
  ): number {
    return (
      input.match(
        pattern
      ) ??
      []
    ).length;
  }
  
  function countPrivateUseCharacters(
    input:
      string
  ): number {
    let count =
      0;
  
    for (
      const character of
        input
    ) {
      const code =
        character.codePointAt(
          0
        );
  
      if (
        code !==
          undefined &&
        code >=
          0xe000 &&
        code <=
          0xf8ff
      ) {
        count +=
          1;
      }
    }
  
    return count;
  }
  
  function getPageDimensions(
    mediaBox:
      | {
          x1:
            number;
  
          y1:
            number;
  
          x2:
            number;
  
          y2:
            number;
        }
      | undefined
  ): {
    width?:
      number;
  
    height?:
      number;
  } {
    if (!mediaBox) {
      return {};
    }
  
    return {
      width:
        Math.abs(
          mediaBox.x2 -
          mediaBox.x1
        ),
  
      height:
        Math.abs(
          mediaBox.y2 -
          mediaBox.y1
        ),
    };
  }
  
  function toPublicWarning(
    warning:
      PdfWarning
  ): PdfExtractionWarning {
    return {
      code:
        String(
          warning.code
        ),
  
      message:
        warning.message,
  
      page:
        warning.page,
  
      objectNumber:
        warning.objectNumber,
    };
  }
  
  function joinPages(
    pages:
      string[]
  ): string {
    return pages
      .map(
        (
          text,
          index
        ) => {
          if (
            pages.length ===
            1
          ) {
            return text;
          }
  
          return [
            `--- Página ${index + 1} ---`,
            text,
          ].join(
            "\n"
          );
        }
      )
      .join(
        "\n\n"
      )
      .trim();
  }
  
  function calculatePageProgress(
    completedPages:
      number,
  
    totalPages:
      number
  ): number {
    if (
      totalPages <=
      0
    ) {
      return 20;
    }
  
    return Math.min(
      92,
  
      Math.round(
        20 +
          (
            completedPages /
            totalPages
          ) *
            72
      )
    );
  }
  
  function emitProgress(
    callback:
      | PdfExtractionProgressCallback
      | undefined,
  
    progress:
      PdfExtractionProgress
  ): void {
    callback?.(
      progress
    );
  }
  
  function clamp01(
    value:
      number
  ): number {
    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }