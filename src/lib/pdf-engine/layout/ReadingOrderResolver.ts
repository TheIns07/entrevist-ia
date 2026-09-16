import type {
  ColumnDetectionResult,
  LayoutBlock,
  LayoutLine,
} from "./types";

import {
  average,
  bboxCenterY,
  bboxTop,
  unionBoundingBoxes,
  verticalOverlapRatio,
} from "./LayoutGeometry";

export type ReadingMode =
  | "row-major"
  | "column-major";

export interface ReadingOrderResult {
  blocks:
    LayoutBlock[];

  text:
    string;

  mode:
    ReadingMode;
}

interface LineRow {
  lines:
    LayoutLine[];

  centerY:
    number;

  fontSize:
    number;
}

export class ReadingOrderResolver {
  resolve(
    detection:
      ColumnDetectionResult,

    lines:
      LayoutLine[]
  ): ReadingOrderResult {
    if (
      lines.length ===
      0
    ) {
      return {
        blocks: [],
        text: "",
        mode:
          "row-major",
      };
    }

    const orderedBlocks =
      this.resolveBlocks(
        detection
      );

    /*
     * Una sola columna no necesita
     * estrategia column-major.
     */
    if (
      detection.columnCount <=
      1
    ) {
      const rows =
        this.buildRows(
          lines
        );

      return {
        blocks:
          orderedBlocks,

        text:
          this.buildRowMajorText(
            rows
          ),

        mode:
          "row-major",
      };
    }

    /*
     * Construimos DOS interpretaciones
     * posibles del mismo documento.
     *
     * A)
     * arriba -> abajo
     * izquierda -> derecha
     *
     * B)
     * columna izquierda completa,
     * luego columna derecha.
     */
    const rows =
      this.buildRows(
        lines
      );

    const rowMajorLines =
      rows.flatMap(
        (
          row
        ) =>
          [...row.lines].sort(
            (
              left,
              right
            ) =>
              left.bbox.x -
              right.bbox.x
          )
      );

    const columnMajorLines =
      this.buildColumnMajorOrder(
        lines,
        detection
      );

    /*
     * sourceOrder proviene del orden
     * real en el content stream.
     *
     * No confiamos ciegamente en él,
     * pero sí sirve como evidencia.
     *
     * Muchos generadores como Word
     * almacenan el contenido en un
     * orden semántico bastante bueno.
     */
    const rowAgreement =
      calculateSourceOrderAgreement(
        rowMajorLines
      );

    const columnAgreement =
      calculateSourceOrderAgreement(
        columnMajorLines
      );

    const parallelRatio =
      calculateParallelRowRatio(
        rows
      );

    const mode =
      chooseReadingMode(
        rowAgreement,
        columnAgreement,
        parallelRatio
      );

    console.log(
      "[PDF Engine] Reading order:",
      {
        mode,

        rowAgreement:
          Number(
            rowAgreement.toFixed(
              3
            )
          ),

        columnAgreement:
          Number(
            columnAgreement.toFixed(
              3
            )
          ),

        parallelRatio:
          Number(
            parallelRatio.toFixed(
              3
            )
          ),

        detectedColumns:
          detection.columnCount,
      }
    );

    if (
      mode ===
      "row-major"
    ) {
      return {
        blocks:
          orderedBlocks,

        text:
          this.buildRowMajorText(
            rows
          ),

        mode,
      };
    }

    return {
      blocks:
        orderedBlocks,

      text:
        buildBlockText(
          orderedBlocks
        ),

      mode,
    };
  }

  /*
   * =====================================================
   * ROW MAJOR
   * =====================================================
   *
   * Agrupa líneas que comparten
   * aproximadamente el mismo baseline.
   *
   * Ejemplo:
   *
   * 2000-2003 | Universidad | Degree
   *
   * pasa a ser una sola fila lógica.
   * =====================================================
   */

