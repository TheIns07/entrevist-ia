export class LineWrapResolver {
    resolve(
      input:
        string
    ): string {
      const sourceLines =
        input.split(
          "\n"
        );
  
      const output:
        string[] = [];
  
      let current =
        "";
  
      const flush =
        (): void => {
          const trimmed =
            current.trim();
  
          if (
            trimmed.length >
            0
          ) {
            output.push(
              trimmed
            );
          }
  
          current =
            "";
        };
  
      for (
        const sourceLine of
          sourceLines
      ) {
        const line =
          sourceLine
            .replace(
              /[ ]{2,}/g,
              " "
            )
            .trim();
  
        if (
          line.length ===
          0
        ) {
          flush();
  
          if (
            output.length >
              0 &&
            output[
              output.length -
                1
            ] !==
              ""
          ) {
            output.push(
              ""
            );
          }
  
          continue;
        }
  
        if (
          current.length ===
          0
        ) {
          current =
            line;
  
          continue;
        }
  
        if (
          shouldJoin(
            current,
            line
          )
        ) {
          current =
            joinLines(
              current,
              line
            );
  
          continue;
        }
  
        flush();
  
        current =
          line;
      }
  
      flush();
  
      return output
        .join(
          "\n"
        )
        .replace(
          /\n{3,}/g,
          "\n\n"
        )
        .trim();
    }
  }

  function startsWithFieldLabel(
    value:
      string
  ): boolean {
    const text =
      value.trim();
  
    /*
     * Detecta estructuras como:
     *
     * Languages:
     * Languages: English, Spanish
     * Skills: Java, Kotlin
     * Nationality: Mexican
     * Interests: Running
     *
     * No dependemos del nombre
     * concreto del campo.
     */
    return /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ0-9 &/()+.'’-]{1,35}:\s*/.test(
      text
    );
  }
  
  function shouldJoin(
    current:
      string,
  
    next:
      string
  ): boolean {
    if (
      isBullet(
        next
      )
    ) {
      return false;
    }
  
    /*
     * Fechas suelen marcar nuevas
     * entradas de experiencia.
     */
    if (
      isDateLike(
        next
      )
    ) {
      return false;
    }

    if (
      startsWithFieldLabel(
        next
      )
    ) {
      return false;
    }
  
    /*
     * Un heading corto debe conservar
     * su propia línea.
     */
    if (
      isLikelyHeading(
        current
      )
    ) {
      return false;
    }
  
    const lastWord =
      getLastWord(
        current
      );
  
    /*
     * Casos como:
     *
     * "President of the"
     * "Oxford Runners Club"
     */
    if (
      CONTINUATION_WORDS.has(
        lastWord
      )
    ) {
      return true;
    }
  
    /*
     * Una coma, slash o ampersand
     * prácticamente garantizan
     * continuación.
     */
    if (
      /[,/&]$/.test(
        current
      )
    ) {
      return true;
    }
  
    /*
     * Si la siguiente línea comienza
     * con minúscula es casi seguro que
     * se trata de wrapping visual.
     */
    if (
      startsWithLowercase(
        next
      )
    ) {
      return true;
    }
  
    /*
     * Una línea larga sin puntuación
     * terminal es normalmente un
     * párrafo partido visualmente.
     */
    if (
      current.length >=
        90 &&
      !hasTerminalPunctuation(
        current
      )
    ) {
      return true;
    }
  
    /*
     * Los bullets suelen continuar
     * visualmente en las siguientes
     * líneas.
     */
    if (
      isBullet(
        current
      ) &&
      !isLikelyHeading(
        next
      )
    ) {
      return true;
    }
  
    return false;
  }
  
  function joinLines(
    left:
      string,
  
    right:
      string
  ): string {
    if (
      left.endsWith(
        " "
      )
    ) {
      return (
        left +
        right
      );
    }
  
    return (
      left +
      " " +
      right
    );
  }
  
  function isBullet(
    value:
      string
  ): boolean {
    return /^[•◦▪‣]\s*/.test(
      value
    );
  }
  
  function startsWithLowercase(
    value:
      string
  ): boolean {
    const normalized =
      value.replace(
        /^[\s"'“”‘’([{]+/,
        ""
      );
  
    return /^[a-zà-öø-ÿ]/.test(
      normalized
    );
  }
  
  function hasTerminalPunctuation(
    value:
      string
  ): boolean {
    return /[.!?]["'”’)\]]?$/.test(
      value.trim()
    );
  }
  
  function getLastWord(
    value:
      string
  ): string {
    const match =
      value
        .toLocaleLowerCase()
        .match(
          /([a-zà-öø-ÿ]+)[^a-zà-öø-ÿ]*$/
        );
  
    return (
      match?.[1] ??
      ""
    );
  }
  
  function isDateLike(
    value:
      string
  ): boolean {
    return /^(?:(?:[A-Z][a-z]{2})-\d{2}|\d{4})\s*[-–—]/.test(
      value
    );
  }
  
  function isLikelyHeading(
    value:
      string
  ): boolean {
    const text =
      value.trim();
  
    if (
      text.length ===
        0 ||
      text.length >
        70
    ) {
      return false;
    }
  
    if (
      isBullet(
        text
      ) ||
      isDateLike(
        text
      )
    ) {
      return false;
    }
  
    if (
      /[.!?]$/.test(
        text
      )
    ) {
      return false;
    }
  
    const words =
      text
        .split(
          /\s+/
        )
        .filter(
          Boolean
        );
  
    if (
      words.length ===
        0 ||
      words.length >
        8
    ) {
      return false;
    }
  
    const letters =
      text.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿ]/g,
        ""
      );
  
    if (
      letters.length >=
        3 &&
      letters ===
        letters.toUpperCase()
    ) {
      return true;
    }
  
    const alphaWords =
      words.filter(
        (
          word
        ) =>
          /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(
            word
          )
      );
  
    if (
      alphaWords.length ===
      0
    ) {
      return false;
    }
  
    const titleWords =
      alphaWords.filter(
        (
          word
        ) =>
          /^[A-ZÀ-ÖØ-Þ]/.test(
            word
          )
      );
  
    return (
      titleWords.length /
        alphaWords.length >=
      0.65
    );
  }
  
  const CONTINUATION_WORDS =
    new Set<string>([
      "a",
      "an",
      "and",
      "as",
      "at",
      "by",
      "de",
      "del",
      "el",
      "en",
      "for",
      "from",
      "if",
      "in",
      "la",
      "las",
      "los",
      "of",
      "on",
      "or",
      "para",
      "por",
      "que",
      "the",
      "to",
      "with",
      "y",
    ]);