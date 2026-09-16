import type {
    LayoutLine,
    LayoutWord,
  } from "./types";
  
  import {
    average,
    bboxCenterY,
    bboxRight,
    median,
    unionBoundingBoxes,
    verticalOverlapRatio,
  } from "./LayoutGeometry";
  
  interface WordRow {
    words: LayoutWord[];
  
    centerY: number;
  
    averageFontSize: number;
  }
  
  export class LineBuilder {
    build(
      words: LayoutWord[]
    ): LayoutLine[] {
      if (
        words.length ===
        0
      ) {
        return [];
      }
  
      const rows =
        this.buildRows(
          words
        );
  
      const lines:
        LayoutLine[] = [];
  
      for (
        const row of rows
      ) {
        lines.push(
          ...this.splitRow(
            row
          )
        );
      }
  
      return lines.sort(
        (
          left,
          right
        ) => {
          const leftTop =
            left.bbox.y +
            left.bbox.height;
  
          const rightTop =
            right.bbox.y +
            right.bbox.height;
  
          if (
            Math.abs(
              leftTop -
                rightTop
            ) >
            0.5
          ) {
            return (
              rightTop -
              leftTop
            );
          }
  
          return (
            left.bbox.x -
            right.bbox.x
          );
        }
      );
    }
  
    private buildRows(
      words: LayoutWord[]
    ): WordRow[] {
      const sorted =
        [...words].sort(
          (
            left,
            right
          ) => {
            const yDifference =
              bboxCenterY(
                right.bbox
              ) -
              bboxCenterY(
                left.bbox
              );
  
            if (
              Math.abs(
                yDifference
              ) >
              0.5
            ) {
              return yDifference;
            }
  
            return (
              left.bbox.x -
              right.bbox.x
            );
          }
        );
  
      const rows:
        WordRow[] = [];
  
      for (
        const word of sorted
      ) {
        const centerY =
          bboxCenterY(
            word.bbox
          );
  
        let bestRow:
          WordRow | undefined;
  
        let bestScore =
          Number.NEGATIVE_INFINITY;
  
        for (
          const row of rows
        ) {
          const distance =
            Math.abs(
              row.centerY -
                centerY
            );
  
          const tolerance =
            Math.max(
              2,
  
              Math.min(
                row.averageFontSize,
                Math.max(
                  word.fontSize,
                  1
                )
              ) *
                0.45
            );
  
          if (
            distance >
            tolerance
          ) {
            continue;
          }
  
          const overlap =
            Math.max(
              ...row.words.map(
                (
                  existing
                ) =>
                  verticalOverlapRatio(
                    existing.bbox,
                    word.bbox
                  )
              )
            );
  
          const score =
            overlap * 10 -
            distance;
  
          if (
            score >
            bestScore
          ) {
            bestScore =
              score;
  
            bestRow =
              row;
          }
        }
  
        if (!bestRow) {
          rows.push({
            words: [
              word,
            ],
  
            centerY,
  
            averageFontSize:
              word.fontSize,
          });
  
          continue;
        }
  
        bestRow.words.push(
          word
        );
  
        bestRow.centerY =
          average(
            bestRow.words.map(
              (
                current
              ) =>
                bboxCenterY(
                  current.bbox
                )
            )
          );
  
        bestRow.averageFontSize =
          average(
            bestRow.words.map(
              (
                current
              ) =>
                current.fontSize
            )
          );
      }
  
      return rows;
    }
  
    private splitRow(
      row: WordRow
    ): LayoutLine[] {
      const sorted =
        [...row.words].sort(
          (
            left,
            right
          ) =>
            left.bbox.x -
            right.bbox.x
        );
  
      if (
        sorted.length ===
        1
      ) {
        return [
          this.createLine(
            sorted
          ),
        ];
      }
  
      const widths =
        sorted.map(
          (
            word
          ) =>
            word.bbox.width
        );
  
      const medianWordWidth =
        Math.max(
          median(
            widths
          ),
          1
        );
  
      /*
       * Si dos columnas comparten
       * exactamente el mismo Y, no
       * queremos convertirlas en una
       * sola línea.
       */
      const columnGapThreshold =
        Math.max(
          row.averageFontSize *
            4.2,
  
          medianWordWidth *
            1.65
        );
  
      const groups:
        LayoutWord[][] = [];
  
      let current:
        LayoutWord[] = [];
  
      for (
        const word of sorted
      ) {
        if (
          current.length ===
          0
        ) {
          current.push(
            word
          );
  
          continue;
        }
  
        const previous =
          current[
            current.length -
              1
          ];
  
        const gap =
          word.bbox.x -
          bboxRight(
            previous.bbox
          );
  
        if (
          gap >
          columnGapThreshold
        ) {
          groups.push(
            current
          );
  
          current = [];
        }
  
        current.push(
          word
        );
      }
  
      if (
        current.length >
        0
      ) {
        groups.push(
          current
        );
      }
  
      return groups.map(
        (
          group
        ) =>
          this.createLine(
            group
          )
      );
    }
  
    private createLine(
      words:
        LayoutWord[]
    ): LayoutLine {
      const sorted =
        [...words].sort(
          (
            left,
            right
          ) =>
            left.bbox.x -
            right.bbox.x
        );
  
      return {
        text:
          joinWords(
            sorted
          ),
  
        page:
          sorted[0].page,
  
        bbox:
          unionBoundingBoxes(
            sorted.map(
              (
                word
              ) =>
                word.bbox
            )
          ),
  
        fontSize:
          average(
            sorted.map(
              (
                word
              ) =>
                word.fontSize
            )
          ),
  
        confidence:
          average(
            sorted.map(
              (
                word
              ) =>
                word.confidence
            )
          ),
  
        words:
          sorted,
  
        sourceOrder:
          Math.min(
            ...sorted.map(
              (
                word
              ) =>
                word.sourceOrder
            )
          ),
      };
    }
  }
  
  function joinWords(
    words:
      LayoutWord[]
  ): string {
    let result = "";
  
    for (
      const word of words
    ) {
      if (
        result.length ===
        0
      ) {
        result =
          word.text;
  
        continue;
      }
  
      if (
        /^[,.;:!?%)\]}]/.test(
          word.text
        )
      ) {
        result +=
          word.text;
  
        continue;
      }
  
      if (
        /[(\[¿¡{]$/.test(
          result
        )
      ) {
        result +=
          word.text;
  
        continue;
      }
  
      result +=
        ` ${word.text}`;
    }
  
    return result
      .replace(
        /[ \t]{2,}/g,
        " "
      )
      .trim();
  }