import type {
    PdfArray,
    PdfDictionary,
    PdfObject,
    PdfReference,
    PdfTrailerInfo,
  } from "../types";
  
  import {
    isPdfArray,
    isPdfReference,
  } from "../types";
  
  export class PdfTrailerParser {
    static parse(
      dictionary:
        PdfDictionary
    ): PdfTrailerInfo {
      const entries =
        dictionary.entries;
  
      return {
        dictionary,
  
        root:
          this.asReference(
            entries.get(
              "Root"
            )
          ),
  
        info:
          this.asReference(
            entries.get(
              "Info"
            )
          ),
  
        encrypt:
          entries.get(
            "Encrypt"
          ),
  
        id:
          this.asArray(
            entries.get(
              "ID"
            )
          ),
  
        size:
          this.asNonNegativeInteger(
            entries.get(
              "Size"
            )
          ),
  
        previousOffset:
          this.asNonNegativeInteger(
            entries.get(
              "Prev"
            )
          ),
  
        xrefStreamOffset:
          this.asNonNegativeInteger(
            entries.get(
              "XRefStm"
            )
          ),
      };
    }
  
    private static asReference(
      value:
        | PdfObject
        | undefined
    ):
      | PdfReference
      | undefined {
      return isPdfReference(
        value
      )
        ? value
        : undefined;
    }
  
    private static asArray(
      value:
        | PdfObject
        | undefined
    ):
      | PdfArray
      | undefined {
      return isPdfArray(
        value
      )
        ? value
        : undefined;
    }
  
    private static asNonNegativeInteger(
      value:
        | PdfObject
        | undefined
    ):
      | number
      | undefined {
      return (
        typeof value ===
          "number" &&
        Number.isInteger(
          value
        ) &&
        value >= 0
      )
        ? value
        : undefined;
    }
  }