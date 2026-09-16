import {
  PdfEngineError,
} from "../errors";

import {
  PdfFontResolver,
} from "../fonts/PdfFontResolver";

import type {
  PdfParser,
} from "../parser/PdfParser";

import {
  PdfStreamDecoder,
} from "../streams/PdfStreamDecoder";

import type {
  PdfGlyph,
  PdfPage,
  PdfWarning,
} from "../types";

import {
  isPdfReference,
  isPdfStream,
} from "../types";

import {
  ContentStreamParser,
} from "./ContentStreamParser";

import {
  TextOperatorInterpreter,
} from "./TextOperatorInterpreter";

export interface GlyphExtractionResult {
  glyphs:
    PdfGlyph[];

  rawText:
    string;

  warnings:
    PdfWarning[];

  fontCount:
    number;
}

export class GlyphExtractor {
  private readonly parser:
    PdfParser;

  private readonly warnings:
    PdfWarning[] = [];

  private readonly decoder:
    PdfStreamDecoder;

  private readonly fontResolver:
    PdfFontResolver;

  constructor(
    parser:
      PdfParser
  ) {
    this.parser =
      parser;

    this.decoder =
      new PdfStreamDecoder({
        resolveReference:
          (
            reference
          ) =>
            this.parser.resolve(
              reference
            ),

        onWarning:
          (
            warning
          ) => {
            this.warnings.push(
              warning
            );
          },
      });

    this.fontResolver =
      new PdfFontResolver({
        resolveReference:
          (
            reference
          ) =>
            this.parser.resolve(
              reference
            ),

        onWarning:
          (
            warning
          ) => {
            this.warnings.push(
              warning
            );
          },
      });
  }

