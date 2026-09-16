import type {
    PdfBoundingBox,
  } from "../types";
  
  export function bboxRight(
    bbox: PdfBoundingBox
  ): number {
    return (
      bbox.x +
      bbox.width
    );
  }
  
  export function bboxTop(
    bbox: PdfBoundingBox
  ): number {
    return (
      bbox.y +
      bbox.height
    );
  }
  
  export function bboxCenterX(
    bbox: PdfBoundingBox
  ): number {
    return (
      bbox.x +
      bbox.width / 2
    );
  }
  
  export function bboxCenterY(
    bbox: PdfBoundingBox
  ): number {
    return (
      bbox.y +
      bbox.height / 2
    );
  }
  
  export function unionBoundingBoxes(
    boxes: PdfBoundingBox[]
  ): PdfBoundingBox {
    if (
      boxes.length === 0
    ) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    }
  
    const minX =
      Math.min(
        ...boxes.map(
          (box) =>
            box.x
        )
      );
  
    const minY =
      Math.min(
        ...boxes.map(
          (box) =>
            box.y
        )
      );
  
    const maxX =
      Math.max(
        ...boxes.map(
          bboxRight
        )
      );
  
    const maxY =
      Math.max(
        ...boxes.map(
          bboxTop
        )
      );
  
    return {
      x: minX,
      y: minY,
      width:
        maxX -
        minX,
      height:
        maxY -
        minY,
    };
  }
  
  export function horizontalOverlap(
    left: PdfBoundingBox,
    right: PdfBoundingBox
  ): number {
    const start =
      Math.max(
        left.x,
        right.x
      );
  
    const end =
      Math.min(
        bboxRight(
          left
        ),
        bboxRight(
          right
        )
      );
  
    return Math.max(
      0,
      end - start
    );
  }
  
  export function horizontalOverlapRatio(
    left: PdfBoundingBox,
    right: PdfBoundingBox
  ): number {
    const overlap =
      horizontalOverlap(
        left,
        right
      );
  
    const denominator =
      Math.min(
        left.width,
        right.width
      );
  
    if (
      denominator <= 0
    ) {
      return 0;
    }
  
    return (
      overlap /
      denominator
    );
  }
  
  export function verticalOverlap(
    left: PdfBoundingBox,
    right: PdfBoundingBox
  ): number {
    const start =
      Math.max(
        left.y,
        right.y
      );
  
    const end =
      Math.min(
        bboxTop(
          left
        ),
        bboxTop(
          right
        )
      );
  
    return Math.max(
      0,
      end - start
    );
  }
  
  export function verticalOverlapRatio(
    left: PdfBoundingBox,
    right: PdfBoundingBox
  ): number {
    const overlap =
      verticalOverlap(
        left,
        right
      );
  
    const denominator =
      Math.min(
        left.height,
        right.height
      );
  
    if (
      denominator <= 0
    ) {
      return 0;
    }
  
    return (
      overlap /
      denominator
    );
  }
  
  export function median(
    values: number[]
  ): number {
    if (
      values.length ===
      0
    ) {
      return 0;
    }
  
    const sorted =
      [...values].sort(
        (
          left,
          right
        ) =>
          left -
          right
      );
  
    const middle =
      Math.floor(
        sorted.length /
        2
      );
  
    if (
      sorted.length %
        2 ===
      1
    ) {
      return sorted[
        middle
      ];
    }
  
    return (
      (
        sorted[
          middle - 1
        ] +
        sorted[
          middle
        ]
      ) /
      2
    );
  }
  
  export function average(
    values: number[]
  ): number {
    if (
      values.length ===
      0
    ) {
      return 0;
    }
  
    return (
      values.reduce(
        (
          total,
          value
        ) =>
          total +
          value,
        0
      ) /
      values.length
    );
  }