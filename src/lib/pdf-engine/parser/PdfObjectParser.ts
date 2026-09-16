import {
  asciiBytes,
  findForward,
  trimTrailingLineBreak,
} from "../binary/ByteUtils";

import {
  MAX_PDF_OBJECT_DEPTH,
} from "../constants";

import {
  PdfEngineError,
} from "../errors";

import type {
  PdfArray,
  PdfDictionary,
  PdfIndirectObject,
  PdfObject,
  PdfObjectParserOptions,
  PdfReference,
  PdfStream,
  PdfWarning,
} from "../types";

import {
  isPdfReference,
} from "../types";

import {
  PdfLexer,
} from "./PdfLexer";

const ENDSTREAM_BYTES =
  asciiBytes(
    "endstream"
  );

export class PdfObjectParser {
  private readonly resolveReference?:
    PdfObjectParserOptions["resolveReference"];

  private readonly onWarning?:
    PdfObjectParserOptions["onWarning"];

  private readonly lexer:
    PdfLexer;

  constructor(
    lexer:
      PdfLexer,

    _options:
      PdfObjectParserOptions = {}
  ) {
    this.lexer =
      lexer;
  }

  parseValue(
    depth = 0
  ): PdfObject {
    if (
      depth >
      MAX_PDF_OBJECT_DEPTH
    ) {
      throw new PdfEngineError(
        "INVALID_PDF",

        "PDF object nesting limit exceeded.",

        {
          offset:
            this.lexer
              .position,

          details: {
            maxDepth:
              MAX_PDF_OBJECT_DEPTH,
          },
        }
      );
    }

    const token =
      this.lexer.nextToken();

    switch (
    token.type
    ) {
      case "number":
        return this.parseNumberOrReference(
          token.value as number
        );

      case "name":
        return {
          type: "name",

          value:
            token.value as string,
        };

      case "string":
        return {
          type: "string",

          bytes:
            token.value as Uint8Array,

          literal: true,
        };

      case "hexString":
        return {
          type: "string",

          bytes:
            token.value as Uint8Array,

          literal: false,
        };

      case "arrayStart":
        return this.parseArray(
          depth + 1
        );

      case "dictStart":
        return this.parseDictionary(
          depth + 1
        );

      case "keyword":
        return this.parseKeyword(
          token.value as string
        );

      case "eof":
        throw new PdfEngineError(
          "INVALID_PDF",

          "Unexpected end of PDF while parsing an object.",

          {
            offset:
              token.start,
          }
        );

      case "arrayEnd":
      case "dictEnd":
        throw new PdfEngineError(
          "INVALID_PDF",

          `Unexpected ${token.type} while parsing a PDF object.`,

          {
            offset:
              token.start,
          }
        );

      default:
        throw new PdfEngineError(
          "INVALID_PDF",

          "Unknown PDF token.",

          {
            offset:
              token.start,
          }
        );
    }
  }

  parseIndirectObject(): PdfIndirectObject {
    const offset =
      this.lexer.position;

    const objectNumberToken =
      this.lexer.nextToken();

    const generationToken =
      this.lexer.nextToken();

    const objToken =
      this.lexer.nextToken();

    if (
      objectNumberToken.type !==
      "number" ||
      generationToken.type !==
      "number" ||
      objToken.type !==
      "keyword" ||
      objToken.value !==
      "obj"
    ) {
      throw new PdfEngineError(
        "INVALID_PDF",

        "Invalid indirect PDF object header.",

        {
          offset,
        }
      );
    }

    const objectNumber =
      objectNumberToken.value as number;

    const generationNumber =
      generationToken.value as number;

    if (
      !Number.isInteger(
        objectNumber
      ) ||
      !Number.isInteger(
        generationNumber
      )
    ) {
      throw new PdfEngineError(
        "INVALID_PDF",

        "Indirect PDF object numbers must be integers.",

        {
          offset,
        }
      );
    }

    let value =
      this.parseValue();

    const afterValue =
      this.lexer.position;

    const next =
      this.lexer.nextToken();

    if (
      typeof value ===
      "object" &&
      value !== null &&
      value.type ===
      "dictionary" &&
      next.type ===
      "keyword" &&
      next.value ===
      "stream"
    ) {
      value =
        this.parseStream(
          value,

          objectNumber
        );
    } else {
      this.lexer.position =
        afterValue;
    }

    const endObjectToken =
      this.lexer.nextToken();

    if (
      endObjectToken.type !==
      "keyword" ||
      endObjectToken.value !==
      "endobj"
    ) {
      this.warn({
        code:
          "MALFORMED_OBJECT",

        message:
          `Object ${objectNumber} does not end with endobj at the expected position.`,

        objectNumber,

        offset:
          endObjectToken.start,
      });

      this.lexer.position =
        endObjectToken.start;
    }

    return {
      objectNumber,

      generationNumber,

      value,

      offset,
    };
  }