  async extractPage(
    page:
      PdfPage
  ): Promise<GlyphExtractionResult> {
    const warningStart =
      this.warnings.length;

    /*
     * =====================================================
     * FUENTES DE LA PÁGINA
     * =====================================================
     */

    const fonts =
      await this.fontResolver.resolvePageFonts(
        page.resources
      );

    console.log(
      `[PDF Engine] Página ${page.pageNumber}: ${fonts.size} fuente(s)`
    );

    for (
      const [
        resourceName,
        font,
      ] of fonts
    ) {
      console.log(
        `[PDF Engine] /${resourceName}`,
        {
          name:
            font.displayName,

          subtype:
            font.subtype,

          toUnicode:
            font.hasToUnicode,

          codeBytes:
            font.codeBytes,
        }
      );
    }

    /*
     * =====================================================
     * DECODIFICAR TODOS LOS CONTENT STREAMS
     * =====================================================
     *
     * IMPORTANTE:
     *
     * /Contents puede ser:
     *
     * /Contents 10 0 R
     *
     * o:
     *
     * /Contents [
     *   10 0 R
     *   11 0 R
     *   12 0 R
     * ]
     *
     * Cuando es un array, NO significa que cada stream sea
     * una unidad sintáctica independiente.
     *
     * Una operación PDF puede comenzar en un stream y
     * terminar en el siguiente.
     *
     * Por lo tanto:
     *
     * 1. resolvemos cada stream;
     * 2. descomprimimos cada stream;
     * 3. concatenamos los bytes;
     * 4. parseamos el resultado UNA sola vez.
     *
     * Esto es necesario para PDFs reales generados por Word,
     * Acrobat, iLovePDF y otros productores.
     * =====================================================
     */

    const decodedStreams:
      Uint8Array[] = [];

    let totalDecodedBytes =
      0;

    for (
      let index = 0;
      index <
      page.contents.length;
      index += 1
    ) {
      const content =
        page.contents[
          index
        ];

      const resolved =
        isPdfReference(
          content
        )
          ? this.parser.resolve(
              content
            )
          : content;

      if (
        !isPdfStream(
          resolved
        )
      ) {
        console.warn(
          `[PDF Engine] Página ${page.pageNumber}: Contents ${index + 1} no resolvió a PdfStream.`
        );

        continue;
      }

      try {
        const decoded =
          await this.decoder.decode(
            resolved
          );

        decodedStreams.push(
          decoded
        );

        totalDecodedBytes +=
          decoded.length;

        console.log(
          `[PDF Engine] Página ${page.pageNumber}: stream ${index + 1}/${page.contents.length} decodificado`,
          {
            compressedBytes:
              resolved.data.length,

            decodedBytes:
              decoded.length,
          }
        );
      } catch (
        error
      ) {
        throw new PdfEngineError(
          "STREAM_DECODE_FAILED",

          `Could not decode content stream ${index + 1} on page ${page.pageNumber}.`,

          {
            cause:
              error,

            details: {
              page:
                page.pageNumber,

              stream:
                index + 1,
            },
          }
        );
      }
    }

    /*
     * =====================================================
     * CONCATENAR STREAMS
     * =====================================================
     *
     * Evitamos:
     *
     * decodedA + decodedB
     *
     * porque Uint8Array no funciona así y además produciría
     * copias innecesarias.
     *
     * Reservamos una sola vez el tamaño total.
     * =====================================================
     */

    const combinedContent =
      concatenateStreams(
        decodedStreams,
        totalDecodedBytes
      );

    console.log(
      `[PDF Engine] Página ${page.pageNumber}: content stream lógico`,
      {
        streams:
          decodedStreams.length,

        bytes:
          combinedContent.length,
      }
    );

    /*
     * =====================================================
     * PARSEAR OPERADORES
     * =====================================================
     *
     * Ahora ContentStreamParser ve:
     *
     * stream1 + stream2 + stream3...
     *
     * como la secuencia lógica que realmente representa la
     * página.
     * =====================================================
     */

    let operations;

    try {
      operations =
        ContentStreamParser.parse(
          combinedContent
        );
    } catch (
      error
    ) {
      console.error(
        `[PDF Engine] Error parseando content stream lógico de página ${page.pageNumber}:`,
        error
      );

      throw new PdfEngineError(
        "PAGE_PARSE_FAILED",

        `Could not parse content stream operators on page ${page.pageNumber}.`,

        {
          cause:
            error,

          details: {
            page:
              page.pageNumber,

            streams:
              decodedStreams.length,

            decodedBytes:
              combinedContent.length,
          },
        }
      );
    }

    console.log(
      `[PDF Engine] Página ${page.pageNumber}: ${operations.length} operaciones PDF`
    );

    /*
     * =====================================================
     * INTERPRETAR TEXTO
     * =====================================================
     */

    const interpreter =
      new TextOperatorInterpreter({
        pageNumber:
          page.pageNumber,

        fonts,

        onWarning:
          (
            warning
          ) => {
            this.warnings.push(
              warning
            );
          },
      });

    const interpreted =
      interpreter.interpret(
        operations
      );

    /*
     * Glyphs sí pertenecen al modelo base de PdfPage.
     */
    page.glyphs = [
      ...interpreted.glyphs,
    ];

    console.log(
      `[PDF Engine] Página ${page.pageNumber}: interpretación terminada`,
      {
        glyphs:
          interpreted.glyphs.length,

        characters:
          interpreted.rawText.length,
      }
    );

    return {
      glyphs:
        interpreted.glyphs,

      rawText:
        interpreted.rawText,

      fontCount:
        fonts.size,

      warnings:
        this.warnings.slice(
          warningStart
        ),
    };
  }
}

/*
 * =========================================================
 * CONCATENACIÓN EFICIENTE DE STREAMS
 * =========================================================
 */

function concatenateStreams(
  streams:
    Uint8Array[],

  totalLength:
    number
): Uint8Array {
  if (
    streams.length ===
    0
  ) {
    return new Uint8Array();
  }

  if (
    streams.length ===
    1
  ) {
    return streams[0];
  }

  const result =
    new Uint8Array(
      totalLength
    );

  let offset = 0;

  for (
    const stream of
      streams
  ) {
    result.set(
      stream,
      offset
    );

    offset +=
      stream.length;
  }

  return result;
}