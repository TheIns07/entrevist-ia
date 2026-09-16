import type {
    LayoutBlock,
    LayoutBlockKind,
    LayoutLine,
  } from "./types";
  
  import {
    average,
    bboxTop,
    horizontalOverlapRatio,
    median,
    unionBoundingBoxes,
  } from "./LayoutGeometry";
  
  interface MutableBlock {
    lines:
      LayoutLine[];
  }
  
  export class BlockBuilder {
    build(
      lines: LayoutLine[]
    ): LayoutBlock[] {
      if (
        lines.length ===
        0
      ) {
        return [];
      }
  
      const sorted =
        [...lines].sort(
          (
            left,
            right
          ) => {
            const vertical =
              bboxTop(
                right.bbox
              ) -
              bboxTop(
                left.bbox
              );
  
            if (
              Math.abs(
                vertical
              ) >
              0.5
            ) {
              return vertical;
            }
  
            return (
              left.bbox.x -
              right.bbox.x
            );
          }
        );
  
      const mutableBlocks:
        MutableBlock[] = [];
  
      for (
        const line of sorted
      ) {
        let bestBlock:
          MutableBlock | undefined;
  
        let bestScore =
          Number.POSITIVE_INFINITY;
  
        for (
          const block of
            mutableBlocks
        ) {
          const previous =
            block.lines[
              block.lines.length -
                1
            ];
  
          const verticalGap =
            previous.bbox.y -
            bboxTop(
              line.bbox
            );
  
          /*
           * Como avanzamos de arriba
           * hacia abajo, una línea
           * situada por encima del
           * último elemento del bloque
           * no puede pertenecer a él.
           */
          if (
            verticalGap <
            -2
          ) {
            continue;
          }
  
          const averageSize =
            average(
              block.lines.map(
                (
                  current
                ) =>
                  current.fontSize
              )
            );
  
          const maximumGap =
            Math.max(
              averageSize *
                1.25,
  
              previous.bbox
                .height *
                1.2,
  
              line.bbox
                .height *
                1.2
            );
  
          if (
            verticalGap >
            maximumGap
          ) {
            continue;
          }
  
          const overlap =
            horizontalOverlapRatio(
              previous.bbox,
              line.bbox
            );
  
          const leftDifference =
            Math.abs(
              previous.bbox.x -
              line.bbox.x
            );
  
          const alignmentTolerance =
            Math.max(
              averageSize *
                3,
              18
            );
  
          if (
            overlap <
              0.12 &&
            leftDifference >
              alignmentTolerance
          ) {
            continue;
          }
  
          /*
           * Si aparece una línea mucho
           * más grande que el bloque
           * actual probablemente es un
           * nuevo encabezado.
           */
          if (
            line.fontSize >
            averageSize *
              1.3
          ) {
            continue;
          }
  
          const score =
            verticalGap +
            leftDifference *
              0.08 -
            overlap *
              5;
  
          if (
            score <
            bestScore
          ) {
            bestScore =
              score;
  
            bestBlock =
              block;
          }
        }
  
        if (
          bestBlock
        ) {
          bestBlock.lines.push(
            line
          );
        } else {
          mutableBlocks.push({
            lines: [
              line,
            ],
          });
        }
      }
  
      const medianFontSize =
        median(
          lines.map(
            (
              line
            ) =>
              line.fontSize
          )
        );
  
      return mutableBlocks
        .map(
          (
            block
          ) =>
            this.finalizeBlock(
              block,
              medianFontSize
            )
        )
        .sort(
          (
            left,
            right
          ) => {
            const vertical =
              bboxTop(
                right.bbox
              ) -
              bboxTop(
                left.bbox
              );
  
            if (
              Math.abs(
                vertical
              ) >
              0.5
            ) {
              return vertical;
            }
  
            return (
              left.bbox.x -
              right.bbox.x
            );
          }
        );
    }
  
    private finalizeBlock(
      block:
        MutableBlock,
  
      medianFontSize:
        number
    ): LayoutBlock {
      const lines =
        [...block.lines].sort(
          (
            left,
            right
          ) =>
            bboxTop(
              right.bbox
            ) -
              bboxTop(
                left.bbox
              ) ||
            left.bbox.x -
              right.bbox.x
        );
  
      const text =
        lines
          .map(
            (
              line
            ) =>
              line.text
          )
          .join(
            "\n"
          )
          .trim();
  
      const fontSize =
        average(
          lines.map(
            (
              line
            ) =>
              line.fontSize
          )
        );
  
      return {
        text,
  
        page:
          lines[0].page,
  
        bbox:
          unionBoundingBoxes(
            lines.map(
              (
                line
              ) =>
                line.bbox
            )
          ),
  
        fontSize,
  
        confidence:
          average(
            lines.map(
              (
                line
              ) =>
                line.confidence
            )
          ),
  
        lines,
  
        kind:
          detectBlockKind(
            text,
            lines.length,
            fontSize,
            medianFontSize
          ),
  
        sourceOrder:
          Math.min(
            ...lines.map(
              (
                line
              ) =>
                line.sourceOrder
            )
          ),
      };
    }
  }
  
  function detectBlockKind(
    text: string,
    lineCount: number,
    fontSize: number,
    medianFontSize: number
  ): LayoutBlockKind {
    const trimmed =
      text.trim();
  
    if (
      trimmed.length ===
      0
    ) {
      return "text";
    }
  
    const shortBlock =
      trimmed.length <=
      80;
  
    const largeFont =
      medianFontSize >
        0 &&
      fontSize >=
        medianFontSize *
          1.16;
  
    const letters =
      trimmed.replace(
        /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,
        ""
      );
  
    const uppercase =
      letters.length >=
        3 &&
      letters ===
        letters.toUpperCase();
  
    if (
      shortBlock &&
      (
        largeFont ||
        (
          uppercase &&
          lineCount <= 2
        )
      )
    ) {
      return "heading";
    }
  
    return "text";
  }