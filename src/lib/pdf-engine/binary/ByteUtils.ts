const ASCII = {
    PERCENT: 0x25,
  
    HASH: 0x23,
  
    ZERO: 0x30,
  
    NINE: 0x39,
  
    A: 0x41,
  
    F: 0x46,
  
    a: 0x61,
  
    f: 0x66,
  } as const;
  
  export function isPdfWhitespace(
    byte: number
  ): boolean {
    return (
      byte === 0x00 ||
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0c ||
      byte === 0x0d ||
      byte === 0x20
    );
  }
  
  export function isPdfDelimiter(
    byte: number
  ): boolean {
    return (
      byte === 0x28 ||
      byte === 0x29 ||
      byte === 0x3c ||
      byte === 0x3e ||
      byte === 0x5b ||
      byte === 0x5d ||
      byte === 0x7b ||
      byte === 0x7d ||
      byte === 0x2f ||
      byte ===
        ASCII.PERCENT
    );
  }
  
  export function isPdfRegularCharacter(
    byte: number
  ): boolean {
    return (
      !isPdfWhitespace(
        byte
      ) &&
      !isPdfDelimiter(
        byte
      )
    );
  }
  
  export function isAsciiDigit(
    byte: number
  ): boolean {
    return (
      byte >=
        ASCII.ZERO &&
      byte <=
        ASCII.NINE
    );
  }
  
  export function isHexDigit(
    byte: number
  ): boolean {
    return (
      isAsciiDigit(
        byte
      ) ||
      (
        byte >=
          ASCII.A &&
        byte <=
          ASCII.F
      ) ||
      (
        byte >=
          ASCII.a &&
        byte <=
          ASCII.f
      )
    );
  }
  
  export function hexDigitValue(
    byte: number
  ): number {
    if (
      byte >=
        ASCII.ZERO &&
      byte <=
        ASCII.NINE
    ) {
      return (
        byte -
        ASCII.ZERO
      );
    }
  
    if (
      byte >=
        ASCII.A &&
      byte <=
        ASCII.F
    ) {
      return (
        byte -
        ASCII.A +
        10
      );
    }
  
    if (
      byte >=
        ASCII.a &&
      byte <=
        ASCII.f
    ) {
      return (
        byte -
        ASCII.a +
        10
      );
    }
  
    return -1;
  }
  
  export function asciiBytes(
    value: string
  ): Uint8Array {
    const output =
      new Uint8Array(
        value.length
      );
  
    for (
      let index = 0;
      index <
      value.length;
      index += 1
    ) {
      output[index] =
        value.charCodeAt(
          index
        ) & 0xff;
    }
  
    return output;
  }
  
  export function bytesToLatin1(
    bytes: Uint8Array
  ): string {
    const chunkSize =
      0x8000;
  
    let result = "";
  
    for (
      let offset = 0;
      offset <
      bytes.length;
      offset += chunkSize
    ) {
      const end =
        Math.min(
          offset +
            chunkSize,
  
          bytes.length
        );
  
      const chunk =
        bytes.subarray(
          offset,
          end
        );
  
      result +=
        String.fromCharCode(
          ...chunk
        );
    }
  
    return result;
  }
  
  export function bytesEqualAt(
    bytes: Uint8Array,
  
    pattern: Uint8Array,
  
    offset: number
  ): boolean {
    if (
      offset < 0 ||
      offset +
        pattern.length >
        bytes.length
    ) {
      return false;
    }
  
    for (
      let index = 0;
      index <
      pattern.length;
      index += 1
    ) {
      if (
        bytes[
          offset +
            index
        ] !==
        pattern[index]
      ) {
        return false;
      }
    }
  
    return true;
  }
  
  export function findForward(
    bytes: Uint8Array,
  
    pattern: Uint8Array,
  
    start = 0,
  
    end =
      bytes.length
  ): number {
    if (
      pattern.length ===
      0
    ) {
      return Math.max(
        0,
  
        Math.min(
          start,
          bytes.length
        )
      );
    }
  
    const safeStart =
      Math.max(
        0,
        start
      );
  
    const safeEnd =
      Math.min(
        end,
        bytes.length
      );
  
    const lastPossible =
      safeEnd -
      pattern.length;
  
    outer: for (
      let offset =
        safeStart;
  
      offset <=
      lastPossible;
  
      offset += 1
    ) {
      for (
        let index = 0;
  
        index <
        pattern.length;
  
        index += 1
      ) {
        if (
          bytes[
            offset +
              index
          ] !==
          pattern[index]
        ) {
          continue outer;
        }
      }
  
      return offset;
    }
  
    return -1;
  }
  
  export function findBackward(
    bytes: Uint8Array,
  
    pattern: Uint8Array,
  
    start =
      bytes.length -
      pattern.length,
  
    min = 0
  ): number {
    if (
      pattern.length ===
      0
    ) {
      return Math.max(
        0,
  
        Math.min(
          start,
          bytes.length
        )
      );
    }
  
    const safeStart =
      Math.min(
        start,
  
        bytes.length -
          pattern.length
      );
  
    const safeMin =
      Math.max(
        0,
        min
      );
  
    outer: for (
      let offset =
        safeStart;
  
      offset >=
      safeMin;
  
      offset -= 1
    ) {
      for (
        let index = 0;
  
        index <
        pattern.length;
  
        index += 1
      ) {
        if (
          bytes[
            offset +
              index
          ] !==
          pattern[index]
        ) {
          continue outer;
        }
      }
  
      return offset;
    }
  
    return -1;
  }
  
  /*
   * Los names PDF pueden contener:
   *
   * /Some#20Name
   *
   * donde #20 representa un byte
   * hexadecimal.
   */
  export function decodePdfName(
    raw: Uint8Array
  ): string {
    const decoded:
      number[] = [];
  
    for (
      let index = 0;
  
      index <
      raw.length;
  
      index += 1
    ) {
      const byte =
        raw[index];
  
      if (
        byte ===
          ASCII.HASH &&
        index + 2 <
          raw.length
      ) {
        const high =
          hexDigitValue(
            raw[
              index + 1
            ]
          );
  
        const low =
          hexDigitValue(
            raw[
              index + 2
            ]
          );
  
        if (
          high >= 0 &&
          low >= 0
        ) {
          decoded.push(
            (
              high << 4
            ) | low
          );
  
          index += 2;
  
          continue;
        }
      }
  
      decoded.push(
        byte
      );
    }
  
    return bytesToLatin1(
      Uint8Array.from(
        decoded
      )
    );
  }
  
  export function trimTrailingLineBreak(
    bytes: Uint8Array
  ): Uint8Array {
    let end =
      bytes.length;
  
    if (
      end > 0 &&
      bytes[
        end - 1
      ] === 0x0a
    ) {
      end -= 1;
    }
  
    if (
      end > 0 &&
      bytes[
        end - 1
      ] === 0x0d
    ) {
      end -= 1;
    }
  
    return bytes.subarray(
      0,
      end
    );
  }