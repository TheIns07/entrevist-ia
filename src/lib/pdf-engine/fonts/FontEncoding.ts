import type {
    PdfObject,
  } from "../types";
  
  import {
    isPdfArray,
    isPdfDictionary,
    isPdfName,
    isPdfReference,
  } from "../types";
  
  /*
   * =========================================================
   * FONT ENCODING
   * =========================================================
   *
   * Maneja fuentes PDF simples cuando:
   *
   * - no existe /ToUnicode;
   * - existe /Encoding;
   * - existe /BaseEncoding;
   * - existen /Differences.
   *
   * /ToUnicode siempre tendrá prioridad cuando esté
   * disponible. Esta clase funciona principalmente como
   * fallback.
   * =========================================================
   */
  
  export class FontEncoding {
    private readonly differences =
      new Map<number, string>();
  
    readonly baseEncoding?:
      string;
  
    constructor(
      baseEncoding?: string
    ) {
      this.baseEncoding =
        baseEncoding;
    }
  
    /*
     * =======================================================
     * CREAR ENCODING DESDE OBJETO PDF
     * =======================================================
     */
  
    static fromPdfObject(
      value:
        | PdfObject
        | undefined,
  
      resolveObject: (
        value: PdfObject
      ) =>
        | PdfObject
        | undefined
    ): FontEncoding {
      const resolved =
        resolvePdfObject(
          value,
          resolveObject
        );
  
      /*
       * Ejemplo:
       *
       * /Encoding /WinAnsiEncoding
       */
      if (
        isPdfName(
          resolved
        )
      ) {
        return new FontEncoding(
          resolved.value
        );
      }
  
      /*
       * Ejemplo:
       *
       * /Encoding <<
       *   /BaseEncoding /WinAnsiEncoding
       *   /Differences [
       *     128 /Euro
       *     145 /quoteleft
       *   ]
       * >>
       */
      if (
        !isPdfDictionary(
          resolved
        )
      ) {
        return new FontEncoding();
      }
  
      const baseEncodingObject =
        resolvePdfObject(
          resolved.entries.get(
            "BaseEncoding"
          ),
          resolveObject
        );
  
      const encoding =
        new FontEncoding(
          isPdfName(
            baseEncodingObject
          )
            ? baseEncodingObject.value
            : undefined
        );
  
      const differencesObject =
        resolvePdfObject(
          resolved.entries.get(
            "Differences"
          ),
          resolveObject
        );
  
      if (
        !isPdfArray(
          differencesObject
        )
      ) {
        return encoding;
      }
  
      let currentCode:
        | number
        | undefined;
  
      for (
        const item of
          differencesObject.items
      ) {
        const resolvedItem =
          resolvePdfObject(
            item,
            resolveObject
          );
  
        /*
         * En /Differences un número
         * cambia el código base:
         *
         * [128 /Euro /bullet]
         *
         * significa:
         *
         * 128 -> Euro
         * 129 -> bullet
         */
        if (
          typeof resolvedItem ===
          "number"
        ) {
          currentCode =
            Math.trunc(
              resolvedItem
            );
  
          continue;
        }
  
        if (
          currentCode !==
            undefined &&
          isPdfName(
            resolvedItem
          )
        ) {
          encoding.differences.set(
            currentCode,
            resolvedItem.value
          );
  
          currentCode += 1;
        }
      }
  
      return encoding;
    }
  
    /*
     * =======================================================
     * DECODE
     * =======================================================
     */
  
    decode(
      code: number
    ): string | undefined {
      /*
       * Primero revisamos /Differences.
       */
      const glyphName =
        this.differences.get(
          code
        );
  
      if (glyphName) {
        const unicode =
          glyphNameToUnicode(
            glyphName
          );
  
        if (
          unicode !==
          undefined
        ) {
          return unicode;
        }
      }
  
      /*
       * Después usamos BaseEncoding.
       */
      switch (
        this.baseEncoding
      ) {
        case "WinAnsiEncoding":
          return decodeWindows1252(
            code
          );
  
        case "MacRomanEncoding":
          return decodeMacRoman(
            code
          );
  
        case "MacExpertEncoding":
          /*
           * MacExpert no puede mapearse
           * correctamente mediante un
           * TextDecoder estándar.
           *
           * Es preferible devolver
           * undefined antes que inventar
           * contenido.
           */
          return undefined;
  
        case "StandardEncoding":
          return decodeStandardEncoding(
            code
          );
  
        default:
          break;
      }
  
      /*
       * ASCII básico es suficientemente
       * estable como fallback.
       */
      if (
        code >= 0x20 &&
        code <= 0x7e
      ) {
        return String.fromCharCode(
          code
        );
      }
  
      /*
       * Fallback occidental conservador.
       */
      if (
        code >= 0xa0 &&
        code <= 0xff
      ) {
        return decodeWindows1252(
          code
        );
      }
  
      return undefined;
    }
  }
  
  /*
   * =========================================================
   * RESOLVE
   * =========================================================
   */
  
  function resolvePdfObject(
    value:
      | PdfObject
      | undefined,
  
    resolver: (
      value: PdfObject
    ) =>
      | PdfObject
      | undefined
  ):
    | PdfObject
    | undefined {
    if (
      value ===
      undefined
    ) {
      return undefined;
    }
  
    if (
      isPdfReference(
        value
      )
    ) {
      return resolver(
        value
      );
    }
  
    return value;
  }
  
  /*
   * =========================================================
   * WINDOWS-1252
   * =========================================================
   */
  
  function decodeWindows1252(
    code: number
  ): string | undefined {
    if (
      code < 0 ||
      code > 0xff
    ) {
      return undefined;
    }
  
    /*
     * Caracteres especiales 0x80-0x9F.
     */
    const special:
      Record<number, string> = {
        0x80: "€",
        0x82: "‚",
        0x83: "ƒ",
        0x84: "„",
        0x85: "…",
        0x86: "†",
        0x87: "‡",
        0x88: "ˆ",
        0x89: "‰",
        0x8a: "Š",
        0x8b: "‹",
        0x8c: "Œ",
        0x8e: "Ž",
        0x91: "‘",
        0x92: "’",
        0x93: "“",
        0x94: "”",
        0x95: "•",
        0x96: "–",
        0x97: "—",
        0x98: "˜",
        0x99: "™",
        0x9a: "š",
        0x9b: "›",
        0x9c: "œ",
        0x9e: "ž",
        0x9f: "Ÿ",
      };
  
    if (
      special[code] !==
      undefined
    ) {
      return special[code];
    }
  
    /*
     * Los valores reservados de
     * Windows-1252 no tienen carácter.
     */
    if (
      code === 0x81 ||
      code === 0x8d ||
      code === 0x8f ||
      code === 0x90 ||
      code === 0x9d
    ) {
      return undefined;
    }
  
    return String.fromCharCode(
      code
    );
  }
  
  /*
   * =========================================================
   * MAC ROMAN
   * =========================================================
   */
  
  function decodeMacRoman(
    code: number
  ): string | undefined {
    if (
      code < 0 ||
      code > 0xff
    ) {
      return undefined;
    }
  
    if (
      code <= 0x7f
    ) {
      return String.fromCharCode(
        code
      );
    }
  
    /*
     * Mapeo MacRoman 0x80-0xFF.
     */
    const table = [
      "Ä",
      "Å",
      "Ç",
      "É",
      "Ñ",
      "Ö",
      "Ü",
      "á",
      "à",
      "â",
      "ä",
      "ã",
      "å",
      "ç",
      "é",
      "è",
  
      "ê",
      "ë",
      "í",
      "ì",
      "î",
      "ï",
      "ñ",
      "ó",
      "ò",
      "ô",
      "ö",
      "õ",
      "ú",
      "ù",
      "û",
      "ü",
  
      "†",
      "°",
      "¢",
      "£",
      "§",
      "•",
      "¶",
      "ß",
      "®",
      "©",
      "™",
      "´",
      "¨",
      "≠",
      "Æ",
      "Ø",
  
      "∞",
      "±",
      "≤",
      "≥",
      "¥",
      "µ",
      "∂",
      "∑",
      "∏",
      "π",
      "∫",
      "ª",
      "º",
      "Ω",
      "æ",
      "ø",
  
      "¿",
      "¡",
      "¬",
      "√",
      "ƒ",
      "≈",
      "∆",
      "«",
      "»",
      "…",
      "\u00A0",
      "À",
      "Ã",
      "Õ",
      "Œ",
      "œ",
  
      "–",
      "—",
      "“",
      "”",
      "‘",
      "’",
      "÷",
      "◊",
      "ÿ",
      "Ÿ",
      "⁄",
      "€",
      "‹",
      "›",
      "ﬁ",
      "ﬂ",
  
      "‡",
      "·",
      "‚",
      "„",
      "‰",
      "Â",
      "Ê",
      "Á",
      "Ë",
      "È",
      "Í",
      "Î",
      "Ï",
      "Ì",
      "Ó",
      "Ô",
  
      "\uF8FF",
      "Ò",
      "Ú",
      "Û",
      "Ù",
      "ı",
      "ˆ",
      "˜",
      "¯",
      "˘",
      "˙",
      "˚",
      "¸",
      "˝",
      "˛",
      "ˇ",
    ];
  
    return table[
      code -
      0x80
    ];
  }
  
  /*
   * =========================================================
   * STANDARD ENCODING
   * =========================================================
   */
  
  function decodeStandardEncoding(
    code: number
  ): string | undefined {
    if (
      code >= 0x20 &&
      code <= 0x7e
    ) {
      return String.fromCharCode(
        code
      );
    }
  
    /*
     * Símbolos más importantes de
     * StandardEncoding.
     *
     * El resto se resolverá mediante
     * glyph names/Differences o
     * /ToUnicode.
     */
    const table:
      Record<number, string> = {
        0xa1: "¡",
        0xa2: "¢",
        0xa3: "£",
        0xa5: "¥",
        0xa7: "§",
        0xa8: "¤",
        0xab: "«",
        0xbb: "»",
        0xbf: "¿",
      };
  
    return table[code];
  }
  
  /*
   * =========================================================
   * GLYPH NAME -> UNICODE
   * =========================================================
   */
  
  function glyphNameToUnicode(
    name: string
  ): string | undefined {
    /*
     * Algunos glyph names tienen
     * sufijos:
     *
     * A.swash
     * zero.oldstyle
     *
     * Para mapping Unicode nos
     * interesa el nombre base.
     */
    const normalizedName =
      name.split(
        "."
      )[0];
  
    const direct:
      Record<string, string> = {
        space: " ",
  
        exclam: "!",
        quotedbl: "\"",
        numbersign: "#",
        dollar: "$",
        percent: "%",
        ampersand: "&",
        quotesingle: "'",
  
        parenleft: "(",
        parenright: ")",
  
        asterisk: "*",
        plus: "+",
        comma: ",",
        hyphen: "-",
        period: ".",
        slash: "/",
  
        colon: ":",
        semicolon: ";",
  
        less: "<",
        equal: "=",
        greater: ">",
        question: "?",
        at: "@",
  
        bracketleft: "[",
        backslash: "\\",
        bracketright: "]",
  
        asciicircum: "^",
        underscore: "_",
        grave: "`",
  
        braceleft: "{",
        bar: "|",
        braceright: "}",
        asciitilde: "~",
  
        /*
         * Español.
         */
        Aacute: "Á",
        aacute: "á",
  
        Eacute: "É",
        eacute: "é",
  
        Iacute: "Í",
        iacute: "í",
  
        Oacute: "Ó",
        oacute: "ó",
  
        Uacute: "Ú",
        uacute: "ú",
  
        Ntilde: "Ñ",
        ntilde: "ñ",
  
        Udieresis: "Ü",
        udieresis: "ü",
  
        questiondown: "¿",
        exclamdown: "¡",
  
        /*
         * Otros latinos.
         */
        Agrave: "À",
        agrave: "à",
  
        Egrave: "È",
        egrave: "è",
  
        Igrave: "Ì",
        igrave: "ì",
  
        Ograve: "Ò",
        ograve: "ò",
  
        Ugrave: "Ù",
        ugrave: "ù",
  
        Acircumflex: "Â",
        acircumflex: "â",
  
        Ecircumflex: "Ê",
        ecircumflex: "ê",
  
        Icircumflex: "Î",
        icircumflex: "î",
  
        Ocircumflex: "Ô",
        ocircumflex: "ô",
  
        Ucircumflex: "Û",
        ucircumflex: "û",
  
        Adieresis: "Ä",
        adieresis: "ä",
  
        Edieresis: "Ë",
        edieresis: "ë",
  
        Idieresis: "Ï",
        idieresis: "ï",
  
        Odieresis: "Ö",
        odieresis: "ö",
  
        Ccedilla: "Ç",
        ccedilla: "ç",
  
        /*
         * Comillas / puntuación.
         */
        quotedblleft: "“",
        quotedblright: "”",
  
        quoteleft: "‘",
        quoteright: "’",
  
        quotesinglbase: "‚",
        quotedblbase: "„",
  
        endash: "–",
        emdash: "—",
  
        bullet: "•",
        ellipsis: "…",
  
        /*
         * Ligaduras.
         */
        fi: "fi",
        fl: "fl",
        ff: "ff",
        ffi: "ffi",
        ffl: "ffl",
  
        /*
         * Símbolos.
         */
        Euro: "€",
  
        copyright: "©",
        registered: "®",
        trademark: "™",
  
        section: "§",
        paragraph: "¶",
  
        degree: "°",
  
        plusminus: "±",
        multiply: "×",
        divide: "÷",
  
        lessorequal: "≤",
        greaterorequal: "≥",
        notequal: "≠",
  
        infinity: "∞",
      };
  
    const directValue =
      direct[
        normalizedName
      ];
  
    if (
      directValue !==
      undefined
    ) {
      return directValue;
    }
  
    /*
     * A-Z / a-z.
     */
    if (
      /^[A-Za-z]$/.test(
        normalizedName
      )
    ) {
      return normalizedName;
    }
  
    /*
     * Números por nombre PostScript.
     */
    const digits:
      Record<string, string> = {
        zero: "0",
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9",
      };
  
    const digit =
      digits[
        normalizedName
      ];
  
    if (
      digit !==
      undefined
    ) {
      return digit;
    }
  
    /*
     * Adobe glyph name:
     *
     * uni00F1
     *
     * También puede contener varios
     * code units:
     *
     * uni00660069
     *
     * = "fi"
     */
    const uniMatch =
      normalizedName.match(
        /^uni((?:[0-9A-Fa-f]{4})+)$/
      );
  
    if (uniMatch) {
      const hex =
        uniMatch[1];
  
      let result = "";
  
      for (
        let index = 0;
        index <
        hex.length;
        index += 4
      ) {
        const codeUnit =
          Number.parseInt(
            hex.slice(
              index,
              index + 4
            ),
            16
          );
  
        result +=
          String.fromCharCode(
            codeUnit
          );
      }
  
      return result.normalize(
        "NFC"
      );
    }
  
    /*
     * Adobe glyph:
     *
     * u1F600
     */
    const unicodeMatch =
      normalizedName.match(
        /^u([0-9A-Fa-f]{4,6})$/
      );
  
    if (
      unicodeMatch
    ) {
      const codePoint =
        Number.parseInt(
          unicodeMatch[1],
          16
        );
  
      if (
        codePoint <=
        0x10ffff
      ) {
        return String.fromCodePoint(
          codePoint
        );
      }
    }
  
    return undefined;
  }