export class UnicodeNormalizer {
    normalize(
      input: string
    ): string {
      return input
        .replace(
          /\r\n?/g,
          "\n"
        )
        .replace(
          /[\u00A0\u202F]/g,
          " "
        )
        .replace(
          /[\u200B-\u200D\uFEFF]/g,
          ""
        )
        .replace(
          /\u00AD/g,
          ""
        )
        .replace(
          /[\uF0B7\u2023\u2043\u25CF\u25E6]/g,
          "•"
        )
        .replace(
          /\t/g,
          " "
        )
        .replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
          ""
        )
        .normalize(
          "NFC"
        );
    }
  
    normalizeLine(
      input: string
    ): string {
      return this.normalize(
        input
      )
        .replace(
          /[ ]{2,}/g,
          " "
        )
        .trim();
    }
  }