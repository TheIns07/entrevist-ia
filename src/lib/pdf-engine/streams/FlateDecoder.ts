import {
  PdfEngineError,
} from "../errors";

export class FlateDecoder {
  static async decode(
    data: Uint8Array
  ): Promise<Uint8Array> {
    if (
      typeof DecompressionStream ===
      "undefined"
    ) {
      throw new PdfEngineError(
        "STREAM_DECODE_FAILED",
        "Este navegador no soporta DecompressionStream, necesario para /FlateDecode."
      );
    }

    if (
      data.length === 0
    ) {
      return new Uint8Array();
    }

    try {
      /*
       * IMPORTANTE:
       *
       * No escribimos manualmente usando:
       *
       * const writer =
       *   decompressionStream.writable.getWriter();
       *
       * await writer.write(...)
       * await writer.close()
       *
       * porque el WritableStream puede aplicar
       * backpressure mientras nadie está
       * consumiendo todavía el ReadableStream.
       *
       * pipeThrough() consume y produce datos
       * simultáneamente.
       */

      const inputBuffer =
        new Uint8Array(
          data
        ).buffer;

      const compressedStream =
        new Blob([
          inputBuffer,
        ]).stream();

      const decompressionStream =
        new DecompressionStream(
          "deflate"
        );

      const decompressedStream =
        compressedStream.pipeThrough(
          decompressionStream
        );

      const outputBuffer =
        await new Response(
          decompressedStream
        ).arrayBuffer();

      return new Uint8Array(
        outputBuffer
      );
    } catch (error) {
      throw new PdfEngineError(
        "STREAM_DECODE_FAILED",
        "No fue posible decodificar el stream /FlateDecode.",
        {
          cause: error,

          details: {
            compressedBytes:
              data.length,
          },
        }
      );
    }
  }
}