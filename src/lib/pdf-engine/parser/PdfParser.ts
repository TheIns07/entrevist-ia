import {
    BinaryReader,
  } from "../binary/BinaryReader";
  
  import {
    asciiBytes,
    bytesToLatin1,
    findForward,
  } from "../binary/ByteUtils";
  
  import {
    PDF_HEADER_PREFIX,
  } from "../constants";
  
  import {
    PdfEngineError,
  } from "../errors";
  
  import type {
    PdfIndirectObject,
    PdfObject,
    PdfParseResult,
    PdfReference,
    PdfWarning,
    PdfXrefEntry,
  } from "../types";
  
  import {
    isPdfDictionary,
    isPdfName,
    isPdfStream,
  } from "../types";
  
  import {
    PdfLexer,
  } from "./PdfLexer";
  
  import {
    PdfObjectParser,
  } from "./PdfObjectParser";
  
  import {
    PdfPageTree,
  } from "./PdfPageTree";
  
  import {
    PdfXrefParser,
  } from "./PdfXrefParser";
  
  const PDF_HEADER_BYTES =
    asciiBytes(
      PDF_HEADER_PREFIX
    );
  
  export class PdfParser {
    private readonly bytes:
      Uint8Array;
  
    private readonly objectCache =
      new Map<
        string,
        PdfIndirectObject
      >();
  
    private readonly resolvingObjects =
      new Set<string>();
  
    private readonly warnings:
      PdfWarning[] = [];
  
    private xref =
      new Map<
        number,
        PdfXrefEntry
      >();
  
    private parsed =
      false;
  
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
  
    parse(): PdfParseResult {
      if (
        this.bytes.length ===
        0
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "PDF file is empty."
        );
      }
  
      const version =
        this.readVersion();
  
      const xrefResult =
        new PdfXrefParser(
          this.bytes
        ).parse();
  
      this.xref =
        xrefResult.entries;
  
      this.warnings.push(
        ...xrefResult.warnings
      );
  
      /*
       * Cifrado fuera de alcance
       * de esta versión.
       */
      if (
        xrefResult.trailer
          .encrypt !==
        undefined
      ) {
        throw new PdfEngineError(
          "ENCRYPTED_PDF",
  
          "Encrypted PDFs are not supported by the current PDF engine."
        );
      }
  
      const root =
        xrefResult.trailer
          .root;
  
      if (!root) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "PDF trailer does not contain a /Root reference."
        );
      }
  
      this.parsed =
        true;
  
      const catalog =
        this.resolve(
          root
        );
  
      if (
        !isPdfDictionary(
          catalog
        )
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "PDF /Root does not resolve to a catalog dictionary.",
  
          {
            objectNumber:
              root.objectNumber,
          }
        );
      }
  
      const catalogType =
        catalog.entries.get(
          "Type"
        );
  
      if (
        catalogType !==
          undefined &&
        (
          !isPdfName(
            catalogType
          ) ||
          catalogType.value !==
            "Catalog"
        )
      ) {
        this.warnings.push({
          code:
            "MISSING_CATALOG",
  
          message:
            "The PDF /Root object does not declare /Type /Catalog; parsing will continue.",
  
          objectNumber:
            root.objectNumber,
        });
      }
  
      const pageTree =
        new PdfPageTree(
          (
            reference
          ) =>
            this.resolve(
              reference
            )
        );
  
      const pageTreeResult =
        pageTree.parse(
          root
        );
  
      this.warnings.push(
        ...pageTreeResult
          .warnings
      );
  
      return {
        version,
  
        byteLength:
          this.bytes.length,
  
        startXref:
          xrefResult.startXref,
  
        xref:
          new Map(
            this.xref
          ),
  
        trailer:
          xrefResult.trailer,
  
        pages:
          pageTreeResult.pages,
  
        warnings: [
          ...this.warnings,
        ],
      };
    }
  
    /*
     * Resolve una referencia:
     *
     * 12 0 R
     *
     * usando la tabla XRef.
     */
    resolve(
      reference:
        PdfReference
    ):
      | PdfObject
      | undefined {
      if (
        !this.parsed &&
        this.xref.size ===
          0
      ) {
        throw new PdfEngineError(
          "UNKNOWN",
  
          "PdfParser.resolve() cannot be used before the xref table is loaded."
        );
      }
  
      const key =
        `${reference.objectNumber}:${reference.generationNumber}`;
  
      const cached =
        this.objectCache.get(
          key
        );
  
      if (cached) {
        return cached.value;
      }
  
      const entry =
        this.xref.get(
          reference.objectNumber
        );
  
      if (
        !entry ||
        !entry.inUse ||
        entry.type !==
          "normal"
      ) {
        this.warnings.push({
          code:
            "MISSING_XREF_ENTRY",
  
          message:
            `No usable xref entry exists for object ${reference.objectNumber}.`,
  
          objectNumber:
            reference.objectNumber,
        });
  
        return undefined;
      }
  
      if (
        this.resolvingObjects.has(
          key
        )
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          `Circular indirect object reference at ${key}.`,
  
          {
            objectNumber:
              reference.objectNumber,
          }
        );
      }
  
      this.resolvingObjects.add(
        key
      );
  
      try {
        const indirectObject =
          this.parseIndirectObjectAt(
            entry.offset
          );
  
        if (
          indirectObject.objectNumber !==
          reference.objectNumber
        ) {
          throw new PdfEngineError(
            "CORRUPTED_XREF",
  
            `Xref entry ${reference.objectNumber} points to object ${indirectObject.objectNumber}.`,
  
            {
              objectNumber:
                reference.objectNumber,
  
              offset:
                entry.offset,
            }
          );
        }
  
        if (
          indirectObject.generationNumber !==
          reference.generationNumber
        ) {
          this.warnings.push({
            code:
              "MALFORMED_OBJECT",
  
            message:
              `Generation mismatch for object ${reference.objectNumber}; requested ${reference.generationNumber}, found ${indirectObject.generationNumber}.`,
  
            objectNumber:
              reference.objectNumber,
  
            offset:
              entry.offset,
          });
        }
  
        this.objectCache.set(
          key,
  
          indirectObject
        );
  
        this.warnIfObjectStream(
          indirectObject
        );
  
        return indirectObject.value;
      } finally {
        this.resolvingObjects.delete(
          key
        );
      }
    }
  
    getIndirectObject(
      reference:
        PdfReference
    ):
      | PdfIndirectObject
      | undefined {
      this.resolve(
        reference
      );
  
      return this.objectCache.get(
        `${reference.objectNumber}:${reference.generationNumber}`
      );
    }
  
    getWarnings(): PdfWarning[] {
      return [
        ...this.warnings,
      ];
    }
  
    private parseIndirectObjectAt(
      offset: number
    ): PdfIndirectObject {
      if (
        !Number.isInteger(
          offset
        ) ||
        offset < 0 ||
        offset >=
          this.bytes.length
      ) {
        throw new PdfEngineError(
          "CORRUPTED_XREF",
  
          "Xref object offset is outside the PDF.",
  
          {
            offset,
          }
        );
      }
  
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
  
      const objectParser =
        new PdfObjectParser(
          lexer,
  
          {
            resolveReference:
              (
                reference
              ) =>
                this.resolve(
                  reference
                ),
  
            onWarning:
              (
                warning
              ) =>
                this.warnings.push(
                  warning
                ),
          }
        );
  
      return objectParser.parseIndirectObject();
    }
  
    private readVersion(): string {
      const searchEnd =
        Math.min(
          this.bytes.length,
  
          1024
        );
  
      /*
       * Algunos lectores toleran
       * bytes antes de %PDF-.
       *
       * Buscamos sólo al comienzo,
       * no por todo el archivo.
       */
      const headerOffset =
        findForward(
          this.bytes,
  
          PDF_HEADER_BYTES,
  
          0,
  
          searchEnd
        );
  
      if (
        headerOffset <
        0
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "Missing %PDF-x.y header."
        );
      }
  
      const versionBytes =
        this.bytes.subarray(
          headerOffset +
            PDF_HEADER_BYTES.length,
  
          Math.min(
            headerOffset +
              PDF_HEADER_BYTES.length +
              3,
  
            this.bytes.length
          )
        );
  
      const versionText =
        bytesToLatin1(
          versionBytes
        );
  
      const match =
        versionText.match(
          /^(\d\.\d)/
        );
  
      if (!match) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "Invalid PDF version header.",
  
          {
            offset:
              headerOffset,
          }
        );
      }
  
      return match[1];
    }
  
    private warnIfObjectStream(
      object:
        PdfIndirectObject
    ): void {
      if (
        !isPdfStream(
          object.value
        )
      ) {
        return;
      }
  
      const type =
        object.value.dictionary
          .entries.get(
            "Type"
          );
  
      if (
        isPdfName(
          type
        ) &&
        type.value ===
          "ObjStm"
      ) {
        this.warnings.push({
          code:
            "UNSUPPORTED_OBJECT_STREAM",
  
          message:
            "An /ObjStm object was encountered. Phase 1 does not resolve compressed objects stored inside object streams.",
  
          objectNumber:
            object.objectNumber,
  
          offset:
            object.offset,
        });
      }
    }
  }