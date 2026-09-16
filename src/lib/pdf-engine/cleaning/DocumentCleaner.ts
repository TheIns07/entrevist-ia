import {
    DuplicateDetector,
  } from "./DuplicateDetector";
  
  import {
    HeaderFooterDetector,
  } from "./HeaderFooterDetector";
  
  import {
    HyphenationResolver,
  } from "./HyphenationResolver";
  
  import {
    LineWrapResolver,
  } from "./LineWrapResolver";
  
  import {
    NoiseDetector,
  } from "./NoiseDetector";
  
  import type {
    CleaningLine,
    CleanPageResult,
    DocumentCleaningResult,
    RemovedTextFragment,
  } from "./types";
  
  import {
    UnicodeNormalizer,
  } from "./UnicodeNormalizer";
  
  const HEADER_FOOTER_REGION_SIZE =
    3;
  
  export class DocumentCleaner {
    private readonly unicodeNormalizer =
      new UnicodeNormalizer();
  
    private readonly duplicateDetector =
      new DuplicateDetector();
  
    private readonly headerFooterDetector =
      new HeaderFooterDetector();
  
    private readonly noiseDetector =
      new NoiseDetector();
  
    private readonly hyphenationResolver =
      new HyphenationResolver();
  
    private readonly lineWrapResolver =
      new LineWrapResolver();
  
    clean(
      pageTexts:
        string[]
    ): DocumentCleaningResult {
      const normalizedPages =
        pageTexts.map(
          (
            text
          ) =>
            this.unicodeNormalizer.normalize(
              text
            )
        );
  
      const headerFooter =
        this.headerFooterDetector.detect(
          normalizedPages
        );
  
      const pages:
        CleanPageResult[] = [];
  
      const removed:
        RemovedTextFragment[] = [];
  
      for (
        let index = 0;
        index <
        normalizedPages.length;
        index += 1
      ) {
        const pageNumber =
          index + 1;
  
        const originalText =
          pageTexts[index] ??
          "";
  
        const normalizedText =
          normalizedPages[index] ??
          "";
  
        const pageResult =
          this.cleanPage(
            normalizedText,
            originalText,
            pageNumber,
            headerFooter.headers,
            headerFooter.footers
          );
  
        pages.push(
          pageResult
        );
  
        removed.push(
          ...pageResult.removed
        );
      }
  
      const cleanText =
        pages
          .map(
            (
              page
            ) =>
              page.cleanText
                .trim()
          )
          .filter(
            Boolean
          )
          .join(
            "\n\n"
          )
          .replace(
            /\n{3,}/g,
            "\n\n"
          )
          .trim()
          .normalize(
            "NFC"
          );
  
      return {
        cleanText,
  
        pages,
  
        removed,
      };
    }
  
    private cleanPage(
      normalizedText:
        string,
  
      originalText:
        string,
  
      pageNumber:
        number,
  
      headers:
        Set<string>,
  
      footers:
        Set<string>
    ): CleanPageResult {
      const rawLines =
        normalizedText.split(
          "\n"
        );
  
      let lines:
        CleaningLine[] =
          rawLines.map(
            (
              text,
              lineNumber
            ) => ({
              text,
  
              lineNumber:
                lineNumber +
                1,
            })
          );
  
      const removed:
        RemovedTextFragment[] = [];
  
      /*
       * =====================================================
       * HEADERS / FOOTERS
       * =====================================================
       */
  
      const nonEmpty =
        lines.filter(
          (
            line
          ) =>
            line.text.trim()
              .length >
            0
        );
  
      const headerLineNumbers =
        new Set(
          nonEmpty
            .slice(
              0,
              HEADER_FOOTER_REGION_SIZE
            )
            .map(
              (
                line
              ) =>
                line.lineNumber
            )
        );
  
      const footerLineNumbers =
        new Set(
          nonEmpty
            .slice(
              Math.max(
                0,
                nonEmpty.length -
                  HEADER_FOOTER_REGION_SIZE
              )
            )
            .map(
              (
                line
              ) =>
                line.lineNumber
            )
        );
  
      lines =
        lines.filter(
          (
            line
          ) => {
            const text =
              line.text.trim();
  
            if (
              text.length ===
              0
            ) {
              return true;
            }
  
            const fingerprint =
              this.headerFooterDetector.fingerprint(
                text
              );
  
            if (
              headerLineNumbers.has(
                line.lineNumber
              ) &&
              headers.has(
                fingerprint
              )
            ) {
              removed.push({
                page:
                  pageNumber,
  
                lineNumber:
                  line.lineNumber,
  
                text:
                  line.text,
  
                reason:
                  "header",
              });
  
              return false;
            }
  
            if (
              footerLineNumbers.has(
                line.lineNumber
              ) &&
              footers.has(
                fingerprint
              )
            ) {
              removed.push({
                page:
                  pageNumber,
  
                lineNumber:
                  line.lineNumber,
  
                text:
                  line.text,
  
                reason:
                  "footer",
              });
  
              return false;
            }
  
            return true;
          }
        );
  
      /*
       * =====================================================
       * NOISE
       * =====================================================
       */
  
      const sanitized:
        CleaningLine[] = [];
  
      for (
        const line of lines
      ) {
        const text =
          this.noiseDetector.sanitize(
            line.text
          );
  
        if (
          this.noiseDetector.isNoise(
            text
          )
        ) {
          removed.push({
            page:
              pageNumber,
  
            lineNumber:
              line.lineNumber,
  
            text:
              line.text,
  
            reason:
              "noise",
          });
  
          continue;
        }
  
        sanitized.push({
          ...line,
  
          text,
        });
      }
  
      /*
       * =====================================================
       * DUPLICATES
       * =====================================================
       */
  
      const duplicates =
        this.duplicateDetector.removeConsecutive(
          sanitized,
          pageNumber
        );
  
      removed.push(
        ...duplicates.removed
      );
  
      let text =
        duplicates.lines
          .map(
            (
              line
            ) =>
              line.text
          )
          .join(
            "\n"
          );
  
      /*
       * =====================================================
       * WORD / LINE RECONSTRUCTION
       * =====================================================
       */
  
      text =
        this.hyphenationResolver.resolve(
          text
        );
  
      text =
        this.lineWrapResolver.resolve(
          text
        );
  
      text =
        finalizeWhitespace(
          text
        );
  
      return {
        pageNumber,
  
        originalText,
  
        cleanText:
          text,
  
        removed,
      };
    }
  }
  
  function finalizeWhitespace(
    input:
      string
  ): string {
    return input
      .replace(
        /[ \t]+\n/g,
        "\n"
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /[ ]{2,}/g,
        " "
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim()
      .normalize(
        "NFC"
      );
  }