  private parseNumberOrReference(
    firstNumber: number
  ): PdfObject {
    const afterFirst =
      this.lexer.position;

    const secondToken =
      this.lexer.nextToken();

    if (
      secondToken.type ===
      "number" &&
      Number.isInteger(
        firstNumber
      ) &&
      Number.isInteger(
        secondToken.value as number
      )
    ) {
      const thirdToken =
        this.lexer.nextToken();

      if (
        thirdToken.type ===
        "keyword" &&
        thirdToken.value ===
        "R"
      ) {
        return {
          type:
            "reference",

          objectNumber:
            firstNumber,

          generationNumber:
            secondToken.value as number,
        } satisfies PdfReference;
      }
    }

    /*
     * No era referencia.
     * Volvemos justo después
     * del primer número.
     */
    this.lexer.position =
      afterFirst;

    return firstNumber;
  }

  private parseArray(
    depth: number
  ): PdfArray {
    const items:
      PdfObject[] = [];

    while (true) {
      const beforeToken =
        this.lexer.position;

      const token =
        this.lexer.nextToken();

      if (
        token.type ===
        "arrayEnd"
      ) {
        return {
          type: "array",

          items,
        };
      }

      if (
        token.type ===
        "eof"
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",

          "Unterminated PDF array.",

          {
            offset:
              beforeToken,
          }
        );
      }

      this.lexer.position =
        beforeToken;

      items.push(
        this.parseValue(
          depth
        )
      );
    }
  }

  private parseDictionary(
    depth: number
  ): PdfDictionary {
    const entries =
      new Map<
        string,
        PdfObject
      >();

    while (true) {
      const token =
        this.lexer.nextToken();

      if (
        token.type ===
        "dictEnd"
      ) {
        return {
          type:
            "dictionary",

          entries,
        };
      }

      if (
        token.type ===
        "eof"
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",

          "Unterminated PDF dictionary.",

          {
            offset:
              token.start,
          }
        );
      }

      if (
        token.type !==
        "name"
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",

          "PDF dictionary key must be a name.",

          {
            offset:
              token.start,
          }
        );
      }

      const key =
        token.value as string;

      entries.set(
        key,

        this.parseValue(
          depth
        )
      );
    }
  }

  private parseKeyword(
    keyword: string
  ): PdfObject {
    switch (keyword) {
      case "true":
        return true;

      case "false":
        return false;

      case "null":
        return null;

      default:
        return {
          type:
            "keyword",

          value:
            keyword,
        };
    }
  }

  private parseStream(
    dictionary:
      PdfDictionary,

    objectNumber:
      number
  ): PdfStream {
    this.consumeStreamLineEnding(
      objectNumber
    );

    const dataStart =
      this.lexer.position;

    const declaredLength =
      this.resolveStreamLength(
        dictionary.entries.get(
          "Length"
        )
      );

    /*
     * Primera opción:
     *
     * confiar en /Length,
     * que es la forma correcta
     * según el estándar.
     */
    if (
      declaredLength !==
      undefined
    ) {
      const dataEnd =
        dataStart +
        declaredLength;

      if (
        dataEnd <=
        this.lexer.data
          .length
      ) {
        const streamData =
          this.lexer.data.subarray(
            dataStart,

            dataEnd
          );

        this.lexer.position =
          dataEnd;

        const endStreamToken =
          this.lexer.nextToken();

        if (
          endStreamToken.type ===
          "keyword" &&
          endStreamToken.value ===
          "endstream"
        ) {
          return {
            type:
              "stream",

            dictionary,

            data:
              streamData,
          };
        }

        this.warn({
          code:
            "STREAM_LENGTH_MISMATCH",

          message:
            `Stream length for object ${objectNumber} does not land on endstream; falling back to marker search.`,

          objectNumber,

          offset:
            dataStart,

          details: {
            declaredLength,
          },
        });
      } else {
        this.warn({
          code:
            "STREAM_LENGTH_MISMATCH",

          message:
            `Stream length for object ${objectNumber} exceeds the PDF byte length.`,

          objectNumber,

          offset:
            dataStart,

          details: {
            declaredLength,
          },
        });
      }
    }

    /*
     * Fallback para PDFs
     * dañados o /Length
     * indirecto irresoluble.
     */
    return this.parseStreamByMarker(
      dictionary,

      objectNumber,

      dataStart
    );
  }

  private parseStreamByMarker(
    dictionary:
      PdfDictionary,

    objectNumber:
      number,

    dataStart:
      number
  ): PdfStream {
    const endStreamOffset =
      findForward(
        this.lexer.data,

        ENDSTREAM_BYTES,

        dataStart
      );

    if (
      endStreamOffset <
      0
    ) {
      throw new PdfEngineError(
        "INVALID_PDF",

        `Missing endstream for object ${objectNumber}.`,

        {
          objectNumber,

          offset:
            dataStart,
        }
      );
    }

    this.warn({
      code:
        "STREAM_LENGTH_FALLBACK",

      message:
        `Stream ${objectNumber} was parsed by searching for endstream because a usable /Length was unavailable.`,

      objectNumber,

      offset:
        dataStart,
    });

    const raw =
      this.lexer.data.subarray(
        dataStart,

        endStreamOffset
      );

    const streamData =
      trimTrailingLineBreak(
        raw
      );

    this.lexer.position =
      endStreamOffset;

    const endStreamToken =
      this.lexer.nextToken();

    if (
      endStreamToken.type !==
      "keyword" ||
      endStreamToken.value !==
      "endstream"
    ) {
      throw new PdfEngineError(
        "INVALID_PDF",

        `Could not consume endstream for object ${objectNumber}.`,

        {
          objectNumber,

          offset:
            endStreamOffset,
        }
      );
    }

    return {
      type:
        "stream",

      dictionary,

      data:
        streamData,
    };
  }

  private consumeStreamLineEnding(
    objectNumber:
      number
  ): void {
    const byte =
      this.lexer.data[
      this.lexer.position
      ];

    /*
     * CR / CRLF
     */
    if (
      byte === 0x0d
    ) {
      this.lexer.position +=
        1;

      if (
        this.lexer.data[
        this.lexer.position
        ] === 0x0a
      ) {
        this.lexer.position +=
          1;
      }

      return;
    }

    /*
     * LF
     */
    if (
      byte === 0x0a
    ) {
      this.lexer.position +=
        1;

      return;
    }

    this.warn({
      code:
        "MALFORMED_OBJECT",

      message:
        `Stream ${objectNumber} is not followed by the required line ending.`,

      objectNumber,

      offset:
        this.lexer.position,
    });

    /*
     * Algunos generadores
     * introducen espacios
     * antes del EOL.
     */
    while (
      this.lexer.position <
      this.lexer.data
        .length &&
      (
        this.lexer.data[
        this.lexer.position
        ] === 0x20 ||
        this.lexer.data[
        this.lexer.position
        ] === 0x09
      )
    ) {
      this.lexer.position +=
        1;
    }

    const afterSpaces =
      this.lexer.data[
      this.lexer.position
      ];

    if (
      afterSpaces ===
      0x0d
    ) {
      this.lexer.position +=
        1;

      if (
        this.lexer.data[
        this.lexer.position
        ] === 0x0a
      ) {
        this.lexer.position +=
          1;
      }
    } else if (
      afterSpaces ===
      0x0a
    ) {
      this.lexer.position +=
        1;
    }
  }

  private resolveStreamLength(
    value:
      | PdfObject
      | undefined
  ):
    | number
    | undefined {
    if (
      typeof value ===
      "number" &&
      Number.isInteger(
        value
      ) &&
      value >= 0
    ) {
      return value;
    }

    if (
      isPdfReference(
        value
      ) &&
      this.resolveReference
    ) {
      const resolved =
        this.resolveReference(
          value
        );

      if (
        typeof resolved ===
        "number" &&
        Number.isInteger(
          resolved
        ) &&
        resolved >= 0
      ) {
        return resolved;
      }
    }

    return undefined;
  }

  private warn(
    warning:
      PdfWarning
  ): void {
    this.onWarning?.(
      warning
    );
  }
}