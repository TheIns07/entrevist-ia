import type {
    PdfBoundingBox,
  } from "../types";
  
  import type {
    PdfFont,
  } from "../fonts/PdfFont";
  
  export type PdfMatrix = [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  
  export const IDENTITY_MATRIX:
    PdfMatrix = [
      1,
      0,
      0,
      1,
      0,
      0,
    ];
  
  export interface PdfPoint {
    x: number;
    y: number;
  }
  
  export interface TextStateSnapshot {
    fontResourceName?:
      string;
  
    font?:
      PdfFont;
  
    fontSize:
      number;
  
    charSpacing:
      number;
  
    wordSpacing:
      number;
  
    horizontalScaling:
      number;
  
    leading:
      number;
  
    rise:
      number;
  
    textMatrix:
      PdfMatrix;
  
    lineMatrix:
      PdfMatrix;
  
    ctm:
      PdfMatrix;
  
    inTextObject:
      boolean;
  }
  
  export class TextState {
    fontResourceName?:
      string;
  
    font?:
      PdfFont;
  
    fontSize = 0;
  
    charSpacing = 0;
  
    wordSpacing = 0;
  
    horizontalScaling = 1;
  
    leading = 0;
  
    rise = 0;
  
    textMatrix:
      PdfMatrix = [
        ...IDENTITY_MATRIX,
      ];
  
    lineMatrix:
      PdfMatrix = [
        ...IDENTITY_MATRIX,
      ];
  
    ctm:
      PdfMatrix = [
        ...IDENTITY_MATRIX,
      ];
  
    inTextObject =
      false;
  
    beginText(): void {
      this.inTextObject =
        true;
  
      this.textMatrix = [
        ...IDENTITY_MATRIX,
      ];
  
      this.lineMatrix = [
        ...IDENTITY_MATRIX,
      ];
    }
  
    endText(): void {
      this.inTextObject =
        false;
    }
  
    setTextMatrix(
      matrix:
        PdfMatrix
    ): void {
      this.textMatrix = [
        ...matrix,
      ];
  
      this.lineMatrix = [
        ...matrix,
      ];
    }
  
    moveTextPosition(
      tx: number,
      ty: number
    ): void {
      this.lineMatrix =
        multiplyMatrices(
          this.lineMatrix,
  
          translationMatrix(
            tx,
            ty
          )
        );
  
      this.textMatrix = [
        ...this.lineMatrix,
      ];
    }
  
    nextLine(): void {
      this.moveTextPosition(
        0,
        -this.leading
      );
    }
  
    advanceText(
      distance: number
    ): void {
      this.textMatrix =
        multiplyMatrices(
          this.textMatrix,
  
          translationMatrix(
            distance,
            0
          )
        );
    }
  
    concatCtm(
      matrix:
        PdfMatrix
    ): void {
      this.ctm =
        multiplyMatrices(
          this.ctm,
          matrix
        );
    }
  
    getGlyphBoundingBox(
      width1000:
        number
    ): PdfBoundingBox {
      const glyphWidth =
        (
          width1000 /
          1000
        ) *
        this.fontSize *
        this.horizontalScaling;
  
      const height =
        Math.abs(
          this.fontSize
        );
  
      const corners =
        [
          {
            x: 0,
            y:
              this.rise,
          },
  
          {
            x:
              glyphWidth,
            y:
              this.rise,
          },
  
          {
            x: 0,
            y:
              this.rise +
              height,
          },
  
          {
            x:
              glyphWidth,
            y:
              this.rise +
              height,
          },
        ].map(
          (
            point
          ) => {
            const textPoint =
              transformPoint(
                this.textMatrix,
                point
              );
  
            return transformPoint(
              this.ctm,
              textPoint
            );
          }
        );
  
      const xs =
        corners.map(
          (
            point
          ) =>
            point.x
        );
  
      const ys =
        corners.map(
          (
            point
          ) =>
            point.y
        );
  
      const minX =
        Math.min(
          ...xs
        );
  
      const maxX =
        Math.max(
          ...xs
        );
  
      const minY =
        Math.min(
          ...ys
        );
  
      const maxY =
        Math.max(
          ...ys
        );
  
      return {
        x:
          minX,
  
        y:
          minY,
  
        width:
          maxX -
          minX,
  
        height:
          maxY -
          minY,
      };
    }
  
    snapshot():
      TextStateSnapshot {
      return {
        fontResourceName:
          this.fontResourceName,
  
        font:
          this.font,
  
        fontSize:
          this.fontSize,
  
        charSpacing:
          this.charSpacing,
  
        wordSpacing:
          this.wordSpacing,
  
        horizontalScaling:
          this.horizontalScaling,
  
        leading:
          this.leading,
  
        rise:
          this.rise,
  
        textMatrix: [
          ...this.textMatrix,
        ],
  
        lineMatrix: [
          ...this.lineMatrix,
        ],
  
        ctm: [
          ...this.ctm,
        ],
  
        inTextObject:
          this.inTextObject,
      };
    }
  
    restore(
      snapshot:
        TextStateSnapshot
    ): void {
      this.fontResourceName =
        snapshot.fontResourceName;
  
      this.font =
        snapshot.font;
  
      this.fontSize =
        snapshot.fontSize;
  
      this.charSpacing =
        snapshot.charSpacing;
  
      this.wordSpacing =
        snapshot.wordSpacing;
  
      this.horizontalScaling =
        snapshot.horizontalScaling;
  
      this.leading =
        snapshot.leading;
  
      this.rise =
        snapshot.rise;
  
      this.textMatrix = [
        ...snapshot.textMatrix,
      ];
  
      this.lineMatrix = [
        ...snapshot.lineMatrix,
      ];
  
      this.ctm = [
        ...snapshot.ctm,
      ];
  
      this.inTextObject =
        snapshot.inTextObject;
    }
  }
  
  export function translationMatrix(
    x: number,
    y: number
  ): PdfMatrix {
    return [
      1,
      0,
      0,
      1,
      x,
      y,
    ];
  }
  
  export function multiplyMatrices(
    left:
      PdfMatrix,
  
    right:
      PdfMatrix
  ): PdfMatrix {
    const [
      a1,
      b1,
      c1,
      d1,
      e1,
      f1,
    ] = left;
  
    const [
      a2,
      b2,
      c2,
      d2,
      e2,
      f2,
    ] = right;
  
    return [
      a1 * a2 +
        c1 * b2,
  
      b1 * a2 +
        d1 * b2,
  
      a1 * c2 +
        c1 * d2,
  
      b1 * c2 +
        d1 * d2,
  
      a1 * e2 +
        c1 * f2 +
        e1,
  
      b1 * e2 +
        d1 * f2 +
        f1,
    ];
  }
  
  export function transformPoint(
    matrix:
      PdfMatrix,
  
    point:
      PdfPoint
  ): PdfPoint {
    const [
      a,
      b,
      c,
      d,
      e,
      f,
    ] = matrix;
  
    return {
      x:
        a *
          point.x +
        c *
          point.y +
        e,
  
      y:
        b *
          point.x +
        d *
          point.y +
        f,
    };
  }