  private buildRows(
    lines:
      LayoutLine[]
  ): LineRow[] {
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

    const rows:
      LineRow[] = [];

    for (
      const line of sorted
    ) {
      const centerY =
        bboxCenterY(
          line.bbox
        );

      let selected:
        LineRow | undefined;

      let bestDistance =
        Number.POSITIVE_INFINITY;

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
            1.5,

            Math.min(
              Math.max(
                row.fontSize,
                1
              ),

              Math.max(
                line.fontSize,
                1
              )
            ) *
              0.38
          );

        if (
          distance >
          tolerance
        ) {
          continue;
        }

        const overlap =
          Math.max(
            ...row.lines.map(
              (
                existing
              ) =>
                verticalOverlapRatio(
                  existing.bbox,
                  line.bbox
                )
            )
          );

        /*
         * Evitamos unir líneas cercanas
         * que en realidad pertenecen a
         * renglones distintos.
         */
        if (
          overlap <
          0.3 &&
          distance >
          tolerance *
            0.55
        ) {
          continue;
        }

        if (
          distance <
          bestDistance
        ) {
          bestDistance =
            distance;

          selected =
            row;
        }
      }

      if (!selected) {
        rows.push({
          lines: [
            line,
          ],

          centerY,

          fontSize:
            line.fontSize,
        });

        continue;
      }

      selected.lines.push(
        line
      );

      selected.centerY =
        average(
          selected.lines.map(
            (
              current
            ) =>
              bboxCenterY(
                current.bbox
              )
          )
        );

