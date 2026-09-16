import {
    BinaryReader,
  } from "../binary/BinaryReader";
  
  import {
    decodePdfName,
    hexDigitValue,
    isAsciiDigit,
    isHexDigit,
    isPdfDelimiter,
    isPdfRegularCharacter,
    isPdfWhitespace,
  } from "../binary/ByteUtils";
  
  import {
    PdfEngineError,
  } from "../errors";
  
  import type {
    PdfLexerToken,
  } from "../types";
  
  export class PdfLexer {
    private readonly reader:
      BinaryReader;
  
    constructor(
      reader:
        BinaryReader
    ) {
      this.reader =
        reader;
    }
  
    get position(): number {
      return (
        this.reader.position
      );
    }
  
    set position(
      value: number
    ) {
      this.reader.seek(
        value
      );
    }
  
    get data(): Uint8Array {
      return this.reader.data;
    }
  
    nextToken(): PdfLexerToken {
      this.skipWhitespaceAndComments();
  
      const start =
        this.reader.position;
  
      const byte =
        this.reader.peekByte();
  
      if (
        byte === undefined
      ) {
        return {
          type: "eof",
  
          start,
  
          end: start,
        };
      }
  
      switch (byte) {
        /*
         * [
         */
        case 0x5b:
          this.reader.skip(1);
  
          return {
            type:
              "arrayStart",
  
            start,
  
            end:
              this.reader
                .position,
          };
  
        /*
         * ]
         */
        case 0x5d:
          this.reader.skip(1);
  
          return {
            type:
              "arrayEnd",
  
            start,
  
            end:
              this.reader
                .position,
          };
  
        /*
         * /
         */
        case 0x2f:
          return this.readName();
  
        /*
         * (
         */
        case 0x28:
          return this.readLiteralString();
  
        /*
         * < o <<
         */
        case 0x3c:
          if (
            this.reader.peekByte(
              1
            ) === 0x3c
          ) {
            this.reader.skip(
              2
            );
  
            return {
              type:
                "dictStart",
  
              start,
  
              end:
                this.reader
                  .position,
            };
          }
  
          return this.readHexString();
  
        /*
         * > o >>
         */
        case 0x3e:
          if (
            this.reader.peekByte(
              1
            ) === 0x3e
          ) {
            this.reader.skip(
              2
            );
  
            return {
              type:
                "dictEnd",
  
              start,
  
              end:
                this.reader
                  .position,
            };
          }
  
          throw new PdfEngineError(
            "INVALID_PDF",
  
            "Unexpected '>' token in PDF.",
  
            {
              offset: start,
            }
          );
  
        default:
          if (
            this.canStartNumber(
              byte
            )
          ) {
            return this.readNumberOrKeyword();
          }
  
          return this.readKeyword();
      }
    }
  
    skipWhitespaceAndComments(): void {
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.peekByte();
  
        if (
          byte === undefined
        ) {
          return;
        }
  
        if (
          isPdfWhitespace(
            byte
          )
        ) {
          this.reader.skip(
            1
          );
  
          continue;
        }
  
        /*
         * %
         */
        if (
          byte === 0x25
        ) {
          this.skipComment();
  
          continue;
        }
  
        return;
      }
    }
  
    private skipComment(): void {
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.readByte();
  
        if (
          byte === 0x0a
        ) {
          return;
        }
  
        if (
          byte === 0x0d
        ) {
          if (
            this.reader.peekByte() ===
            0x0a
          ) {
            this.reader.skip(
              1
            );
          }
  
          return;
        }
      }
    }
  
    private readName(): PdfLexerToken {
      const start =
        this.reader.position;
  
      /*
       * /
       */
      this.reader.skip(1);
  
      const nameStart =
        this.reader.position;
  
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.peekByte();
  
        if (
          byte ===
            undefined ||
          isPdfWhitespace(
            byte
          ) ||
          isPdfDelimiter(
            byte
          )
        ) {
          break;
        }
  
        this.reader.skip(
          1
        );
      }
  
      const raw =
        this.reader.slice(
          nameStart,
  
          this.reader.position
        );
  
      return {
        type: "name",
  
        value:
          decodePdfName(
            raw
          ),
  
        start,
  
        end:
          this.reader
            .position,
      };
    }
  
    private readLiteralString(): PdfLexerToken {
      const start =
        this.reader.position;
  
      /*
       * (
       */
      this.reader.skip(1);
  
      const output:
        number[] = [];
  
      let depth = 1;
  
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.readByte();
  
        /*
         * Escape
         */
        if (
          byte === 0x5c
        ) {
          this.readStringEscape(
            output
          );
  
          continue;
        }
  
        /*
         * Nested (
         */
        if (
          byte === 0x28
        ) {
          depth += 1;
  
          output.push(
            byte
          );
  
          continue;
        }
  
        /*
         * )
         */
        if (
          byte === 0x29
        ) {
          depth -= 1;
  
          if (
            depth === 0
          ) {
            return {
              type: "string",
  
              value:
                Uint8Array.from(
                  output
                ),
  
              start,
  
              end:
                this.reader
                  .position,
            };
          }
  
          output.push(
            byte
          );
  
          continue;
        }
  
        output.push(
          byte
        );
      }
  
      throw new PdfEngineError(
        "INVALID_PDF",
  
        "Unterminated literal string in PDF.",
  
        {
          offset: start,
        }
      );
    }
  
    private readStringEscape(
      output: number[]
    ): void {
      if (
        this.reader.eof
      ) {
        return;
      }
  
      const escaped =
        this.reader.readByte();
  
      switch (escaped) {
        /*
         * \n
         */
        case 0x6e:
          output.push(
            0x0a
          );
  
          return;
  
        /*
         * \r
         */
        case 0x72:
          output.push(
            0x0d
          );
  
          return;
  
        /*
         * \t
         */
        case 0x74:
          output.push(
            0x09
          );
  
          return;
  
        /*
         * \b
         */
        case 0x62:
          output.push(
            0x08
          );
  
          return;
  
        /*
         * \f
         */
        case 0x66:
          output.push(
            0x0c
          );
  
          return;
  
        /*
         * (
         * )
         * \
         */
        case 0x28:
        case 0x29:
        case 0x5c:
          output.push(
            escaped
          );
  
          return;
  
        /*
         * Continuación de línea LF
         */
        case 0x0a:
          return;
  
        /*
         * Continuación CR o CRLF
         */
        case 0x0d:
          if (
            this.reader.peekByte() ===
            0x0a
          ) {
            this.reader.skip(
              1
            );
          }
  
          return;
  
        default:
          break;
      }
  
      /*
       * Escape octal:
       *
       * \053
       */
      if (
        escaped >= 0x30 &&
        escaped <= 0x37
      ) {
        let octal =
          escaped -
          0x30;
  
        let consumed =
          1;
  
        while (
          consumed < 3 &&
          !this.reader.eof
        ) {
          const next =
            this.reader.peekByte();
  
          if (
            next ===
              undefined ||
            next < 0x30 ||
            next > 0x37
          ) {
            break;
          }
  
          octal =
            (
              octal << 3
            ) +
            (
              next -
              0x30
            );
  
          consumed += 1;
  
          this.reader.skip(
            1
          );
        }
  
        output.push(
          octal &
          0xff
        );
  
        return;
      }
  
      output.push(
        escaped
      );
    }
  
    private readHexString(): PdfLexerToken {
      const start =
        this.reader.position;
  
      /*
       * <
       */
      this.reader.skip(1);
  
      const nibbles:
        number[] = [];
  
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.readByte();
  
        /*
         * >
         */
        if (
          byte === 0x3e
        ) {
          /*
           * PDF permite número impar
           * de nibbles. El último se
           * completa con 0.
           */
          if (
            nibbles.length %
              2 !==
            0
          ) {
            nibbles.push(
              0
            );
          }
  
          const output =
            new Uint8Array(
              nibbles.length /
                2
            );
  
          for (
            let index = 0;
  
            index <
            nibbles.length;
  
            index += 2
          ) {
            output[
              index / 2
            ] =
              (
                nibbles[
                  index
                ] << 4
              ) |
              nibbles[
                index + 1
              ];
          }
  
          return {
            type:
              "hexString",
  
            value:
              output,
  
            start,
  
            end:
              this.reader
                .position,
          };
        }
  
        if (
          isPdfWhitespace(
            byte
          )
        ) {
          continue;
        }
  
        if (
          !isHexDigit(
            byte
          )
        ) {
          throw new PdfEngineError(
            "INVALID_PDF",
  
            "Invalid hexadecimal string in PDF.",
  
            {
              offset:
                this.reader
                  .position -
                1,
            }
          );
        }
  
        nibbles.push(
          hexDigitValue(
            byte
          )
        );
      }
  
      throw new PdfEngineError(
        "INVALID_PDF",
  
        "Unterminated hexadecimal string in PDF.",
  
        {
          offset: start,
        }
      );
    }
  
    private readNumberOrKeyword(): PdfLexerToken {
      const start =
        this.reader.position;
  
      let sawDigit =
        false;
  
      let sawDot =
        false;
  
      const first =
        this.reader.peekByte();
  
      if (
        first === 0x2b ||
        first === 0x2d
      ) {
        this.reader.skip(
          1
        );
      }
  
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.peekByte();
  
        if (
          byte === undefined
        ) {
          break;
        }
  
        if (
          isAsciiDigit(
            byte
          )
        ) {
          sawDigit =
            true;
  
          this.reader.skip(
            1
          );
  
          continue;
        }
  
        if (
          byte === 0x2e &&
          !sawDot
        ) {
          sawDot =
            true;
  
          this.reader.skip(
            1
          );
  
          continue;
        }
  
        break;
      }
  
      if (!sawDigit) {
        this.reader.seek(
          start
        );
  
        return this.readKeyword();
      }
  
      const raw =
        this.reader.slice(
          start,
  
          this.reader.position
        );
  
      let numericText =
        "";
  
      for (
        const byte of raw
      ) {
        numericText +=
          String.fromCharCode(
            byte
          );
      }
  
      const value =
        Number(
          numericText
        );
  
      if (
        !Number.isFinite(
          value
        )
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          `Invalid number '${numericText}' in PDF.`,
  
          {
            offset:
              start,
          }
        );
      }
  
      return {
        type: "number",
  
        value,
  
        start,
  
        end:
          this.reader
            .position,
      };
    }
  
    private readKeyword(): PdfLexerToken {
      const start =
        this.reader.position;
  
      while (
        !this.reader.eof
      ) {
        const byte =
          this.reader.peekByte();
  
        if (
          byte ===
            undefined ||
          !isPdfRegularCharacter(
            byte
          )
        ) {
          break;
        }
  
        this.reader.skip(
          1
        );
      }
  
      if (
        this.reader.position ===
        start
      ) {
        const byte =
          this.reader.peekByte();
  
        throw new PdfEngineError(
          "INVALID_PDF",
  
          `Unexpected byte 0x${(
            byte ?? 0
          )
            .toString(16)
            .padStart(
              2,
              "0"
            )} in PDF.`,
  
          {
            offset:
              start,
          }
        );
      }
  
      const raw =
        this.reader.slice(
          start,
  
          this.reader.position
        );
  
      let value = "";
  
      for (
        const byte of raw
      ) {
        value +=
          String.fromCharCode(
            byte
          );
      }
  
      return {
        type:
          "keyword",
  
        value,
  
        start,
  
        end:
          this.reader
            .position,
      };
    }
  
    private canStartNumber(
      byte: number
    ): boolean {
      return (
        isAsciiDigit(
          byte
        ) ||
        byte === 0x2b ||
        byte === 0x2d ||
        byte === 0x2e
      );
    }
  }