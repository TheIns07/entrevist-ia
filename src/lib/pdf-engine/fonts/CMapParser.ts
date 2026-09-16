export interface PdfCodeSpaceRange {
    start: Uint8Array;
    end: Uint8Array;
  }
  
  export interface PdfCMapEntry {
    source: Uint8Array;
    destination: Uint8Array;
  }
  
  export interface PdfParsedCMap {
    codeSpaceRanges: PdfCodeSpaceRange[];
    mappings: PdfCMapEntry[];
  }
  
  type CMapToken =
    | {
        type: "hex";
        value: Uint8Array;
      }
    | {
        type: "number";
        value: number;
      }
    | {
        type: "keyword";
        value: string;
      }
    | {
        type: "arrayStart";
      }
    | {
        type: "arrayEnd";
      };
  
  export class CMapParser {
    static parse(
      bytes: Uint8Array
    ): PdfParsedCMap {
      const text =
        decodeAscii(
          bytes
        );
  
      const tokens =
        tokenizeCMap(
          text
        );
  
      const codeSpaceRanges:
        PdfCodeSpaceRange[] =
          [];
  
      const mappings:
        PdfCMapEntry[] =
          [];
  
      let index = 0;
  
      while (
        index <
        tokens.length
      ) {
        const token =
          tokens[index];
  
        if (
          token.type !==
          "keyword"
        ) {
          index += 1;
          continue;
        }
  
        switch (
          token.value
        ) {
          case "begincodespacerange": {
            index += 1;
  
            while (
              index <
              tokens.length
            ) {
              const current =
                tokens[index];
  
              if (
                current.type ===
                  "keyword" &&
                current.value ===
                  "endcodespacerange"
              ) {
                index += 1;
                break;
              }
  
              const start =
                tokens[index];
  
              const end =
                tokens[
                  index + 1
                ];
  
              if (
                start?.type ===
                  "hex" &&
                end?.type ===
                  "hex"
              ) {
                codeSpaceRanges.push({
                  start:
                    start.value,
                  end:
                    end.value,
                });
  
                index += 2;
                continue;
              }
  
              index += 1;
            }
  
            break;
          }
  
          case "beginbfchar": {
            index += 1;
  
            while (
              index <
              tokens.length
            ) {
              const current =
                tokens[index];
  
              if (
                current.type ===
                  "keyword" &&
                current.value ===
                  "endbfchar"
              ) {
                index += 1;
                break;
              }
  
              const source =
                tokens[index];
  
              const destination =
                tokens[
                  index + 1
                ];
  
              if (
                source?.type ===
                  "hex" &&
                destination?.type ===
                  "hex"
              ) {
                mappings.push({
                  source:
                    source.value,
                  destination:
                    destination.value,
                });
  
                index += 2;
                continue;
              }
  
              index += 1;
            }
  
            break;
          }
  
          case "beginbfrange": {
            index += 1;
  
            while (
              index <
              tokens.length
            ) {
              const current =
                tokens[index];
  
              if (
                current.type ===
                  "keyword" &&
                current.value ===
                  "endbfrange"
              ) {
                index += 1;
                break;
              }
  
              const startToken =
                tokens[index];
  
              const endToken =
                tokens[
                  index + 1
                ];
  
              const destinationToken =
                tokens[
                  index + 2
                ];
  
              if (
                startToken?.type !==
                  "hex" ||
                endToken?.type !==
                  "hex"
              ) {
                index += 1;
                continue;
              }
  
              const startCode =
                bytesToInteger(
                  startToken.value
                );
  
              const endCode =
                bytesToInteger(
                  endToken.value
                );
  
              if (
                endCode <
                startCode
              ) {
                index += 3;
                continue;
              }
  
              /*
               * Forma:
               *
               * <01> <03> <0041>
               */
              if (
                destinationToken?.type ===
                "hex"
              ) {
                for (
                  let code =
                    startCode;
  
                  code <=
                  endCode;
  
                  code += 1
                ) {
                  const source =
                    integerToBytes(
                      code,
                      startToken
                        .value
                        .length
                    );
  
                  const offset =
                    code -
                    startCode;
  
                  const destination =
                    incrementBigEndian(
                      destinationToken.value,
                      offset
                    );
  
                  mappings.push({
                    source,
                    destination,
                  });
                }
  
                index += 3;
                continue;
              }
  
              /*
               * Forma:
               *
               * <01> <03>
               * [
               *   <0041>
               *   <0042>
               *   <0043>
               * ]
               */
              if (
                destinationToken?.type ===
                "arrayStart"
              ) {
                index += 3;
  
                let code =
                  startCode;
  
                while (
                  index <
                    tokens.length &&
                  code <=
                    endCode
                ) {
                  const arrayToken =
                    tokens[index];
  
                  if (
                    arrayToken.type ===
                    "arrayEnd"
                  ) {
                    index += 1;
                    break;
                  }
  
                  if (
                    arrayToken.type ===
                    "hex"
                  ) {
                    mappings.push({
                      source:
                        integerToBytes(
                          code,
                          startToken
                            .value
                            .length
                        ),
  
                      destination:
                        arrayToken.value,
                    });
  
                    code += 1;
                  }
  
                  index += 1;
                }
  
                continue;
              }
  
              index += 1;
            }
  
            break;
          }
  
          default:
            index += 1;
            break;
        }
      }
  
      return {
        codeSpaceRanges,
        mappings,
      };
    }
  }
  
  function tokenizeCMap(
    text: string
  ): CMapToken[] {
    const tokens:
      CMapToken[] = [];
  
    let index = 0;
  
    while (
      index <
      text.length
    ) {
      const char =
        text[index];
  
      if (
        isWhitespace(
          char
        )
      ) {
        index += 1;
        continue;
      }
  
      /*
       * Comentarios CMap.
       */
      if (
        char === "%"
      ) {
        while (
          index <
            text.length &&
          text[index] !==
            "\n" &&
          text[index] !==
            "\r"
        ) {
          index += 1;
        }
  
        continue;
      }
  
      if (
        char === "["
      ) {
        tokens.push({
          type:
            "arrayStart",
        });
  
        index += 1;
        continue;
      }
  
      if (
        char === "]"
      ) {
        tokens.push({
          type:
            "arrayEnd",
        });
  
        index += 1;
        continue;
      }
  
      /*
       * Hex string CMap.
       *
       * Ignoramos << >>.
       */
      if (
        char === "<" &&
        text[
          index + 1
        ] !== "<"
      ) {
        const end =
          text.indexOf(
            ">",
            index + 1
          );
  
        if (
          end === -1
        ) {
          break;
        }
  
        const raw =
          text
            .slice(
              index + 1,
              end
            )
            .replace(
              /\s+/g,
              ""
            );
  
        tokens.push({
          type: "hex",
          value:
            hexToBytes(
              raw
            ),
        });
  
        index =
          end + 1;
  
        continue;
      }
  
      /*
       * Dictionary delimiters.
       */
      if (
        text.startsWith(
          "<<",
          index
        ) ||
        text.startsWith(
          ">>",
          index
        )
      ) {
        index += 2;
        continue;
      }
  
      const start =
        index;
  
      while (
        index <
          text.length &&
        !isWhitespace(
          text[index]
        ) &&
        ![
          "<",
          ">",
          "[",
          "]",
        ].includes(
          text[index]
        )
      ) {
        index += 1;
      }
  
      const value =
        text.slice(
          start,
          index
        );
  
      if (
        /^[-+]?\d+$/.test(
          value
        )
      ) {
        tokens.push({
          type:
            "number",
  
          value:
            Number(
              value
            ),
        });
      } else if (
        value.length >
        0
      ) {
        tokens.push({
          type:
            "keyword",
  
          value,
        });
      }
    }
  
    return tokens;
  }
  
  function hexToBytes(
    value: string
  ): Uint8Array {
    const normalized =
      value.length %
        2 ===
      0
        ? value
        : `${value}0`;
  
    const result =
      new Uint8Array(
        normalized.length /
          2
      );
  
    for (
      let index = 0;
      index <
      normalized.length;
      index += 2
    ) {
      result[
        index / 2
      ] =
        Number.parseInt(
          normalized.slice(
            index,
            index + 2
          ),
          16
        );
    }
  
    return result;
  }
  
  export function bytesToInteger(
    bytes: Uint8Array
  ): number {
    let value = 0;
  
    for (
      const byte of bytes
    ) {
      value =
        value *
          256 +
        byte;
    }
  
    return value;
  }
  
  export function integerToBytes(
    value: number,
    length: number
  ): Uint8Array {
    const result =
      new Uint8Array(
        length
      );
  
    let remaining =
      value;
  
    for (
      let index =
        length - 1;
      index >= 0;
      index -= 1
    ) {
      result[index] =
        remaining &
        0xff;
  
      remaining =
        Math.floor(
          remaining /
            256
        );
    }
  
    return result;
  }
  
  function incrementBigEndian(
    source: Uint8Array,
    increment: number
  ): Uint8Array {
    const result =
      new Uint8Array(
        source
      );
  
    let carry =
      increment;
  
    for (
      let index =
        result.length - 1;
  
      index >= 0 &&
      carry > 0;
  
      index -= 1
    ) {
      const value =
        result[index] +
        (
          carry &
          0xff
        );
  
      result[index] =
        value &
        0xff;
  
      carry =
        Math.floor(
          carry /
            256
        ) +
        (
          value >
          0xff
            ? 1
            : 0
        );
    }
  
    return result;
  }
  
  function decodeAscii(
    bytes: Uint8Array
  ): string {
    let result = "";
  
    for (
      const byte of bytes
    ) {
      result +=
        String.fromCharCode(
          byte
        );
    }
  
    return result;
  }
  
  function isWhitespace(
    char: string
  ): boolean {
    return (
      char === " " ||
      char === "\t" ||
      char === "\r" ||
      char === "\n" ||
      char === "\f"
    );
  }