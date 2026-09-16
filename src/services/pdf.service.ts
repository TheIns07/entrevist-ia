import {
  DEFAULT_MAX_PDF_SIZE_BYTES,
} from "../lib/pdf-engine/constants";

import {
  PdfEngineError,
} from "../lib/pdf-engine/errors";

import {
  extractRawTextProbe,
  type PdfProbeProgressCallback,
  type PdfTextProbeResult,
} from "../lib/pdf-engine/content/RawTextProbe";

export interface PdfTextPreviewResult
  extends PdfTextProbeResult {
  fileName: string;

  fileSize: number;
}

export async function extractPdfTextPreview(
  file: File,
  onProgress?: PdfProbeProgressCallback
): Promise<PdfTextPreviewResult> {
  console.group(
    `[PDF Engine] ${file.name}`
  );

  console.log(
    "Tamaño:",
    file.size,
    "bytes"
  );

  console.log(
    "MIME:",
    file.type
  );

  console.log(
    "[PDF Engine] 1. Validando archivo..."
  );

  validatePdfFile(
    file
  );

  console.log(
    "[PDF Engine] 2. Validando cabecera..."
  );

  await validatePdfHeader(
    file
  );

  console.log(
    "[PDF Engine] Cabecera PDF válida."
  );

  console.log(
    "[PDF Engine] 3. Leyendo ArrayBuffer..."
  );

  const buffer =
    await file.arrayBuffer();

  console.log(
    "[PDF Engine] ArrayBuffer:",
    buffer.byteLength,
    "bytes"
  );

  console.log(
    "[PDF Engine] 4. Iniciando extractor..."
  );

  try {
    const result =
      await extractRawTextProbe(
        buffer,
        onProgress
      );

      console.log(
        "=============================="
      );
      
      console.log(
        "RAW TEXT FINAL"
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        result.rawText
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        "LAYOUT TEXT FINAL"
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        result.layoutText
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        "CLEAN TEXT FINAL"
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        result.cleanText
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        "CLEANING INFO"
      );
      
      console.log(
        "=============================="
      );
      
      console.log(
        {
          rawLength:
            result.rawText.length,
      
          layoutLength:
            result.layoutText.length,
      
          cleanLength:
            result.cleanText.length,
      
          removedFragments:
            result.removedFragments.length,
        }
      );
      
      console.table(
        result.removedFragments
      );
      
      console.log(
        "Warnings:",
        result.warnings
      );

    return {
      ...result,

      fileName:
        file.name,

      fileSize:
        file.size,
    };
  } catch (
    error
  ) {
    console.error(
      "[PDF Engine] Extracción falló:",
      error
    );

    throw error;
  } finally {
    console.groupEnd();
  }
}

function validatePdfFile(
  file: File
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
  file: File
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

  const signature = [
    0x25,
    0x50,
    0x44,
    0x46,
    0x2d,
  ];

  let found =
    false;

  const maxOffset =
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
    maxOffset;
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
        signature[index]
      ) {
        matches =
          false;

        break;
      }
    }

    if (matches) {
      found =
        true;

      break;
    }
  }

  if (!found) {
    throw new PdfEngineError(
      "INVALID_PDF",
      "No se encontró una cabecera %PDF válida."
    );
  }
}