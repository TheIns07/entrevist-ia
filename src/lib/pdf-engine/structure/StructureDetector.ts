import type {
    DetectedHeading,
    DocumentStructure,
  } from "./types";
  
  export class StructureDetector {
    detect(
      text:
        string
    ): DocumentStructure {
      const lines =
        text.split(
          "\n"
        );
  
      const headings:
        DetectedHeading[] = [];
  
      let nonEmptyLineCount =
        0;
  
      for (
        let index = 0;
        index <
        lines.length;
        index += 1
      ) {
        const line =
          (
            lines[index] ??
            ""
          ).trim();
  
        if (
          line.length ===
          0
        ) {
          continue;
        }
  
        nonEmptyLineCount +=
          1;
  
        const previous =
          index > 0
            ? (
                lines[
                  index - 1
                ] ??
                ""
              ).trim()
            : "";
  
        const next =
          index <
            lines.length - 1
            ? (
                lines[
                  index + 1
                ] ??
                ""
              ).trim()
            : "";
  
        const headingConfidence =
          getHeadingConfidence(
            line,
            previous,
            next
          );
  
        if (
          headingConfidence >=
          0.65
        ) {
          headings.push({
            text:
              line,
  
            lineIndex:
              index,
  
            confidence:
              headingConfidence,
          });
        }
      }
  
      const paragraphCount =
        text
          .split(
            /\n\s*\n/
          )
          .map(
            (
              paragraph
            ) =>
              paragraph.trim()
          )
          .filter(
            Boolean
          )
          .length;
  
      const hasEmail =
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
          text
        );
  
      const hasPhone =
        detectPhone(
          text
        );
  
      const hasDates =
        detectDates(
          text
        );
  
      const hasBullets =
        /(?:^|\n)\s*[•▪◦‣*-]\s+/m.test(
          text
        );
  
      const structureSignals = [
        nonEmptyLineCount >=
          3,
  
        paragraphCount >=
          2,
  
        headings.length >=
          1,
  
        hasEmail ||
          hasPhone,
  
        hasDates,
  
        hasBullets,
      ];
  
      const positiveSignals =
        structureSignals.filter(
          Boolean
        ).length;
  
      const confidence =
        Math.min(
          1,
  
          positiveSignals /
            structureSignals.length
        );
  
      return {
        lineCount:
          lines.length,
  
        nonEmptyLineCount,
  
        paragraphCount,
  
        headingCount:
          headings.length,
  
        headings,
  
        hasEmail,
  
        hasPhone,
  
        hasDates,
  
        hasBullets,
  
        confidence,
      };
    }
  }
  
  function getHeadingConfidence(
    text:
      string,
  
    previous:
      string,
  
    next:
      string
  ): number {
    if (
      text.length <
        2 ||
      text.length >
        80
    ) {
      return 0;
    }
  
    if (
      /^[•▪◦‣*-]\s+/.test(
        text
      )
    ) {
      return 0;
    }
  
    if (
      /[.!?]["'”’)\]]?$/.test(
        text
      )
    ) {
      return 0;
    }
  
    if (
      isDateLike(
        text
      )
    ) {
      return 0;
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
        9
    ) {
      return 0;
    }
  
    let score =
      0.25;
  
    if (
      previous.length ===
      0
    ) {
      score +=
        0.2;
    }
  
    if (
      next.length ===
      0
    ) {
      score +=
        0.1;
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
      score +=
        0.35;
    } else {
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
        alphaWords.length >
        0
      ) {
        const titleCaseWords =
          alphaWords.filter(
            (
              word
            ) =>
              /^[A-ZÀ-ÖØ-Þ]/.test(
                word
              )
          );
  
        const titleCaseRatio =
          titleCaseWords.length /
          alphaWords.length;
  
        score +=
          titleCaseRatio *
          0.35;
      }
    }
  
    if (
      /:$/.test(
        text
      )
    ) {
      score +=
        0.1;
    }
  
    return Math.min(
      1,
      score
    );
  }
  
  function detectPhone(
    text:
      string
  ): boolean {
    const candidates =
      text.match(
        /\+?\d[\d\s().-]{6,}\d/g
      ) ??
      [];
  
    for (
      const candidate of
        candidates
    ) {
      const digits =
        candidate.replace(
          /\D/g,
          ""
        );
  
      if (
        digits.length >=
          9 &&
        digits.length <=
          15
      ) {
        return true;
      }
    }
  
    return false;
  }
  
  function detectDates(
    text:
      string
  ): boolean {
    return (
      /\b(?:19|20)\d{2}\b/.test(
        text
      ) ||
      /\b[A-Z][a-z]{2}-\d{2}\b/.test(
        text
      ) ||
      /\b(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*[\s-]+\d{2,4}\b/i.test(
        text
      )
    );
  }
  
  function isDateLike(
    text:
      string
  ): boolean {
    return (
      /^(?:(?:19|20)\d{2}|[A-Z][a-z]{2}-\d{2})\s*[-–—]/.test(
        text
      )
    );
  }