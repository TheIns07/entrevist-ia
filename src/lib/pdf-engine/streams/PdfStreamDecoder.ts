import {
    PdfEngineError,
  } from "../errors";
  
  import type {
    PdfDictionary,
    PdfName,
    PdfObject,
    PdfStream,
    PdfStreamDecodeOptions,
    PdfWarning,
  } from "../types";
  
  import {
    isPdfArray,
    isPdfDictionary,
    isPdfName,
    isPdfReference,
  } from "../types";
  
  import {
    FlateDecoder,
  } from "./FlateDecoder";
  
  export class PdfStreamDecoder {
    private readonly resolveReference?:
      PdfStreamDecodeOptions["resolveReference"];
  
    private readonly onWarning?:
      PdfStreamDecodeOptions["onWarning"];
  
    constructor(
      options:
        PdfStreamDecodeOptions = {}
    ) {
      this.resolveReference =
        options.resolveReference;
  
      this.onWarning =
        options.onWarning;
    }
  
    async decode(
      stream:
        PdfStream
    ): Promise<Uint8Array> {
      const filters =
        this.getFilters(
          stream.dictionary
            .entries.get(
              "Filter"
            )
        );
  
      /*
       * Stream sin filtro.
       */
      if (
        filters.length ===
        0
      ) {
        return stream.data;
      }
  
      this.assertSupportedDecodeParameters(
        stream.dictionary,
  
        filters
      );
  
      let decoded =
        stream.data;
  
      /*
       * Los filtros se aplican
       * secuencialmente.
       */
      for (
        const filter of
          filters
      ) {
        switch (
          filter.value
        ) {
          case "FlateDecode":
          case "Fl":
            decoded =
              await FlateDecoder.decode(
                decoded
              );
  
            break;
  
          default:
            this.warn({
              code:
                "UNSUPPORTED_STREAM_FILTER",
  
              message:
                `Unsupported PDF stream filter /${filter.value}.`,
  
              details: {
                filter:
                  filter.value,
              },
            });
  
            throw new PdfEngineError(
              "UNSUPPORTED_PDF",
  
              `PDF stream filter /${filter.value} is not supported in Phase 1.`,
  
              {
                details: {
                  feature:
                    "stream-filter",
  
                  filter:
                    filter.value,
                },
              }
            );
        }
      }
  
      return decoded;
    }
  
    private getFilters(
      value:
        | PdfObject
        | undefined
    ): PdfName[] {
      const resolved =
        this.resolveIfReference(
          value
        );
  
      if (
        resolved ===
          undefined ||
        resolved === null
      ) {
        return [];
      }
  
      if (
        isPdfName(
          resolved
        )
      ) {
        return [
          resolved,
        ];
      }
  
      if (
        isPdfArray(
          resolved
        )
      ) {
        const filters:
          PdfName[] = [];
  
        for (
          const item of
            resolved.items
        ) {
          const resolvedItem =
            this.resolveIfReference(
              item
            );
  
          if (
            !isPdfName(
              resolvedItem
            )
          ) {
            throw new PdfEngineError(
              "STREAM_DECODE_FAILED",
  
              "PDF /Filter array contains a non-name value."
            );
          }
  
          filters.push(
            resolvedItem
          );
        }
  
        return filters;
      }
  
      throw new PdfEngineError(
        "STREAM_DECODE_FAILED",
  
        "PDF /Filter must be a name or an array of names."
      );
    }
  
    private assertSupportedDecodeParameters(
      dictionary:
        PdfDictionary,
  
      filters:
        PdfName[]
    ): void {
      if (
        !filters.some(
          (
            filter
          ) =>
            filter.value ===
              "FlateDecode" ||
            filter.value ===
              "Fl"
        )
      ) {
        return;
      }
  
      const decodeParms =
        this.resolveIfReference(
          dictionary.entries.get(
            "DecodeParms"
          )
        );
  
      if (
        decodeParms ===
          undefined ||
        decodeParms ===
          null
      ) {
        return;
      }
  
      const parameters =
        this.findFlateDecodeParameters(
          decodeParms,
  
          filters
        );
  
      if (!parameters) {
        return;
      }
  
      const predictor =
        parameters.entries.get(
          "Predictor"
        );
  
      /*
       * Los predictors PNG/TIFF
       * se implementarán después.
       *
       * En content streams de texto
       * normalmente no aparecen.
       */
      if (
        typeof predictor ===
          "number" &&
        predictor > 1
      ) {
        throw new PdfEngineError(
          "UNSUPPORTED_PDF",
  
          `FlateDecode predictor ${predictor} is not supported in Phase 1.`,
  
          {
            details: {
              feature:
                "flate-predictor",
  
              predictor,
            },
          }
        );
      }
    }
  
    private findFlateDecodeParameters(
      decodeParms:
        PdfObject,
  
      filters:
        PdfName[]
    ):
      | PdfDictionary
      | undefined {
      if (
        isPdfDictionary(
          decodeParms
        )
      ) {
        return decodeParms;
      }
  
      if (
        !isPdfArray(
          decodeParms
        )
      ) {
        return undefined;
      }
  
      const flateIndex =
        filters.findIndex(
          (
            filter
          ) =>
            filter.value ===
              "FlateDecode" ||
            filter.value ===
              "Fl"
        );
  
      if (
        flateIndex < 0 ||
        flateIndex >=
          decodeParms.items
            .length
      ) {
        return undefined;
      }
  
      const resolved =
        this.resolveIfReference(
          decodeParms.items[
            flateIndex
          ]
        );
  
      return isPdfDictionary(
        resolved
      )
        ? resolved
        : undefined;
    }
  
    private resolveIfReference(
      value:
        | PdfObject
        | undefined
    ):
      | PdfObject
      | undefined {
      if (
        isPdfReference(
          value
        )
      ) {
        return this.resolveReference?.(
          value
        );
      }
  
      return value;
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