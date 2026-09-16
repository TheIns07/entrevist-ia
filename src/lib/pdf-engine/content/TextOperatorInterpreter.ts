import type {
    PdfArray,
    PdfGlyph,
    PdfName,
    PdfObject,
    PdfString,
    PdfWarning,
  } from "../types";
  
  import {
    isPdfArray,
    isPdfName,
    isPdfString,
  } from "../types";
  
  import {
    PdfFont,
  } from "../fonts/PdfFont";
  
  import type {
    PdfContentOperation,
  } from "./ContentStreamParser";
  
  import {
    TextState,
    type PdfMatrix,
    type TextStateSnapshot,
  } from "./TextState";
  
  export interface TextInterpretationResult {
    glyphs:
      PdfGlyph[];
  
    rawText:
      string;
  }
  
  export interface TextOperatorInterpreterOptions {
    pageNumber:
      number;
  
    fonts:
      Map<
        string,
        PdfFont
      >;
  
    onWarning?:
      (
        warning:
          PdfWarning
      ) => void;
  }
  
  export class TextOperatorInterpreter {
    private readonly pageNumber:
      number;
  
    private readonly fonts:
      Map<
        string,
        PdfFont
      >;
  
    private readonly onWarning?:
      (
        warning:
          PdfWarning
      ) => void;
  
    private readonly state =
      new TextState();

    private readonly graphicsStack:
      TextStateSnapshot[] =
      [];

    private readonly glyphs:
      PdfGlyph[] = [];
  
    private readonly textParts:
      string[] = [];
  
    private readonly missingFonts =
      new Set<string>();
  
    constructor(
      options:
        TextOperatorInterpreterOptions
    ) {
      this.pageNumber =
        options.pageNumber;
  
      this.fonts =
        options.fonts;
  
      this.onWarning =
        options.onWarning;
    }
  
    interpret(
      operations:
        PdfContentOperation[]
    ): TextInterpretationResult {
      for (
        const operation of
          operations
      ) {
        this.execute(
          operation
        );
      }
  
      return {
        glyphs: [
          ...this.glyphs,
        ],
  
        rawText:
          normalizeRawText(
            this.textParts.join(
              ""
            )
          ),
      };
    }
  
    private execute(
      operation:
        PdfContentOperation
    ): void {
      const operands =
        operation.operands;
  
      switch (
        operation.operator
      ) {
        case "q":
          this.graphicsStack.push(
            this.state.snapshot()
          );
          return;
  
        case "Q": {
          const snapshot =
            this.graphicsStack.pop();
  
          if (snapshot) {
            this.state.restore(
              snapshot
            );
          }
  
          return;
        }
  
        case "cm": {
          const numbers =
            readNumbers(
              operands,
              6
            );
  
          if (!numbers) {
            return;
          }
  
          this.state.concatCtm(
            numbers as PdfMatrix
          );
  
          return;
        }
  
        case "BT":
          this.state.beginText();
          return;
  
        case "ET":
          this.state.endText();
          this.appendLineBreak();
          return;
  
        case "Tf": {
          const fontName =
            asName(
              operands[
                operands.length -
                  2
              ]
            );
  
          const fontSize =
            asNumber(
              operands[
                operands.length -
                  1
              ]
            );
  
          if (
            !fontName ||
            fontSize ===
              undefined
          ) {
            return;
          }
  
          this.state.fontResourceName =
            fontName.value;
  
          this.state.fontSize =
            fontSize;
  
          const font =
            this.fonts.get(
              fontName.value
            );
  
          if (font) {
            this.state.font =
              font;
          } else {
            this.state.font =
              PdfFont.createFallback(
                fontName.value
              );
  
            if (
              !this.missingFonts.has(
                fontName.value
              )
            ) {
              this.missingFonts.add(
                fontName.value
              );
  
              this.onWarning?.({
                code:
                  "MISSING_FONT",
  
                message:
                  `Font /${fontName.value} is referenced by Tf but was not found in page resources.`,
  
                page:
                  this.pageNumber,
              });
            }
          }
  
          return;
        }
  
        case "Tc": {
          const value =
            lastNumber(
              operands
            );
  
          if (
            value !==
            undefined
          ) {
            this.state.charSpacing =
              value;
          }
  
          return;
        }
  
        case "Tw": {
          const value =
            lastNumber(
              operands
            );
  
          if (
            value !==
            undefined
          ) {
            this.state.wordSpacing =
              value;
          }
  
          return;
        }
  
        case "Tz": {
          const value =
            lastNumber(
              operands
            );
  
          if (
            value !==
            undefined
          ) {
            this.state.horizontalScaling =
              value /
              100;
          }
  
          return;
        }
  
        case "TL": {
          const value =
            lastNumber(
              operands
            );
  
          if (
            value !==
            undefined
          ) {
            this.state.leading =
              value;
          }
  
          return;
        }
  
        case "Ts": {
          const value =
            lastNumber(
              operands
            );
  
          if (
            value !==
            undefined
          ) {
            this.state.rise =
              value;
          }
  
          return;
        }
  
        case "Tm": {
          const numbers =
            readNumbers(
              operands,
              6
            );
  
          if (!numbers) {
            return;
          }
  
          this.state.setTextMatrix(
            numbers as PdfMatrix
          );
  
          this.appendLineBreak();
  
          return;
        }
  
        case "Td": {
          const numbers =
            readNumbers(
              operands,
              2
            );
  
          if (!numbers) {
            return;
          }
  
          this.state.moveTextPosition(
            numbers[0],
            numbers[1]
          );
  
          if (
            Math.abs(
              numbers[1]
            ) > 0.01
          ) {
            this.appendLineBreak();
          }
  
          return;
        }
  
        case "TD": {
          const numbers =
            readNumbers(
              operands,
              2
            );
  
          if (!numbers) {
            return;
          }
  
          this.state.leading =
            -numbers[1];
  
          this.state.moveTextPosition(
            numbers[0],
            numbers[1]
          );
  
          this.appendLineBreak();
  
          return;
        }
  
        case "T*":
          this.state.nextLine();
          this.appendLineBreak();
          return;
  
        case "Tj": {
          const string =
            lastString(
              operands
            );
  
          if (string) {
            this.showString(
              string
            );
          }
  
          return;
        }
  
        case "TJ": {
          const array =
            lastArray(
              operands
            );
  
          if (array) {
            this.showArray(
              array
            );
          }
  
          return;
        }
  
        case "'": {
          this.state.nextLine();
  
          this.appendLineBreak();
  
          const string =
            lastString(
              operands
            );
  
          if (string) {
            this.showString(
              string
            );
          }
  
          return;
        }
  
        case '"': {
          if (
            operands.length >=
            3
          ) {
            const wordSpacing =
              asNumber(
                operands[
                  operands.length -
                    3
                ]
              );
  
            const charSpacing =
              asNumber(
                operands[
                  operands.length -
                    2
                ]
              );
  
            if (
              wordSpacing !==
              undefined
            ) {
              this.state.wordSpacing =
                wordSpacing;
            }
  
            if (
              charSpacing !==
              undefined
            ) {
              this.state.charSpacing =
                charSpacing;
            }
          }
  
          this.state.nextLine();
  
          this.appendLineBreak();
  
          const string =
            lastString(
              operands
            );
  
          if (string) {
            this.showString(
              string
            );
          }
  
          return;
        }
  
        default:
          return;
      }
    }
  
    private showArray(
      array:
        PdfArray
    ): void {
      for (
        const item of
          array.items
      ) {
        if (
          isPdfString(
            item
          )
        ) {
          this.showString(
            item
          );
  
          continue;
        }
  
        if (
          typeof item ===
          "number"
        ) {
          const displacement =
            -item /
            1000 *
            this.state.fontSize *
            this.state.horizontalScaling;
  
          this.state.advanceText(
            displacement
          );
  
          /*
           * Separaciones grandes
           * suelen indicar palabras.
           * La reconstrucción real se
           * hará geométricamente en
           * FASE 3.
           */
          if (
            item <
            -150
          ) {
            this.appendSoftSpace();
          }
        }
      }
    }
  
    private showString(
      value:
        PdfString
    ): void {
      if (
        !this.state
          .inTextObject
      ) {
        return;
      }
  
      const font =
        this.state.font ??
        PdfFont.createFallback(
          this.state
            .fontResourceName
        );
  
      const decoded =
        font.decodeBytes(
          value.bytes
        );
  
      for (
        const decodedGlyph of
          decoded
      ) {
        const width1000 =
          font.getWidth(
            decodedGlyph.code
          );
  
        const bbox =
          this.state.getGlyphBoundingBox(
            width1000
          );
  
        const text =
          decodedGlyph.text.normalize(
            "NFC"
          );
  
        const visible =
          this.state.fontSize !==
            0 &&
          bbox.width >=
            0 &&
          bbox.height >=
            0;
  
        this.glyphs.push({
          text,
  
          page:
            this.pageNumber,
  
          bbox,
  
          font:
            font.displayName,
  
          fontSize:
            Math.abs(
              this.state.fontSize
            ),
  
          visible,
  
          confidence:
            decodedGlyph.confidence,
        });
  
        this.textParts.push(
          text
        );
  
        const glyphAdvance =
          (
            width1000 /
            1000
          ) *
          this.state.fontSize;
  
        const spacing =
          this.state.charSpacing +
          (
            decodedGlyph
              .isWordSpace
              ? this.state
                  .wordSpacing
              : 0
          );
  
        const advance =
          (
            glyphAdvance +
            spacing
          ) *
          this.state
            .horizontalScaling;
  
        this.state.advanceText(
          advance
        );
      }
    }
  
    private appendLineBreak():
      void {
      if (
        this.textParts.length ===
        0
      ) {
        return;
      }
  
      const last =
        this.textParts[
          this.textParts.length -
            1
        ];
  
      if (
        last.endsWith(
          "\n"
        )
      ) {
        return;
      }
  
      this.textParts.push(
        "\n"
      );
    }
  
    private appendSoftSpace():
      void {
      if (
        this.textParts.length ===
        0
      ) {
        return;
      }
  
      const last =
        this.textParts[
          this.textParts.length -
            1
        ];
  
      if (
        /\s$/.test(
          last
        )
      ) {
        return;
      }
  
      this.textParts.push(
        " "
      );
    }
  }
  
  function asNumber(
    value:
      | PdfObject
      | undefined
  ): number | undefined {
    return typeof value ===
      "number"
      ? value
      : undefined;
  }
  
  function asName(
    value:
      | PdfObject
      | undefined
  ): PdfName | undefined {
    return isPdfName(
      value
    )
      ? value
      : undefined;
  }
  
  function lastNumber(
    operands:
      PdfObject[]
  ): number | undefined {
    return asNumber(
      operands[
        operands.length -
          1
      ]
    );
  }
  
  function lastString(
    operands:
      PdfObject[]
  ): PdfString | undefined {
    for (
      let index =
        operands.length -
        1;
  
      index >= 0;
  
      index -= 1
    ) {
      if (
        isPdfString(
          operands[index]
        )
      ) {
        return operands[
          index
        ] as PdfString;
      }
    }
  
    return undefined;
  }
  
  function lastArray(
    operands:
      PdfObject[]
  ): PdfArray | undefined {
    for (
      let index =
        operands.length -
        1;
  
      index >= 0;
  
      index -= 1
    ) {
      if (
        isPdfArray(
          operands[index]
        )
      ) {
        return operands[
          index
        ] as PdfArray;
      }
    }
  
    return undefined;
  }
  
  function readNumbers(
    operands:
      PdfObject[],
  
    count: number
  ): number[] | undefined {
    if (
      operands.length <
      count
    ) {
      return undefined;
    }
  
    const values =
      operands.slice(
        operands.length -
          count
      );
  
    if (
      !values.every(
        (
          value
        ) =>
          typeof value ===
          "number"
      )
    ) {
      return undefined;
    }
  
    return values as number[];
  }
  
  function normalizeRawText(
    value: string
  ): string {
    return value
      .replace(
        /\u0000/g,
        ""
      )
      .replace(
        /[ \t]+\n/g,
        "\n"
      )
      .replace(
        /\n[ \t]+/g,
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