      selected.fontSize =
        average(
          selected.lines.map(
            (
              current
            ) =>
              current.fontSize
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

  private buildRowMajorText(
    rows:
      LineRow[]
  ): string {
    if (
      rows.length ===
      0
    ) {
      return "";
    }

    const result:
      string[] = [];

    let previousBottom:
      number | undefined;

    let previousFontSize:
      number | undefined;

    for (
      const row of rows
    ) {
      const sortedLines =
        [...row.lines].sort(
          (
            left,
            right
          ) =>
            left.bbox.x -
            right.bbox.x
        );

      const rowBox =
        unionBoundingBoxes(
          sortedLines.map(
            (
              line
            ) =>
              line.bbox
          )
        );

      if (
        previousBottom !==
          undefined
      ) {
        const gap =
          previousBottom -
          bboxTop(
            rowBox
          );

        const referenceSize =
          Math.max(
            row.fontSize,
            previousFontSize ??
              row.fontSize,
            1
          );

        /*
         * Espacio vertical considerable:
         * conservamos separación de
         * párrafo/sección.
         */
        if (
          gap >
          Math.max(
            referenceSize *
              0.9,
            5
          )
        ) {
          result.push(
            ""
          );
        }
      }

      const rowText =
        joinParallelLines(
          sortedLines
        );

      if (
        rowText.length >
        0
      ) {
        result.push(
          rowText
        );
      }

      previousBottom =
        rowBox.y;

      previousFontSize =
        row.fontSize;
    }

    return result
      .join(
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim()
      .normalize(
        "NFC"
      );
  }

  /*
   * =====================================================
   * COLUMN MAJOR
   * =====================================================
   */

  private buildColumnMajorOrder(
    lines:
      LayoutLine[],

    detection:
      ColumnDetectionResult
  ): LayoutLine[] {
    if (
      detection.columns.length <=
      1
    ) {
      return [...lines].sort(
        compareLinesTopToBottom
      );
    }

    const pageBox =
      unionBoundingBoxes(
        lines.map(
          (
            line
          ) =>
            line.bbox
        )
      );

    const pageWidth =
      Math.max(
        pageBox.width,
        1
      );

    const spanning =
      lines
        .filter(
          (
            line
          ) =>
            line.bbox.width >=
            pageWidth *
              0.72
        )
        .sort(
          compareLinesTopToBottom
        );

    const regular =
      lines.filter(
        (
          line
        ) =>
          !spanning.includes(
            line
          )
      );

    const result:
      LayoutLine[] = [];

    const emitted =
      new Set<
        LayoutLine
      >();

    for (
      const spanningLine of
        spanning
    ) {
      const top =
        bboxTop(
          spanningLine.bbox
        );

      const region =
        regular.filter(
          (
            line
          ) =>
            !emitted.has(
              line
            ) &&
            bboxTop(
              line.bbox
            ) >
              top
        );

      const ordered =
        this.orderLinesByColumns(
          region,
          detection
        );

      for (
        const line of ordered
      ) {
        emitted.add(
          line
        );

        result.push(
          line
        );
      }

      result.push(
        spanningLine
      );
    }

    const remaining =
      regular.filter(
        (
          line
        ) =>
          !emitted.has(
            line
          )
      );

    result.push(
      ...this.orderLinesByColumns(
        remaining,
        detection
      )
    );

    return result;
  }

  private orderLinesByColumns(
    lines:
      LayoutLine[],

    detection:
      ColumnDetectionResult
  ): LayoutLine[] {
    const groups =
      new Map<
        number,
        LayoutLine[]
      >();

    for (
      const line of lines
    ) {
      let bestColumn =
        detection.columns[0]
          ?.index ??
        0;

      let bestDistance =
        Number.POSITIVE_INFINITY;

      for (
        const column of
          detection.columns
      ) {
        const distance =
          Math.abs(
            line.bbox.x -
            column.bbox.x
          );

        if (
          distance <
          bestDistance
        ) {
          bestDistance =
            distance;

          bestColumn =
            column.index;
        }
      }

      const group =
        groups.get(
          bestColumn
        ) ??
        [];

      group.push(
        line
      );

      groups.set(
        bestColumn,
        group
      );
    }

    const columnIndexes =
      [...groups.keys()].sort(
        (
          left,
          right
        ) =>
          left -
          right
      );

    const result:
      LayoutLine[] = [];

    for (
      const columnIndex of
        columnIndexes
    ) {
      const columnLines =
        groups.get(
          columnIndex
        ) ??
        [];

      columnLines.sort(
        compareLinesTopToBottom
      );

      result.push(
        ...columnLines
      );
    }

    return result;
  }

  /*
   * Conservamos el orden de bloques
   * porque seguirá siendo útil en
   * FASE 4 y FASE 5.
   */
  private resolveBlocks(
    detection:
      ColumnDetectionResult
  ): LayoutBlock[] {
    if (
      detection.blocks.length ===
      0
    ) {
      return [];
    }

    if (
      detection.columnCount <=
      1
    ) {
      return [
        ...detection.blocks,
      ].sort(
        compareBlocksTopToBottom
      );
    }

    const spanning =
      [
        ...detection
          .spanningBlocks,
      ].sort(
        compareBlocksTopToBottom
      );

    const regular =
      detection.blocks.filter(
        (
          block
        ) =>
          block.columnIndex !==
          -1
      );

    const emitted =
      new Set<
        LayoutBlock
      >();

    const result:
      LayoutBlock[] = [];

    for (
      const spanningBlock of
        spanning
    ) {
      const spanningTop =
        bboxTop(
          spanningBlock.bbox
        );

      const region =
        regular.filter(
          (
            block
          ) =>
            !emitted.has(
              block
            ) &&
            bboxTop(
              block.bbox
            ) >
              spanningTop
        );

      const orderedRegion =
        orderBlockColumns(
          region
        );

      for (
        const block of
          orderedRegion
      ) {
        emitted.add(
          block
        );

        result.push(
          block
        );
      }

      result.push(
        spanningBlock
      );
    }

    const remaining =
      regular.filter(
        (
          block
        ) =>
          !emitted.has(
            block
          )
      );

    result.push(
      ...orderBlockColumns(
        remaining
      )
    );

    return result;
  }
}

function chooseReadingMode(
  rowAgreement:
    number,

  columnAgreement:
    number,

  parallelRatio:
    number
): ReadingMode {
  /*
   * Cuando el content stream favorece
   * claramente uno de los órdenes,
   * aprovechamos esa evidencia.
   */
  if (
    rowAgreement >=
    columnAgreement +
      0.06
  ) {
    return "row-major";
  }

  if (
    columnAgreement >=
    rowAgreement +
      0.06
  ) {
    return "column-major";
  }

  /*
   * Si ambas opciones tienen una
   * coherencia similar, utilizamos
   * evidencia geométrica.
   *
   * Muchas líneas paralelas indican
   * tabla/grid más que columnas
   * editoriales independientes.
   */
  if (
    parallelRatio >=
    0.24
  ) {
    return "row-major";
  }

  return "column-major";
}

function calculateParallelRowRatio(
  rows:
    LineRow[]
): number {
  const totalLines =
    rows.reduce(
      (
        total,
        row
      ) =>
        total +
        row.lines.length,
      0
    );

  if (
    totalLines ===
    0
  ) {
    return 0;
  }

  const parallelLines =
    rows.reduce(
      (
        total,
        row
      ) => {
        if (
          row.lines.length <
          2
        ) {
          return total;
        }

        return (
          total +
          row.lines.length
        );
      },
      0
    );

  return (
    parallelLines /
    totalLines
  );
}

function calculateSourceOrderAgreement(
  lines:
    LayoutLine[]
): number {
  if (
    lines.length <=
    1
  ) {
    return 1;
  }

  let comparisons = 0;

  let ordered = 0;

  for (
    let index = 1;
    index <
    lines.length;
    index += 1
  ) {
    const previous =
      lines[
        index - 1
      ];

    const current =
      lines[index];

    comparisons += 1;

    if (
      current.sourceOrder >=
      previous.sourceOrder
    ) {
      ordered += 1;
    }
  }

  if (
    comparisons ===
    0
  ) {
    return 1;
  }

  return (
    ordered /
    comparisons
  );
}

function joinParallelLines(
  lines:
    LayoutLine[]
): string {
  let result = "";

  for (
    const line of lines
  ) {
    const text =
      line.text.trim();

    if (
      text.length ===
      0
    ) {
      continue;
    }

    if (
      result.length ===
      0
    ) {
      result =
        text;

      continue;
    }

    if (
      /^[,.;:!?%)\]}]/.test(
        text
      )
    ) {
      result +=
        text;

      continue;
    }

    result +=
      ` ${text}`;
  }

