import type {
    PdfGlyph,
  } from "../types";
  
  import type {
    LayoutWord,
  } from "./types";
  
  import {
    average,
    bboxCenterY,
    bboxRight,
    median,
    unionBoundingBoxes,
  } from "./LayoutGeometry";
  
  interface GlyphWithOrder {
    glyph: PdfGlyph;
  
    sourceOrder: number;
  }
  
  interface GlyphRow {
    glyphs: GlyphWithOrder[];
  
    centerY: number;
  
    averageFontSize: number;
  }
  
  export class WordBuilder {
    build(
      glyphs: PdfGlyph[]
    ): LayoutWord[] {
      const usableGlyphs =
        glyphs
          .map(
            (
              glyph,
              sourceOrder
            ) => ({
              glyph,
              sourceOrder,
            })
          )
          .filter(
            (
              item
            ) =>
              item.glyph
                .visible &&
              item.glyph.text
                .length >
                0
          );
  
      if (
        usableGlyphs.length ===
        0
      ) {
        return [];
      }
  
      const rows =
        this.buildRows(
          usableGlyphs
        );
  
      const words:
        LayoutWord[] = [];
  
      for (
        const row of rows
      ) {
        words.push(
          ...this.buildRowWords(
            row
          )
        );
      }
  
      return words;
    }
  
    private buildRows(
      glyphs:
        GlyphWithOrder[]
    ): GlyphRow[] {
      const sorted =
        [...glyphs].sort(
          (
            left,
            right
          ) => {
            const leftY =
              bboxCenterY(
                left.glyph
                  .bbox
              );
  
            const rightY =
              bboxCenterY(
                right.glyph
                  .bbox
              );
  
            if (
              Math.abs(
                leftY -
                  rightY
              ) >
              0.5
            ) {
              return (
                rightY -
                leftY
              );
            }
  
            return (
              left.glyph
                .bbox.x -
              right.glyph
                .bbox.x
            );
          }
        );
  
      const rows:
        GlyphRow[] = [];
  
      for (
        const item of sorted
      ) {
        const glyph =
          item.glyph;
  
        const centerY =
          bboxCenterY(
            glyph.bbox
          );
  
        let bestRow:
          GlyphRow | undefined;
  
        let bestDistance =
          Number.POSITIVE_INFINITY;
  
        for (
          const row of rows
        ) {
          const tolerance =
            Math.max(
              1.5,
  
              Math.min(
                row.averageFontSize,
                Math.max(
                  glyph.fontSize,
                  1
                )
              ) *
                0.38
            );
  
          const distance =
            Math.abs(
              row.centerY -
                centerY
            );
  
          if (
            distance <=
              tolerance &&
            distance <
              bestDistance
          ) {
            bestRow =
              row;
  
            bestDistance =
              distance;
          }
        }
  
        if (!bestRow) {
          rows.push({
            glyphs: [
              item,
            ],
  
            centerY,
  
            averageFontSize:
              Math.max(
                glyph.fontSize,
                1
              ),
          });
  
          continue;
        }
  
        bestRow.glyphs.push(
          item
        );
  
        bestRow.centerY =
          average(
            bestRow.glyphs.map(
              (
                current
              ) =>
                bboxCenterY(
                  current
                    .glyph
                    .bbox
                )
            )
          );
  
        bestRow.averageFontSize =
          average(
            bestRow.glyphs.map(
              (
                current
              ) =>
                Math.max(
                  current
                    .glyph
                    .fontSize,
                  1
                )
            )
          );
      }
  
      return rows.sort(
        (
          left,
          right
        ) =>
          right.centerY -
          left.centerY
      );
    }
  
    private buildRowWords(
      row: GlyphRow
    ): LayoutWord[] {
      const glyphs =
        [...row.glyphs].sort(
          (
            left,
            right
          ) =>
            left.glyph
              .bbox.x -
            right.glyph
              .bbox.x
        );
  
      const positiveWidths =
        glyphs
          .map(
            (
              item
            ) =>
              item.glyph
                .bbox.width
          )
          .filter(
            (
              width
            ) =>
              width >
              0
          );
  
      const medianGlyphWidth =
        Math.max(
          median(
            positiveWidths
          ),
          row.averageFontSize *
            0.2,
          1
        );
  
      const words:
        LayoutWord[] = [];
  
      let current:
        GlyphWithOrder[] =
          [];
  
      const flush =
        () => {
          if (
            current.length ===
            0
          ) {
            return;
          }
  
          const word =
            this.createWord(
              current
            );
  
          if (
            word.text.trim()
              .length >
            0
          ) {
            words.push(
              word
            );
          }
  
          current = [];
        };
  
      for (
        const item of glyphs
      ) {
        const glyph =
          item.glyph;
  
        /*
         * Un glifo puede representar
         * varios caracteres, incluso
         * una ligadura.
         */
        if (
          /^\s+$/.test(
            glyph.text
          )
        ) {
          flush();
          continue;
        }
  
        if (
          current.length ===
          0
        ) {
          current.push(
            item
          );
  
          continue;
        }
  
        const previous =
          current[
            current.length -
              1
          ].glyph;
  
        const gap =
          glyph.bbox.x -
          bboxRight(
            previous.bbox
          );
  
        const fontSize =
          Math.max(
            previous.fontSize,
            glyph.fontSize,
            row.averageFontSize,
            1
          );
  
        /*
         * No utilizamos píxeles fijos.
         *
         * El espacio de palabra se
         * deriva del tamaño de fuente
         * y del ancho típico de glifo.
         */
        const wordThreshold =
          Math.max(
            fontSize *
              0.28,
  
            medianGlyphWidth *
              0.62
          );
  
        if (
          gap >
          wordThreshold
        ) {
          flush();
        }
  
        current.push(
          item
        );
      }
  
      flush();
  
      return words;
    }
  
    private createWord(
      glyphs:
        GlyphWithOrder[]
    ): LayoutWord {
      const text =
        glyphs
          .map(
            (
              item
            ) =>
              item.glyph
                .text
          )
          .join("")
          .normalize(
            "NFC"
          );
  
      const fontWeights =
        new Map<
          string,
          number
        >();
  
      for (
        const {
          glyph,
        } of glyphs
      ) {
        const weight =
          Math.max(
            glyph.text.length,
            1
          );
  
          const fontName =
          glyph.font ??
          "Unknown";
        
        fontWeights.set(
          fontName,
          (
            fontWeights.get(
              fontName
            ) ??
            0
          ) +
            weight
        );
      }
  
      const font =
        [
          ...fontWeights.entries(),
        ].sort(
          (
            left,
            right
          ) =>
            right[1] -
            left[1]
        )[0]?.[0] ??
        "Unknown";
  
      return {
        text,
  
        page:
          glyphs[0]
            .glyph.page,
  
        bbox:
          unionBoundingBoxes(
            glyphs.map(
              (
                item
              ) =>
                item.glyph
                  .bbox
            )
          ),
  
        font,
  
        fontSize:
          average(
            glyphs.map(
              (
                item
              ) =>
                item.glyph
                  .fontSize
            )
          ),
  
        confidence:
          average(
            glyphs.map(
              (
                item
              ) =>
                item.glyph
                  .confidence
            )
          ),
  
        glyphs:
          glyphs.map(
            (
              item
            ) =>
              item.glyph
          ),
  
        sourceOrder:
          Math.min(
            ...glyphs.map(
              (
                item
              ) =>
                item.sourceOrder
            )
          ),
      };
    }
  }