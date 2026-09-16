import {
  DocumentCleaner,
} from "../cleaning/DocumentCleaner";

import type {
  RemovedTextFragment,
} from "../cleaning/types";

import {
  LayoutEngine,
} from "../layout/LayoutEngine";

import {
  PdfParser,
} from "../parser/PdfParser";

import type {
  PdfWarning,
} from "../types";

import {
  GlyphExtractor,
} from "./GlyphExtractor";

import {
  DocumentIntelligenceEngine,
} from "../ai/DocumentIntelligenceEngine";

import type {
  DocumentQuality,
} from "../quality/types";

import type {
  DocumentStructure,
  ResumeDetectionResult,
} from "../structure/types";

export interface PdfTextProbeResult {
  rawText:
    string;

  layoutText:
    string;

  cleanText:
    string;

  pageTexts:
    string[];

  pageLayoutTexts:
    string[];

  pageCleanTexts:
    string[];

  removedFragments:
    RemovedTextFragment[];

  pageCount:
    number;

  warnings:
  PdfWarning[];

  aiText:
  string;

  structure:
  DocumentStructure;

  resume:
  ResumeDetectionResult;

  quality:
  DocumentQuality;

  confidence:
  number;
}

export type PdfProbeStage =
  | "starting"
  | "parsing"
  | "pages-found"
  | "page-start"
  | "text-extracted"
  | "layout-complete"
  | "page-complete"
  | "cleaning"
  | "complete"
  | "analyzing";

