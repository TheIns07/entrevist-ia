import type {
    HeaderFooterDetectionResult,
  } from "./types";
  
  const REGION_SIZE =
    3;
  
  export class HeaderFooterDetector {
    detect(
      pages:
        string[]
    ): HeaderFooterDetectionResult {
      if (
        pages.length <
        2
      ) {
        return {
          headers:
            new Set<string>(),
  
          footers:
            new Set<string>(),
        };
      }
  
      const headerCounts =
        new Map<
          string,
          number
        >();
  
      const footerCounts =
        new Map<
          string,
          number
        >();
  
      for (
        const page of pages
      ) {
        const lines =
          page
            .split(
              "\n"
            )
            .map(
              (
                line
              ) =>
                line.trim()
            )
            .filter(
              (
                line
              ) =>
                line.length >
                0
            );
  
        const headers =
          lines.slice(
            0,
            REGION_SIZE
          );
  
        const footers =
          lines.slice(
            Math.max(
              0,
              lines.length -
                REGION_SIZE
            )
          );
  
        this.countPageCandidates(
          headers,
          headerCounts
        );
  
        this.countPageCandidates(
          footers,
          footerCounts
        );
      }
  
      const minimumOccurrences =
        Math.max(
          2,
          Math.ceil(
            pages.length *
              0.66
          )
        );
  
      return {
        headers:
          collectRepeated(
            headerCounts,
            minimumOccurrences
          ),
  
        footers:
          collectRepeated(
            footerCounts,
            minimumOccurrences
          ),
      };
    }
  
    fingerprint(
      value:
        string
    ): string {
      let normalized =
        value
          .replace(
            /\s+/g,
            " "
          )
          .trim()
          .toLocaleLowerCase();
  
      /*
       * Permitimos reconocer:
       *
       * Page 1 of 4
       * Page 2 of 4
       *
       * como el mismo footer.
       */
      if (
        /^(page|página)\s+\d+/i.test(
          normalized
        )
      ) {
        normalized =
          normalized.replace(
            /\d+/g,
            "#"
          );
      }
  
      return normalized;
    }
  
    private countPageCandidates(
      candidates:
        string[],
  
      destination:
        Map<
          string,
          number
        >
    ): void {
      const unique =
        new Set<string>();
  
      for (
        const candidate of
          candidates
      ) {
        if (
          !isCandidate(
            candidate
          )
        ) {
          continue;
        }
  
        unique.add(
          this.fingerprint(
            candidate
          )
        );
      }
  
      for (
        const fingerprint of
          unique
      ) {
        destination.set(
          fingerprint,
          (
            destination.get(
              fingerprint
            ) ??
            0
          ) +
            1
        );
      }
    }
  }
  
  function collectRepeated(
    counts:
      Map<
        string,
        number
      >,
  
    minimum:
      number
  ): Set<string> {
    const result =
      new Set<string>();
  
    for (
      const [
        value,
        count,
      ] of counts
    ) {
      if (
        count >=
        minimum
      ) {
        result.add(
          value
        );
      }
    }
  
    return result;
  }
  
  function isCandidate(
    value:
      string
  ): boolean {
    const trimmed =
      value.trim();
  
    if (
      trimmed.length <
        2 ||
      trimmed.length >
        160
    ) {
      return false;
    }
  
    return true;
  }