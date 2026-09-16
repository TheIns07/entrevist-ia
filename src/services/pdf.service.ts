import {
  DEFAULT_MAX_PDF_SIZE_BYTES,
} from "../lib/pdf-engine/constants";

import {
  PdfEngineError,
} from "../lib/pdf-engine/errors";

import type {
  PdfDocumentResult,
  PdfExtractionProgressCallback,
  PdfWorkerExtractRequest,
  PdfWorkerResponse,
} from "../lib/pdf-engine/public-types";

export type {
  PdfDocumentResult,
  PdfExtractionProgress,
  PdfExtractionProgressCallback,
} from "../lib/pdf-engine/public-types";

/*
 * =========================================================
 * COMPATIBILIDAD CON EL ONBOARDING ACTUAL
 * =========================================================
 */

export type PdfTextPreviewResult =
  PdfDocumentResult;

export interface ExtractPdfOptions {
  onProgress?:
    PdfExtractionProgressCallback;

  signal?:
    AbortSignal;
}

/*
 * =========================================================
 * API PÚBLICA
 * =========================================================
 */

export async function extractPdf(
  file:
    File,

  options:
    ExtractPdfOptions = {}
): Promise<PdfDocumentResult> {
  const {
    onProgress,
    signal,
  } = options;

  throwIfAborted(
    signal
  );

  onProgress?.({
    stage:
      "starting",

    message:
      "Validando archivo...",

    progress:
      1,
  });

  validatePdfFile(
    file
  );

  await validatePdfHeader(
    file
  );

  throwIfAborted(
    signal
  );

  onProgress?.({
    stage:
      "starting",

    message:
      "Leyendo archivo...",

    progress:
      3,
  });

  const buffer =
    await file.arrayBuffer();

  throwIfAborted(
    signal
  );

  return runPdfWorker(
    buffer,
    file,
    options
  );
}

/*
 * =========================================================
 * API TEMPORAL ANTERIOR
 * =========================================================
 *
 * La conservamos para no obligarte
 * todavía a modificar OnboardingPage.
 *
 * Internamente ya usa el Web Worker
 * y el motor definitivo.
 * =========================================================
 */

export async function extractPdfTextPreview(
  file:
    File,

  onProgress?:
    PdfExtractionProgressCallback
): Promise<PdfTextPreviewResult> {
  return extractPdf(
    file,
    {
      onProgress,
    }
  );
}

/*
 * =========================================================
 * WORKER
 * =========================================================
 */

function runPdfWorker(
  buffer:
    ArrayBuffer,

  file:
    File,

  options:
    ExtractPdfOptions
): Promise<PdfDocumentResult> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const worker =
        new Worker(
          new URL(
            "../workers/pdf.worker.ts",
            import.meta.url
          ),
          {
            type:
              "module",
          }
        );

      let settled =
        false;

      const cleanup =
        (): void => {
          worker.terminate();

          options.signal
            ?.removeEventListener(
              "abort",
              handleAbort
            );
        };

      const resolveOnce =
        (
          result:
            PdfDocumentResult
        ): void => {
          if (
            settled
          ) {
            return;
          }

          settled =
            true;

          cleanup();

          resolve(
            result
          );
        };

      const rejectOnce =
        (
          error:
            unknown
        ): void => {
          if (
            settled
          ) {
            return;
          }

          settled =
            true;

          cleanup();

          reject(
            error
          );
        };

      const handleAbort =
        (): void => {
          rejectOnce(
            createAbortError()
          );
        };

      worker.onmessage =
        (
          event:
            MessageEvent<PdfWorkerResponse>
        ) => {
          const response =
            event.data;

          switch (
            response.type
          ) {
            case "progress":
              options.onProgress?.(
                response.progress
              );

              return;

            case "result":
              resolveOnce(
                response.result
              );

              return;

            case "error":
              rejectOnce(
                deserializeWorkerError(
                  response.error
                )
              );

              return;

            default:
              return;
          }
        };

      worker.onerror =
        (
          event:
            ErrorEvent
        ) => {
          rejectOnce(
            new PdfEngineError(
              "UNKNOWN",
              event.message ||
                "El Web Worker del motor PDF falló."
            )
          );
        };

      options.signal
        ?.addEventListener(
          "abort",
          handleAbort,
          {
            once:
              true,
          }
        );

      if (
        options.signal
          ?.aborted
      ) {
        handleAbort();

        return;
      }

      const request:
        PdfWorkerExtractRequest = {
          type:
            "extract",

          buffer,

          source: {
            fileName:
              file.name,

            fileSize:
              file.size,

            mimeType:
              file.type,

            lastModified:
              file.lastModified,
          },
        };

      /*
       * IMPORTANTE:
       *
       * Transferimos ownership del
       * ArrayBuffer al worker.
       *
       * No se clona el PDF completo.
       */
      worker.postMessage(
        request,
        [
          buffer,
        ]
      );
    }
  );
}

/*
 * =========================================================
 * VALIDACIÓN
 * =========================================================
 */

function validatePdfFile(
  file:
    File
): void {
  if (
    file.size ===
    0
  ) {
    throw new PdfEngineError(
      "INVALID_PDF",
      "El archivo PDF está vacío."
    );
  }

  if (
    file.size >
    DEFAULT_MAX_PDF_SIZE_BYTES
  ) {
    throw new PdfEngineError(
      "INVALID_PDF",

      `El archivo supera el límite actual de ${Math.round(
        DEFAULT_MAX_PDF_SIZE_BYTES /
          1024 /
          1024
      )} MB.`
    );
  }

  if (
    file.type &&
    file.type !==
      "application/pdf"
  ) {
    throw new PdfEngineError(
      "INVALID_PDF",
      "El archivo seleccionado no es un PDF."
    );
  }
}

async function validatePdfHeader(
  file:
    File
): Promise<void> {
  const headerBuffer =
    await file
      .slice(
        0,
        1024
      )
      .arrayBuffer();

  const bytes =
    new Uint8Array(
      headerBuffer
    );

  const signature =
    [
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d,
    ];

  const maximumOffset =
    Math.max(
      0,

      Math.min(
        bytes.length -
          signature.length,
        1024
      )
    );

  for (
    let offset = 0;
    offset <=
    maximumOffset;
    offset += 1
  ) {
    let matches =
      true;

    for (
      let index = 0;
      index <
      signature.length;
      index += 1
    ) {
      if (
        bytes[
          offset +
            index
        ] !==
        signature[
          index
        ]
      ) {
        matches =
          false;

        break;
      }
    }

    if (
      matches
    ) {
      return;
    }
  }

  throw new PdfEngineError(
    "INVALID_PDF",
    "No se encontró una cabecera %PDF válida."
  );
}

/*
 * =========================================================
 * ERROR DEL WORKER
 * =========================================================
 */

function deserializeWorkerError(
  error: {
    code:
      string;

    message:
      string;
  }
): PdfEngineError {
  type PdfErrorCode =
    ConstructorParameters<
      typeof PdfEngineError
    >[0];

  return new PdfEngineError(
    error.code as
      PdfErrorCode,

    error.message
  );
}

/*
 * =========================================================
 * ABORT
 * =========================================================
 */

function throwIfAborted(
  signal:
    AbortSignal |
    undefined
): void {
  if (
    signal?.aborted
  ) {
    throw createAbortError();
  }
}

function createAbortError():
  DOMException {
  return new DOMException(
    "La extracción del PDF fue cancelada.",
    "AbortError"
  );
}