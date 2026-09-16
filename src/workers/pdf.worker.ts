import {
    PdfEngineError,
  } from "../lib/pdf-engine/errors";
  
  import {
    extractPdfFromBuffer,
  } from "../lib/pdf-engine/PdfExtractionEngine";
  
  import type {
    PdfWorkerExtractRequest,
    PdfWorkerResponse,
  } from "../lib/pdf-engine/public-types";
  
  interface PdfWorkerScope {
    onmessage:
      | (
          (
            event:
              MessageEvent<PdfWorkerExtractRequest>
          ) => void
        )
      | null;
  
    postMessage:
      (
        message:
          PdfWorkerResponse
      ) => void;
  }
  
  const workerScope =
    self as unknown as
      PdfWorkerScope;
  
  workerScope.onmessage =
    (
      event:
        MessageEvent<PdfWorkerExtractRequest>
    ) => {
      void handleRequest(
        event.data
      );
    };
  
  async function handleRequest(
    request:
      PdfWorkerExtractRequest
  ): Promise<void> {
    if (
      request.type !==
      "extract"
    ) {
      return;
    }
  
    try {
      const result =
        await extractPdfFromBuffer(
          request.buffer,
          request.source,
          (
            progress
          ) => {
            workerScope.postMessage({
              type:
                "progress",
  
              progress,
            });
          }
        );
  
      workerScope.postMessage({
        type:
          "result",
  
        result,
      });
    } catch (
      error
    ) {
      workerScope.postMessage({
        type:
          "error",
  
        error:
          serializeError(
            error
          ),
      });
    }
  }
  
  function serializeError(
    error:
      unknown
  ): {
    code:
      string;
  
    message:
      string;
  } {
    if (
      error instanceof
      PdfEngineError
    ) {
      return {
        code:
          String(
            error.code
          ),
  
        message:
          error.message,
      };
    }
  
    if (
      error instanceof
      Error
    ) {
      return {
        code:
          "UNKNOWN",
  
        message:
          error.message,
      };
    }
  
    return {
      code:
        "UNKNOWN",
  
      message:
        "Ocurrió un error desconocido durante el procesamiento del PDF.",
    };
  }