export interface PdfProbeProgress {
  stage:
    PdfProbeStage;

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

export type PdfProbeProgressCallback =
  (
    progress:
      PdfProbeProgress
  ) => void;

export async function extractRawTextProbe(
  source:
    ArrayBuffer,

  onProgress?:
    PdfProbeProgressCallback
): Promise<PdfTextProbeResult> {
  emitProgress(
    onProgress,
    {
      stage:
        "starting",

      message:
        "Inicializando parser PDF...",

      progress:
        5,
    }
  );

  await yieldToBrowser();

  /*
   * =====================================================
   * FASE 1
   * ESTRUCTURA PDF
   * =====================================================
   */

  emitProgress(
    onProgress,
    {
      stage:
        "parsing",

      message:
        "Analizando estructura, XRef y PageTree...",

      progress:
        10,
    }
  );

  console.time(
    "[PDF Engine] PdfParser.parse"
  );

  const parser =
    new PdfParser(
      source
    );

  const parsed =
    parser.parse();

  console.timeEnd(
    "[PDF Engine] PdfParser.parse"
  );

  console.log(
    "[PDF Engine] Versión:",
    parsed.version
  );

  console.log(
    "[PDF Engine] XRef objects:",
    parsed.xref.size
  );

  console.log(
    "[PDF Engine] Páginas:",
    parsed.pages.length
  );

  const warnings:
    PdfWarning[] = [
      ...parsed.warnings,
    ];

  emitProgress(
    onProgress,
    {
      stage:
        "pages-found",

      message:
        `Estructura leída. ${parsed.pages.length} página(s) encontrada(s).`,

      progress:
        20,

      totalPages:
        parsed.pages.length,
    }
  );

  await yieldToBrowser();

  /*
   * =====================================================
   * FASE 2
   * GLYPHS / UNICODE
   * =====================================================
   */

  const glyphExtractor =
    new GlyphExtractor(
      parser
    );

  /*
   * =====================================================
   * FASE 3
   * LAYOUT
   * =====================================================
   */

  const layoutEngine =
    new LayoutEngine();

  const pageTexts:
    string[] = [];

  const pageLayoutTexts:
    string[] = [];

  const totalPages =
    parsed.pages.length;

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

    const pageStartProgress =
      calculatePageProgress(
        index,
        totalPages
      );

    emitProgress(
      onProgress,
      {
        stage:
          "page-start",

        message:
          `Procesando página ${pageNumber} de ${totalPages}...`,

        progress:
          pageStartProgress,

        page:
          pageNumber,

        totalPages,
      }
    );

    await yieldToBrowser();

    console.group(
      `[PDF Engine] Página ${pageNumber}/${totalPages}`
    );

    /*
     * ===================================================
     * EXTRAER GLYPHS
     * ===================================================
     */

    console.time(
      `[PDF Engine] Glyph extraction ${pageNumber}`
    );

    const extraction =
      await glyphExtractor.extractPage(
        page
      );

    console.timeEnd(
      `[PDF Engine] Glyph extraction ${pageNumber}`
    );

    warnings.push(
      ...extraction.warnings
    );

    pageTexts.push(
      extraction.rawText
    );

    emitProgress(
      onProgress,
      {
        stage:
          "text-extracted",

        message:
          `Página ${pageNumber}: ${extraction.glyphs.length} glifos Unicode recuperados.`,

        progress:
          pageStartProgress,

        page:
          pageNumber,

        totalPages,

        partialText:
          extraction.rawText,
      }
    );

    console.log(
      "[PDF Engine] Glyphs:",
      extraction.glyphs.length
    );

    console.log(
      "[PDF Engine] Texto raw:"
    );

    console.log(
      extraction.rawText
    );

    /*
     * ===================================================
     * RECONSTRUIR LAYOUT
     * ===================================================
     */

    console.time(
      `[PDF Engine] Layout ${pageNumber}`
    );

    const layout =
      layoutEngine.buildPage(
        extraction.glyphs
      );

    console.timeEnd(
      `[PDF Engine] Layout ${pageNumber}`
    );

    /*
     * ===================================================
     * DEBUG DE LAYOUT
     * ===================================================
     *
     * Lo dejamos por ahora porque
     * todavía estamos validando FASE 3.
     *
     * Más adelante lo podemos quitar
     * o proteger con un flag DEBUG.
     * ===================================================
     */

    console.log(
      `[PDF Engine] PAGE ${pageNumber} LAYOUT DEBUG`
    );

    console.log(
      "Column count:",
      layout.columnCount
    );

    console.table(
      layout.blocks.map(
        (
          block,
          blockIndex
        ) => ({
          block:
            blockIndex,

          column:
            block.columnIndex,

          sourceOrder:
            block.sourceOrder,

          x:
            Number(
              block.bbox.x.toFixed(
                2
              )
            ),

          y:
            Number(
              block.bbox.y.toFixed(
                2
              )
            ),

          width:
            Number(
              block.bbox.width.toFixed(
                2
              )
            ),

          height:
            Number(
              block.bbox.height.toFixed(
                2
              )
            ),

          text:
            block.text
              .replace(
                /\n/g,
                " ↵ "
              )
              .slice(
                0,
                120
              ),
        })
      )
    );

    for (
      const column of
        layout.columns
    ) {
      console.log(
        `[PDF Engine] COLUMN ${column.index}`
      );

      console.table(
        column.blocks.map(
          (
            block
          ) => ({
            x:
              Number(
                block.bbox.x.toFixed(
                  2
                )
              ),

            y:
              Number(
                block.bbox.y.toFixed(
                  2
                )
              ),

            sourceOrder:
              block.sourceOrder,

            text:
              block.text
                .replace(
                  /\n/g,
                  " ↵ "
                )
                .slice(
                  0,
                  100
                ),
          })
        )
      );
    }

    pageLayoutTexts.push(
      layout.text
    );

    console.log(
      "[PDF Engine] Layout:",
      {
        words:
          layout.words.length,

        lines:
          layout.lines.length,

        blocks:
          layout.blocks.length,

        columns:
          layout.columnCount,
      }
    );

    console.log(
      "[PDF Engine] Texto visual:"
    );

    console.log(
      layout.text
    );

    emitProgress(
      onProgress,
      {
        stage:
          "layout-complete",

        message:
          `Página ${pageNumber}: ${layout.columnCount} columna(s), ${layout.blocks.length} bloque(s).`,

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

    console.groupEnd();

    await yieldToBrowser();
  }

  /*
   * =====================================================
   * CONSTRUIR RESULTADOS FASE 2 Y FASE 3
   * =====================================================
   */

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
   * LIMPIEZA DOCUMENTAL
   * =====================================================
   *
   * Importante:
   *
   * DocumentCleaner recibe los textos
   * separados por página.
   *
   * Esto permite detectar:
   *
   * - headers repetidos;
   * - footers repetidos;
   * - números de página;
   * - duplicados;
   * - ruido;
   * - saltos artificiales;
   * - hyphenation.
   *
   * No debemos pasarle layoutText
   * completo porque perderíamos la
   * frontera entre páginas.
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
        97,

      totalPages,
    }
  );

