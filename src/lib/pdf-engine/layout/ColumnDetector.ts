import type {
    LayoutBlock,
    LayoutColumn,
    ColumnDetectionResult,
  } from "./types";
  
  import {
    average,
    bboxCenterX,
    bboxRight,
    unionBoundingBoxes,
  } from "./LayoutGeometry";
  
  interface XCluster {
    values: number[];
  
    blocks: LayoutBlock[];
  
    center: number;
  }
  
  export class ColumnDetector {
    detect(
      blocks: LayoutBlock[]
    ): ColumnDetectionResult {
      if (
        blocks.length ===
        0
      ) {
        return {
          columns: [],
          spanningBlocks: [],
          blocks: [],
          columnCount: 0,
        };
      }
  
      const pageBounds =
        unionBoundingBoxes(
          blocks.map(
            (
              block
            ) =>
              block.bbox
          )
        );
  
      const pageWidth =
        Math.max(
          pageBounds.width,
          1
        );
  
      /*
       * Bloques muy anchos pueden ser
       * títulos, encabezados o secciones
       * que atraviesan varias columnas.
       */
      const possibleSpanning =
        blocks.filter(
          (
            block
          ) =>
            block.bbox.width >=
            pageWidth *
              0.72
        );
  
      const candidates =
        blocks.filter(
          (
            block
          ) =>
            !possibleSpanning.includes(
              block
            )
        );
  
      if (
        candidates.length <
        4
      ) {
        return this.singleColumn(
          blocks
        );
      }
  
      const clusters =
        this.clusterBlocks(
          candidates,
          pageWidth
        );
  
      const significant =
        clusters
          .filter(
            (
              cluster
            ) =>
              cluster.blocks
                .length >=
              2
          )
          .sort(
            (
              left,
              right
            ) =>
              left.center -
              right.center
          );
  
      if (
        significant.length <=
        1
      ) {
        return this.singleColumn(
          blocks
        );
      }
  
      /*
       * Sólo consideramos realmente
       * distintas dos columnas cuando
       * sus anclajes horizontales están
       * suficientemente separados.
       */
      const separated:
        XCluster[] = [];
  
      for (
        const cluster of
          significant
      ) {
        if (
          separated.length ===
          0
        ) {
          separated.push(
            cluster
          );
  
          continue;
        }
  
        const previous =
          separated[
            separated.length -
              1
          ];
  
        if (
          cluster.center -
            previous.center >=
          pageWidth *
            0.18
        ) {
          separated.push(
            cluster
          );
        } else if (
          cluster.blocks
            .length >
          previous.blocks
            .length
        ) {
          separated[
            separated.length -
              1
          ] =
            cluster;
        }
      }
  
      if (
        separated.length <=
        1
      ) {
        return this.singleColumn(
          blocks
        );
      }
  
      /*
       * Para CVs nos interesa soportar
       * 2 o 3 columnas. Más de tres
       * normalmente representa
       * fragmentación o tablas.
       */
      const columnAnchors =
        separated
          .slice(
            0,
            3
          )
          .map(
            (
              cluster
            ) =>
              cluster.center
          );
  
      const detectedBlocks =
        blocks.map(
          (
            block
          ) => ({
            ...block,
          })
        );
  
      const spanningBlocks:
        LayoutBlock[] = [];
  
      const columnBlocks =
        new Map<
          number,
          LayoutBlock[]
        >();
  
      for (
        let index = 0;
        index <
        columnAnchors.length;
        index += 1
      ) {
        columnBlocks.set(
          index,
          []
        );
      }
  
      for (
        const block of
          detectedBlocks
      ) {
        if (
          block.bbox.width >=
          pageWidth *
            0.72
        ) {
          block.columnIndex =
            -1;
  
          spanningBlocks.push(
            block
          );
  
          continue;
        }
  
        const blockAnchor =
          block.bbox.x;
  
        let bestColumn = 0;
  
        let bestDistance =
          Number.POSITIVE_INFINITY;
  
        for (
          let index = 0;
          index <
          columnAnchors.length;
          index += 1
        ) {
          const distance =
            Math.abs(
              blockAnchor -
              columnAnchors[
                index
              ]
            );
  
          if (
            distance <
            bestDistance
          ) {
            bestDistance =
              distance;
  
            bestColumn =
              index;
          }
        }
  
        block.columnIndex =
          bestColumn;
  
        columnBlocks
          .get(
            bestColumn
          )
          ?.push(
            block
          );
      }
  
      const columns:
        LayoutColumn[] =
          [];
  
      for (
        let index = 0;
        index <
        columnAnchors.length;
        index += 1
      ) {
        const assigned =
          columnBlocks.get(
            index
          ) ??
          [];
  
        if (
          assigned.length ===
          0
        ) {
          continue;
        }
  
        columns.push({
          index,
  
          bbox:
            unionBoundingBoxes(
              assigned.map(
                (
                  block
                ) =>
                  block.bbox
              )
            ),
  
          blocks:
            assigned,
        });
      }
  
      if (
        columns.length <=
        1
      ) {
        return this.singleColumn(
          blocks
        );
      }
  
      return {
        columns,
  
        spanningBlocks,
  
        blocks:
          detectedBlocks,
  
        columnCount:
          columns.length,
      };
    }
  
    private clusterBlocks(
      blocks:
        LayoutBlock[],
  
      pageWidth:
        number
    ): XCluster[] {
      const tolerance =
        Math.max(
          pageWidth *
            0.09,
          18
        );
  
      const sorted =
        [...blocks].sort(
          (
            left,
            right
          ) =>
            left.bbox.x -
            right.bbox.x
        );
  
      const clusters:
        XCluster[] = [];
  
      for (
        const block of sorted
      ) {
        const x =
          block.bbox.x;
  
        let selected:
          XCluster | undefined;
  
        let distance =
          Number.POSITIVE_INFINITY;
  
        for (
          const cluster of
            clusters
        ) {
          const currentDistance =
            Math.abs(
              cluster.center -
              x
            );
  
          if (
            currentDistance <=
              tolerance &&
            currentDistance <
              distance
          ) {
            distance =
              currentDistance;
  
            selected =
              cluster;
          }
        }
  
        if (!selected) {
          clusters.push({
            values: [
              x,
            ],
  
            blocks: [
              block,
            ],
  
            center: x,
          });
  
          continue;
        }
  
        selected.values.push(
          x
        );
  
        selected.blocks.push(
          block
        );
  
        selected.center =
          average(
            selected.values
          );
      }
  
      return clusters;
    }
  
    private singleColumn(
      blocks:
        LayoutBlock[]
    ): ColumnDetectionResult {
      const normalized =
        blocks.map(
          (
            block
          ) => ({
            ...block,
  
            columnIndex:
              0,
          })
        );
  
      return {
        columns: [
          {
            index: 0,
  
            bbox:
              unionBoundingBoxes(
                normalized.map(
                  (
                    block
                  ) =>
                    block.bbox
                )
              ),
  
            blocks:
              normalized,
          },
        ],
  
        spanningBlocks: [],
  
        blocks:
          normalized,
  
        columnCount: 1,
      };
    }
  }
  
  /*
   * Estas funciones se mantienen aquí
   * para facilitar extensiones futuras
   * del detector geométrico.
   */
  export function getBlockCenterX(
    block: LayoutBlock
  ): number {
    return bboxCenterX(
      block.bbox
    );
  }
  
  export function getBlockRight(
    block: LayoutBlock
  ): number {
    return bboxRight(
      block.bbox
    );
  }