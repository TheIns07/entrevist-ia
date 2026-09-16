import type {
    PdfEngineErrorCode,
  } from "./types";
  
  export class PdfEngineError extends Error {
    readonly code:
      PdfEngineErrorCode;
  
    readonly offset?: number;
  
    readonly objectNumber?: number;
  
    readonly details?:
      Record<string, unknown>;
  
    constructor(
      code:
        PdfEngineErrorCode,
  
      message: string,
  
      options: {
        offset?: number;
  
        objectNumber?: number;
  
        details?:
          Record<
            string,
            unknown
          >;
  
        cause?: unknown;
      } = {}
    ) {
      super(
        message,
        options.cause !==
        undefined
          ? {
              cause:
                options.cause,
            }
          : undefined
      );
  
      this.name =
        "PdfEngineError";
  
      this.code =
        code;
  
      this.offset =
        options.offset;
  
      this.objectNumber =
        options.objectNumber;
  
      this.details =
        options.details;
    }
  }
  
  export function toPdfEngineError(
    error: unknown,
  
    fallbackMessage: string
  ): PdfEngineError {
    if (
      error instanceof
      PdfEngineError
    ) {
      return error;
    }
  
    return new PdfEngineError(
      "UNKNOWN",
      fallbackMessage,
      {
        cause: error,
      }
    );
  }