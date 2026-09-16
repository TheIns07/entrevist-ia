import {
    BinaryReader,
  } from "../binary/BinaryReader";
  
  import {
    asciiBytes,
    bytesToLatin1,
    findBackward,
  } from "../binary/ByteUtils";
  
  import {
    MAX_INCREMENTAL_XREF_SECTIONS,
    PDF_STARTXREF_KEYWORD,
    STARTXREF_SEARCH_WINDOW_BYTES,
  } from "../constants";
  
  import {
    PdfEngineError,
  } from "../errors";
  
  import type {
    PdfTrailerInfo,
    PdfWarning,
    PdfXrefEntry,
    PdfXrefSection,
  } from "../types";
  
  import {
    isPdfDictionary,
  } from "../types";
  
  import {
    PdfLexer,
  } from "./PdfLexer";
  
  import {
    PdfObjectParser,
  } from "./PdfObjectParser";
  
  import {
    PdfTrailerParser,
  } from "./PdfTrailerParser";
  
  const STARTXREF_BYTES =
    asciiBytes(
      PDF_STARTXREF_KEYWORD
    );
  
  export interface PdfXrefParseResult {
    startXref: number;
  
    entries: Map<
      number,
      PdfXrefEntry
    >;
  
    trailer:
      PdfTrailerInfo;
  
    sections:
      PdfXrefSection[];
  
    warnings:
      PdfWarning[];
  }
  
  export class PdfXrefParser {
    private readonly bytes:
      Uint8Array;
  
    private readonly warnings:
      PdfWarning[] = [];
  
    constructor(
      source:
        | ArrayBuffer
        | Uint8Array
    ) {
      this.bytes =
        source instanceof
        Uint8Array
          ? source
          : new Uint8Array(
              source
            );
    }
  
    parse(): PdfXrefParseResult {
      const startXref =
        this.findStartXref();
  
      const mergedEntries =
        new Map<
          number,
          PdfXrefEntry
        >();
  
      const sections:
        PdfXrefSection[] = [];
  
      const visitedOffsets =
        new Set<number>();
  
      let currentOffset:
        | number
        | undefined =
        startXref;
  
      let latestTrailer:
        | PdfTrailerInfo
        | undefined;
  
      let sectionCount =
        0;
  
      /*
       * Soporta incremental updates
       * mediante /Prev.
       */
      while (
        currentOffset !==
        undefined
      ) {
        if (
          visitedOffsets.has(
            currentOffset
          )
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            "Circular /Prev chain in PDF xref tables.",
  
            {
              offset:
                currentOffset,
            }
          );
        }
  
        if (
          sectionCount >=
          MAX_INCREMENTAL_XREF_SECTIONS
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            "Too many incremental xref sections in PDF.",
  
            {
              details: {
                maxSections:
                  MAX_INCREMENTAL_XREF_SECTIONS,
              },
            }
          );
        }
  
        visitedOffsets.add(
          currentOffset
        );
  
        sectionCount += 1;
  
        const section =
          this.parseTraditionalSection(
            currentOffset
          );
  
        sections.push(
          section
        );
  
        /*
         * Procesamos desde el xref
         * más nuevo al más antiguo.
         *
         * No sobrescribir significa
         * que gana la versión nueva.
         */
        for (
          const [
            objectNumber,
            entry,
          ] of section.entries
        ) {
          if (
            !mergedEntries.has(
              objectNumber
            )
          ) {
            mergedEntries.set(
              objectNumber,
  
              entry
            );
          }
        }
  
        const trailer =
          PdfTrailerParser.parse(
            section.trailer
          );
  
        latestTrailer ??=
          trailer;
  
        if (
          trailer.xrefStreamOffset !==
          undefined
        ) {
          this.warnings.push({
            code:
              "HYBRID_XREF_NOT_SUPPORTED",
  
            message:
              "This PDF contains /XRefStm. Phase 1 reads the traditional xref table but does not parse the supplemental xref stream.",
  
            offset:
              trailer.xrefStreamOffset,
          });
        }
  
        currentOffset =
          trailer.previousOffset;
      }
  
      if (
        !latestTrailer
      ) {
        throw new PdfEngineError(
          "CORRUPTED_XREF",
  
          "PDF trailer was not found."
        );
      }
  
      return {
        startXref,
  
        entries:
          mergedEntries,
  
        trailer:
          latestTrailer,
  
        sections,
  
        warnings: [
          ...this.warnings,
        ],
      };
    }
  
    private findStartXref(): number {
      const searchStart =
        Math.max(
          0,
  
          this.bytes.length -
            STARTXREF_SEARCH_WINDOW_BYTES
        );
  
      const keywordOffset =
        findBackward(
          this.bytes,
  
          STARTXREF_BYTES,
  
          this.bytes.length -
            STARTXREF_BYTES.length,
  
          searchStart
        );
  
      if (
        keywordOffset <
        0
      ) {
        throw new PdfEngineError(
          "CORRUPTED_XREF",
  
          "Could not find startxref in PDF."
        );
      }
  
      let cursor =
        keywordOffset +
        STARTXREF_BYTES.length;
  
      while (
        cursor <
          this.bytes
            .length &&
        this.isWhitespace(
          this.bytes[
            cursor
          ]
        )
      ) {
        cursor += 1;
      }
  
      const numberStart =
        cursor;
  
      while (
        cursor <
          this.bytes
            .length &&
        this.bytes[
          cursor
        ] >= 0x30 &&
        this.bytes[
          cursor
        ] <= 0x39
      ) {
        cursor += 1;
      }
  
      if (
        cursor ===
        numberStart
      ) {
        throw new PdfEngineError(
          "CORRUPTED_XREF",
  
          "startxref does not contain a byte offset.",
  
          {
            offset:
              keywordOffset,
          }
        );
      }
  
      const value =
        Number(
          bytesToLatin1(
            this.bytes.subarray(
              numberStart,
  
              cursor
            )
          )
        );
  
      if (
        !Number.isSafeInteger(
          value
        ) ||
        value < 0 ||
        value >=
          this.bytes.length
      ) {
        throw new PdfEngineError(
          "CORRUPTED_XREF",
  
          "startxref points outside the PDF.",
  
          {
            offset:
              keywordOffset,
  
            details: {
              startXref:
                value,
  
              byteLength:
                this.bytes
                  .length,
            },
          }
        );
      }
  
      return value;
    }
  
    private parseTraditionalSection(
      offset: number
    ): PdfXrefSection {
      const reader =
        new BinaryReader(
          this.bytes
        );
  
      reader.seek(
        offset
      );
  
      const lexer =
        new PdfLexer(
          reader
        );
  
      const firstToken =
        lexer.nextToken();
  
      /*
       * Si startxref apunta a:
       *
       * 15 0 obj
       * << /Type /XRef ... >>
       *
       * estamos ante XRef Stream.
       */
      if (
        firstToken.type !==
          "keyword" ||
        firstToken.value !==
          "xref"
      ) {
        this.warnings.push({
          code:
            "UNSUPPORTED_XREF_STREAM",
  
          message:
            "startxref points to an xref stream or another unsupported xref structure. Phase 1 supports traditional xref tables only.",
  
          offset,
        });
  
        throw new PdfEngineError(
          "UNSUPPORTED_PDF",
  
          "Xref streams are not supported in Phase 1.",
  
          {
            offset,
  
            details: {
              feature:
                "xref-stream",
            },
          }
        );
      }
  
      const entries =
        new Map<
          number,
          PdfXrefEntry
        >();
  
      while (true) {
        const token =
          lexer.nextToken();
  
        if (
          token.type ===
            "keyword" &&
          token.value ===
            "trailer"
        ) {
          const objectParser =
            new PdfObjectParser(
              lexer
            );
  
          const trailerObject =
            objectParser.parseValue();
  
          if (
            !isPdfDictionary(
              trailerObject
            )
          ) {
            throw new PdfEngineError(
              "CORRUPTED_XREF",
  
              "PDF trailer is not a dictionary.",
  
              {
                offset:
                  token.start,
              }
            );
          }
  
          const trailerInfo =
            PdfTrailerParser.parse(
              trailerObject
            );
  
          return {
            offset,
  
            entries,
  
            trailer:
              trailerObject,
  
            previousOffset:
              trailerInfo.previousOffset,
          };
        }
  
        if (
          token.type ===
          "eof"
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            "Unexpected end of PDF xref table.",
  
            {
              offset:
                token.start,
            }
          );
        }
  
        /*
         * Inicio subsección:
         *
         * 0 15
         */
        if (
          token.type !==
            "number" ||
          !Number.isInteger(
            token.value as number
          )
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            "Invalid xref subsection start object number.",
  
            {
              offset:
                token.start,
            }
          );
        }
  
        const firstObjectNumber =
          token.value as number;
  
        const countToken =
          lexer.nextToken();
  
        if (
          countToken.type !==
            "number" ||
          !Number.isInteger(
            countToken.value as number
          ) ||
          (
            countToken.value as number
          ) < 0
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            "Invalid xref subsection entry count.",
  
            {
              offset:
                countToken.start,
            }
          );
        }
  
        const count =
          countToken.value as number;
  
        for (
          let index = 0;
  
          index < count;
  
          index += 1
        ) {
          const offsetToken =
            lexer.nextToken();
  
          const generationToken =
            lexer.nextToken();
  
          const statusToken =
            lexer.nextToken();
  
          const objectNumber =
            firstObjectNumber +
            index;
  
          const valid =
            offsetToken.type ===
              "number" &&
            generationToken.type ===
              "number" &&
            statusToken.type ===
              "keyword" &&
            (
              statusToken.value ===
                "n" ||
              statusToken.value ===
                "f"
            ) &&
            Number.isInteger(
              offsetToken.value as number
            ) &&
            Number.isInteger(
              generationToken.value as number
            );
  
          if (!valid) {
            this.warnings.push({
              code:
                "MALFORMED_XREF_ENTRY",
  
              message:
                `Malformed xref entry for object ${objectNumber}.`,
  
              objectNumber,
  
              offset:
                offsetToken.start,
            });
  
            throw new PdfEngineError(
              "CORRUPTED_XREF",
  
              `Malformed xref entry for object ${objectNumber}.`,
  
              {
                objectNumber,
  
                offset:
                  offsetToken.start,
              }
            );
          }
  
          const entryOffset =
            offsetToken.value as number;
  
          const generationNumber =
            generationToken.value as number;
  
          const inUse =
            statusToken.value ===
            "n";
  
          entries.set(
            objectNumber,
  
            {
              objectNumber,
  
              generationNumber,
  
              offset:
                entryOffset,
  
              type:
                inUse
                  ? "normal"
                  : "free",
  
              inUse,
            }
          );
        }
      }
    }
  
    private isWhitespace(
      byte: number
    ): boolean {
      return (
        byte === 0x00 ||
        byte === 0x09 ||
        byte === 0x0a ||
        byte === 0x0c ||
        byte === 0x0d ||
        byte === 0x20
      );
    }
  }