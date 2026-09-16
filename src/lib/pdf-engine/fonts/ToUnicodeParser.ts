import {
    bytesToInteger,
    CMapParser,
    type PdfCodeSpaceRange,
  } from "./CMapParser";
  
  export interface PdfUnicodeCode {
    code: number;
  
    byteLength: number;
  
    unicode?: string;
  }
  
  export class ToUnicodeMap {
    private readonly mappings =
      new Map<
        string,
        string
      >();

    private readonly codeLengths:
      number[];

    readonly codeSpaceRanges:
      PdfCodeSpaceRange[];

    constructor(
      mappings:
        Array<{
          source:
          Uint8Array;

          unicode:
          string;
        }>,

      codeSpaceRanges:
        PdfCodeSpaceRange[]
    ) {
      this.codeSpaceRanges =
        codeSpaceRanges;
      for (
        const mapping of
          mappings
      ) {
        this.mappings.set(
          createKey(
            mapping.source
          ),
          mapping.unicode
        );
      }
  
      const lengths =
        new Set<number>();
  
      for (
        const range of
          codeSpaceRanges
      ) {
        lengths.add(
          range.start.length
        );
      }
  
      for (
        const mapping of
          mappings
      ) {
        lengths.add(
          mapping.source.length
        );
      }
  
      this.codeLengths =
        [
          ...lengths,
        ].sort(
          (
            left,
            right
          ) =>
            right -
            left
        );
    }
  
    lookup(
      codeBytes:
        Uint8Array
    ): string | undefined {
      return this.mappings.get(
        createKey(
          codeBytes
        )
      );
    }
  
    readNextCode(
      bytes: Uint8Array,
      offset: number,
      fallbackLength:
        number
    ): PdfUnicodeCode {
      for (
        const length of
          this.codeLengths
      ) {
        if (
          offset +
            length >
          bytes.length
        ) {
          continue;
        }
  
        const candidate =
          bytes.subarray(
            offset,
            offset +
              length
          );
  
        if (
          this.isInCodeSpace(
            candidate
          )
        ) {
          return {
            code:
              bytesToInteger(
                candidate
              ),
  
            byteLength:
              length,
  
            unicode:
              this.lookup(
                candidate
              ),
          };
        }
      }
  
      const safeLength =
        Math.min(
          Math.max(
            fallbackLength,
            1
          ),
          bytes.length -
            offset
        );
  
      const candidate =
        bytes.subarray(
          offset,
          offset +
            safeLength
        );
  
      return {
        code:
          bytesToInteger(
            candidate
          ),
  
        byteLength:
          safeLength,
  
        unicode:
          this.lookup(
            candidate
          ),
      };
    }
  
    private isInCodeSpace(
      candidate:
        Uint8Array
    ): boolean {
      const ranges =
        this.codeSpaceRanges.filter(
          (
            range
          ) =>
            range.start
              .length ===
            candidate.length
        );
  
      /*
       * Algunos ToUnicode no
       * declaran codespaces.
       */
      if (
        ranges.length ===
        0
      ) {
        return this.mappings.has(
          createKey(
            candidate
          )
        );
      }
  
      const value =
        bytesToInteger(
          candidate
        );
  
      return ranges.some(
        (
          range
        ) => {
          const start =
            bytesToInteger(
              range.start
            );
  
          const end =
            bytesToInteger(
              range.end
            );
  
          return (
            value >=
              start &&
            value <=
              end
          );
        }
      );
    }
  }
  
  export class ToUnicodeParser {
    static parse(
      bytes: Uint8Array
    ): ToUnicodeMap {
      const cmap =
        CMapParser.parse(
          bytes
        );
  
      const mappings =
        cmap.mappings.map(
          (
            mapping
          ) => ({
            source:
              mapping.source,
  
            unicode:
              decodeUtf16Be(
                mapping.destination
              ),
          })
        );
  
      return new ToUnicodeMap(
        mappings,
        cmap.codeSpaceRanges
      );
    }
  }
  
  function createKey(
    bytes: Uint8Array
  ): string {
    let result =
      `${bytes.length}:`;
  
    for (
      const byte of bytes
    ) {
      result +=
        byte
          .toString(16)
          .padStart(
            2,
            "0"
          )
          .toUpperCase();
    }
  
    return result;
  }
  
  function decodeUtf16Be(
    bytes: Uint8Array
  ): string {
    if (
      bytes.length ===
      0
    ) {
      return "";
    }
  
    const codeUnits:
      number[] = [];
  
    let offset = 0;
  
    if (
      bytes.length >= 2 &&
      bytes[0] ===
        0xfe &&
      bytes[1] ===
        0xff
    ) {
      offset = 2;
    }
  
    for (
      let index =
        offset;
  
      index + 1 <
      bytes.length;
  
      index += 2
    ) {
      codeUnits.push(
        (
          bytes[index] <<
          8
        ) |
          bytes[
            index + 1
          ]
      );
    }
  
    /*
     * Algunos productores emiten
     * destino de un solo byte.
     */
    if (
      codeUnits.length ===
        0 &&
      bytes.length === 1
    ) {
      return String.fromCharCode(
        bytes[0]
      );
    }
  
    return String
      .fromCharCode(
        ...codeUnits
      )
      .replace(
        /^\uFEFF/,
        ""
      )
      .normalize(
        "NFC"
      );
  }