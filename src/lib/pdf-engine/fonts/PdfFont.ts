import {
    bytesToInteger,
  } from "./CMapParser";
  
  import {
    FontEncoding,
  } from "./FontEncoding";
  
  import {
    ToUnicodeMap,
  } from "./ToUnicodeParser";
  
  export interface PdfDecodedGlyph {
    code: number;
  
    byteLength: number;
  
    text: string;
  
    confidence: number;
  
    isWordSpace: boolean;
  }
  
  export interface PdfFontOptions {
    resourceName: string;
  
    subtype?: string;
  
    baseFont?: string;
  
    encoding:
      FontEncoding;
  
    toUnicode?:
      ToUnicodeMap;
  
    codeBytes: number;
  
    widths?: Map<
      number,
      number
    >;
  
    defaultWidth?: number;
  }
  
  export class PdfFont {
    readonly resourceName:
      string;
  
    readonly subtype?:
      string;
  
    readonly baseFont?:
      string;
  
    readonly encoding:
      FontEncoding;
  
    readonly toUnicode?:
      ToUnicodeMap;
  
    readonly codeBytes:
      number;
  
    private readonly widths:
      Map<number, number>;
  
    private readonly defaultWidth:
      number;
  
    constructor(
      options:
        PdfFontOptions
    ) {
      this.resourceName =
        options.resourceName;
  
      this.subtype =
        options.subtype;
  
      this.baseFont =
        options.baseFont;
  
      this.encoding =
        options.encoding;
  
      this.toUnicode =
        options.toUnicode;
  
      this.codeBytes =
        Math.max(
          1,
          options.codeBytes
        );
  
      this.widths =
        options.widths ??
        new Map();
  
      this.defaultWidth =
        options.defaultWidth ??
        (
          this.codeBytes >
          1
            ? 1000
            : 500
        );
    }
  
    get displayName(): string {
      return (
        this.baseFont ??
        this.resourceName
      );
    }
  
    get hasToUnicode(): boolean {
      return Boolean(
        this.toUnicode
      );
    }
  
    getWidth(
      code: number
    ): number {
      return (
        this.widths.get(
          code
        ) ??
        this.defaultWidth
      );
    }
  
    decodeBytes(
      bytes: Uint8Array
    ): PdfDecodedGlyph[] {
      const result:
        PdfDecodedGlyph[] = [];
  
      let offset = 0;
  
      while (
        offset <
        bytes.length
      ) {
        if (
          this.toUnicode
        ) {
          const decoded =
            this.toUnicode.readNextCode(
              bytes,
              offset,
              this.codeBytes
            );
  
          let text =
            decoded.unicode;
  
          let confidence =
            0.98;
  
          if (
            text ===
              undefined
          ) {
            text =
              this.decodeFallback(
                decoded.code
              );
  
            confidence =
              text !==
              undefined
                ? 0.62
                : 0.15;
          }
  
          result.push({
            code:
              decoded.code,
  
            byteLength:
              decoded.byteLength,
  
            text:
              text ??
              "�",
  
            confidence,
  
            isWordSpace:
              decoded.code ===
                0x20 ||
              text === " ",
          });
  
          offset +=
            Math.max(
              decoded.byteLength,
              1
            );
  
          continue;
        }
  
        const remaining =
          bytes.length -
          offset;
  
        const length =
          Math.min(
            this.codeBytes,
            remaining
          );
  
        const slice =
          bytes.subarray(
            offset,
            offset +
              length
          );
  
        const code =
          bytesToInteger(
            slice
          );
  
        const fallback =
          this.decodeFallback(
            code
          );
  
        result.push({
          code,
  
          byteLength:
            length,
  
          text:
            fallback ??
            "�",
  
          confidence:
            fallback
              ? 0.58
              : 0.12,
  
          isWordSpace:
            code ===
              0x20 ||
            fallback === " ",
        });
  
        offset +=
          length;
      }
  
      return result;
    }
  
    private decodeFallback(
      code: number
    ): string | undefined {
      /*
       * Las encodings simples
       * sólo operan sobre bytes.
       */
      if (
        code <= 0xff
      ) {
        return this.encoding.decode(
          code
        );
      }
  
      /*
       * Identity-H/V sin
       * ToUnicode.
       *
       * No inventamos contenido.
       */
      return undefined;
    }
  
    static createFallback(
      resourceName =
        "Unknown"
    ): PdfFont {
      return new PdfFont({
        resourceName,
  
        encoding:
          new FontEncoding(
            "WinAnsiEncoding"
          ),
  
        codeBytes: 1,
  
        defaultWidth:
          500,
      });
    }
  }