  return result.trim();
}

function orderBlockColumns(
  blocks:
    LayoutBlock[]
): LayoutBlock[] {
  const groups =
    new Map<
      number,
      LayoutBlock[]
    >();

  for (
    const block of blocks
  ) {
    const column =
      block.columnIndex ??
      0;

    const group =
      groups.get(
        column
      ) ??
      [];

    group.push(
      block
    );

    groups.set(
      column,
      group
    );
  }

  const columns =
    [...groups.keys()].sort(
      (
        left,
        right
      ) =>
        left -
        right
    );

  const result:
    LayoutBlock[] = [];

  for (
    const column of
      columns
  ) {
    const columnBlocks =
      groups.get(
        column
      ) ??
      [];

    columnBlocks.sort(
      compareBlocksTopToBottom
    );

    result.push(
      ...columnBlocks
    );
  }

  return result;
}

function compareBlocksTopToBottom(
  left:
    LayoutBlock,

  right:
    LayoutBlock
): number {
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

function compareLinesTopToBottom(
  left:
    LayoutLine,

  right:
    LayoutLine
): number {
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

function buildBlockText(
  blocks:
    LayoutBlock[]
): string {
  return blocks
    .map(
      (
        block
      ) =>
        block.text.trim()
    )
    .filter(
      Boolean
    )
    .join(
      "\n\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim()
    .normalize(
      "NFC"
    );
}