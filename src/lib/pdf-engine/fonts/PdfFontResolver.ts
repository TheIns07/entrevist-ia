import type {
    PdfDictionary,
    PdfObject,
    PdfReference,
    PdfWarning,
  } from "../types";
  
  import {
    isPdfArray,
    isPdfDictionary,
    isPdfName,
    isPdfReference,
    isPdfStream,
  } from "../types";
  
  import {
    PdfStreamDecoder,
  } from "../streams/PdfStreamDecoder";
  
  import {
    FontEncoding,
  } from "./FontEncoding";
  
  import {
    PdfFont,
  } from "./PdfFont";
  
  import {
    ToUnicodeParser,
  } from "./ToUnicodeParser";
  
  export interface PdfFontResolverOptions {
    resolveReference:
      (
        reference:
          PdfReference
      ) =>
        | PdfObject
        | undefined;
  
    onWarning?:
      (
        warning:
          PdfWarning
      ) => void;
  }
  
  export class PdfFontResolver {
    private readonly resolveReference:
      PdfFontResolverOptions["resolveReference"];
  
    private readonly onWarning?:
      PdfFontResolverOptions["onWarning"];
  
    private readonly streamDecoder:
      PdfStreamDecoder;
  
    constructor(
      options:
        PdfFontResolverOptions
    ) {
      this.resolveReference =
        options.resolveReference;
  
      this.onWarning =
        options.onWarning;
  
      this.streamDecoder =
        new PdfStreamDecoder({
          resolveReference:
            this.resolveReference,
  
          onWarning:
            this.onWarning,
        });
    }
  
    async resolvePageFonts(
      resources:
        | PdfObject
        | undefined
    ): Promise<
      Map<string, PdfFont>
    > {
      const result =
        new Map<
          string,
          PdfFont
        >();
  
      const resourceObject =
        this.resolveObject(
          resources
        );
  
      if (
        !isPdfDictionary(
          resourceObject
        )
      ) {
        return result;
      }
  
      const fontDictionary =
        this.resolveObject(
          resourceObject.entries.get(
            "Font"
          )
        );
  
      if (
        !isPdfDictionary(
          fontDictionary
        )
      ) {
        return result;
      }
  
      for (
        const [
          resourceName,
          fontObject,
        ] of fontDictionary.entries
      ) {
        const resolvedFont =
          this.resolveObject(
            fontObject
          );
  
        if (
          !isPdfDictionary(
            resolvedFont
          )
        ) {
          this.warn(
            "UNSUPPORTED_FONT",
            `Font /${resourceName} does not resolve to a dictionary.`
          );
  
          continue;
        }
  
        const font =
          await this.createFont(
            resourceName,
            resolvedFont
          );
  
        result.set(
          resourceName,
          font
        );
      }
  
      return result;
    }
  
    private async createFont(
      resourceName:
        string,
  
      dictionary:
        PdfDictionary
    ): Promise<PdfFont> {
      const subtype =
        this.readName(
          dictionary.entries.get(
            "Subtype"
          )
        );
  
      const baseFont =
        this.readName(
          dictionary.entries.get(
            "BaseFont"
          )
        );
  
      const encodingObject =
        dictionary.entries.get(
          "Encoding"
        );
  
      const encoding =
        FontEncoding.fromPdfObject(
          encodingObject,
  
          (
            value
          ) =>
            this.resolveObject(
              value
            )
        );
  
      const toUnicode =
        await this.resolveToUnicode(
          dictionary.entries.get(
            "ToUnicode"
          ),
  
          resourceName
        );
  
      let codeBytes = 1;
  
      const encodingName =
        this.readName(
          encodingObject
        );
  
      if (
        subtype ===
          "Type0" ||
        encodingName ===
          "Identity-H" ||
        encodingName ===
          "Identity-V"
      ) {
        codeBytes = 2;
      }
  
      const widthInfo =
        subtype ===
        "Type0"
          ? this.readCidWidths(
              dictionary
            )
          : this.readSimpleWidths(
              dictionary
            );
  
      return new PdfFont({
        resourceName,
  
        subtype,
  
        baseFont,
  
        encoding,
  
        toUnicode,
  
        codeBytes,
  
        widths:
          widthInfo.widths,
  
        defaultWidth:
          widthInfo.defaultWidth,
      });
    }
  
    private async resolveToUnicode(
      value:
        | PdfObject
        | undefined,
  
      resourceName:
        string
    ) {
      const resolved =
        this.resolveObject(
          value
        );
  
      if (
        resolved ===
        undefined
      ) {
        return undefined;
      }
  
      if (
        !isPdfStream(
          resolved
        )
      ) {
        this.warn(
          "MALFORMED_CMAP",
          `Font /${resourceName} has a /ToUnicode entry that is not a stream.`
        );
  
        return undefined;
      }
  
      try {
        const bytes =
          await this.streamDecoder.decode(
            resolved
          );
  
        return ToUnicodeParser.parse(
          bytes
        );
      } catch (
        error
      ) {
        console.warn(
          `[PDF Engine] Failed ToUnicode for /${resourceName}:`,
          error
        );
  
        this.warn(
          "MALFORMED_CMAP",
          `Could not parse /ToUnicode CMap for font /${resourceName}.`
        );
  
        return undefined;
      }
    }
  
    private readSimpleWidths(
      dictionary:
        PdfDictionary
    ): {
      widths:
        Map<number, number>;
  
      defaultWidth:
        number;
    } {
      const widths =
        new Map<
          number,
          number
        >();
  
      const firstCharValue =
        this.resolveObject(
          dictionary.entries.get(
            "FirstChar"
          )
        );
  
      const widthsValue =
        this.resolveObject(
          dictionary.entries.get(
            "Widths"
          )
        );
  
      const firstChar =
        typeof firstCharValue ===
        "number"
          ? Math.trunc(
              firstCharValue
            )
          : 0;
  
      if (
        isPdfArray(
          widthsValue
        )
      ) {
        widthsValue.items.forEach(
          (
            width,
            index
          ) => {
            const resolved =
              this.resolveObject(
                width
              );
  
            if (
              typeof resolved ===
              "number"
            ) {
              widths.set(
                firstChar +
                  index,
                resolved
              );
            }
          }
        );
      }
  
      return {
        widths,
  
        defaultWidth:
          500,
      };
    }
  
    private readCidWidths(
      dictionary:
        PdfDictionary
    ): {
      widths:
        Map<number, number>;
  
      defaultWidth:
        number;
    } {
      const widths =
        new Map<
          number,
          number
        >();
  
      const descendants =
        this.resolveObject(
          dictionary.entries.get(
            "DescendantFonts"
          )
        );
  
      if (
        !isPdfArray(
          descendants
        ) ||
        descendants.items
          .length === 0
      ) {
        return {
          widths,
  
          defaultWidth:
            1000,
        };
      }
  
      const descendant =
        this.resolveObject(
          descendants.items[
            0
          ]
        );
  
      if (
        !isPdfDictionary(
          descendant
        )
      ) {
        return {
          widths,
  
          defaultWidth:
            1000,
        };
      }
  
      const dwValue =
        this.resolveObject(
          descendant.entries.get(
            "DW"
          )
        );
  
      const defaultWidth =
        typeof dwValue ===
        "number"
          ? dwValue
          : 1000;
  
      const wValue =
        this.resolveObject(
          descendant.entries.get(
            "W"
          )
        );
  
      if (
        !isPdfArray(
          wValue
        )
      ) {
        return {
          widths,
  
          defaultWidth,
        };
      }
  
      const items =
        wValue.items;
  
      let index = 0;
  
      while (
        index <
        items.length
      ) {
        const first =
          this.resolveObject(
            items[index]
          );
  
        if (
          typeof first !==
          "number"
        ) {
          index += 1;
          continue;
        }
  
        const next =
          this.resolveObject(
            items[
              index + 1
            ]
          );
  
        /*
         * c [
         *   w1 w2 w3
         * ]
         */
        if (
          isPdfArray(
            next
          )
        ) {
          next.items.forEach(
            (
              width,
              offset
            ) => {
              const resolved =
                this.resolveObject(
                  width
                );
  
              if (
                typeof resolved ===
                "number"
              ) {
                widths.set(
                  Math.trunc(
                    first
                  ) +
                    offset,
  
                  resolved
                );
              }
            }
          );
  
          index += 2;
          continue;
        }
  
        /*
         * cFirst cLast width
         */
        const widthValue =
          this.resolveObject(
            items[
              index + 2
            ]
          );
  
        if (
          typeof next ===
            "number" &&
          typeof widthValue ===
            "number"
        ) {
          const start =
            Math.trunc(
              first
            );
  
          const end =
            Math.trunc(
              next
            );
  
          for (
            let code =
              start;
  
            code <=
              end;
  
            code += 1
          ) {
            widths.set(
              code,
              widthValue
            );
          }
  
          index += 3;
          continue;
        }
  
        index += 1;
      }
  
      return {
        widths,
        defaultWidth,
      };
    }
  
    private readName(
      value:
        | PdfObject
        | undefined
    ): string | undefined {
      const resolved =
        this.resolveObject(
          value
        );
  
      return isPdfName(
        resolved
      )
        ? resolved.value
        : undefined;
    }
  
    private resolveObject(
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
        return this.resolveReference(
          value
        );
      }
  
      return value;
    }
  
    private warn(
      code:
        PdfWarning["code"],
  
      message:
        string
    ): void {
      this.onWarning?.({
        code,
        message,
      });
    }
  }