  await yieldToBrowser();

  console.time(
    "[PDF Engine] Document cleaning"
  );

  const cleaner =
    new DocumentCleaner();

  const cleaning =
    cleaner.clean(
      pageLayoutTexts
    );

  console.timeEnd(
    "[PDF Engine] Document cleaning"
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
 * ESTRUCTURA / CALIDAD / AI TEXT
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
      98,

    totalPages,
  }
);

await yieldToBrowser();

console.time(
  "[PDF Engine] Document intelligence"
);

const intelligenceEngine =
  new DocumentIntelligenceEngine();

const intelligence =
  intelligenceEngine.analyze({
    cleanText,

    warnings,
  });

console.timeEnd(
  "[PDF Engine] Document intelligence"
);

const aiText =
  intelligence.aiText;

  /*
   * =====================================================
   * DEBUG FINAL
   * =====================================================
   */

  console.log(
    "================================"
  );

  console.log(
    "[PDF Engine] RAW TEXT"
  );

  console.log(
    "================================"
  );

  console.log(
    rawText
  );

  console.log(
    "================================"
  );

  console.log(
    "[PDF Engine] LAYOUT TEXT"
  );

  console.log(
    "================================"
  );

  console.log(
    layoutText
  );

  console.log(
    "================================"
  );

  console.log(
    "[PDF Engine] CLEAN TEXT"
  );

  console.log(
    "================================"
  );

  console.log(
    cleanText
  );

  console.log(
    "================================"
  );

  console.log(
    "[PDF Engine] REMOVED FRAGMENTS"
  );

  console.log(
    "================================"
  );

  console.table(
    cleaning.removed.map(
      (
        fragment
      ) => ({
        page:
          fragment.page,

        line:
          fragment.lineNumber,

        reason:
          fragment.reason,

        text:
          fragment.text,
      })
    )
  );

  console.log(
    "================================"
  );
  
  console.log(
    "[PDF Engine] DOCUMENT STRUCTURE"
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    intelligence.structure
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    "[PDF Engine] RESUME STRUCTURE"
  );
  
  console.log(
    "================================"
  );
  
  console.table(
    intelligence.resume.sections.map(
      (
        section
      ) => ({
        kind:
          section.kind,
  
        heading:
          section.heading ??
          "",
  
        confidence:
          section.confidence,
  
        preview:
          section.text.slice(
            0,
            120
          ),
      })
    )
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    "[PDF Engine] QUALITY"
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    intelligence.quality
  );
  
  console.log(
    "[PDF Engine] Confidence:",
    intelligence.confidence
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    "[PDF Engine] AI TEXT"
  );
  
  console.log(
    "================================"
  );
  
  console.log(
    aiText
  );

  /*
   * =====================================================
   * FIN
   * =====================================================
   */

  emitProgress(
    onProgress,
    {
      stage:
        "complete",
  
      message:
        `Extracción terminada. Confianza ${Math.round(
          intelligence.confidence *
            100
        )}%.`,
  
      progress:
        100,
  
      totalPages,
  
      partialText:
        aiText,
    }
  );

  return {
    rawText,
  
    layoutText,
  
    cleanText,
  
    aiText,
  
    pageTexts,
  
    pageLayoutTexts,
  
    pageCleanTexts,
  
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
  
    pageCount:
      totalPages,
  
    warnings,
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
    95,

    Math.round(
      20 +
        (
          completedPages /
          totalPages
        ) *
          75
    )
  );
}

function emitProgress(
  callback:
    | PdfProbeProgressCallback
    | undefined,

  progress:
    PdfProbeProgress
): void {
  console.log(
    `[PDF Engine] ${progress.progress}% - ${progress.message}`
  );

  callback?.(
    progress
  );
}

function yieldToBrowser():
  Promise<void> {
  return new Promise(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        0
      );
    }
  );
}