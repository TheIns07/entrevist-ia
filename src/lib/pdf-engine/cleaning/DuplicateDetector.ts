import type {
    CleaningLine,
    RemovedTextFragment,
  } from "./types";
  
  export interface DuplicateRemovalResult {
    lines:
      CleaningLine[];
  
    removed:
      RemovedTextFragment[];
  }
  
  export class DuplicateDetector {
    removeConsecutive(
      lines:
        CleaningLine[],
  
      pageNumber:
        number
    ): DuplicateRemovalResult {
      const output:
        CleaningLine[] = [];
  
      const removed:
        RemovedTextFragment[] = [];
  
      let previousFingerprint:
        string | undefined;
  
      for (
        const line of lines
      ) {
        const trimmed =
          line.text.trim();
  
        if (
          trimmed.length ===
          0
        ) {
          output.push(
            line
          );
  
          previousFingerprint =
            undefined;
  
          continue;
        }
  
        const fingerprint =
          createFingerprint(
            trimmed
          );
  
        if (
          fingerprint ===
          previousFingerprint
        ) {
          removed.push({
            page:
              pageNumber,
  
            lineNumber:
              line.lineNumber,
  
            text:
              line.text,
  
            reason:
              "duplicate",
          });
  
          continue;
        }
  
        output.push(
          line
        );
  
        previousFingerprint =
          fingerprint;
      }
  
      return {
        lines:
          output,
  
        removed,
      };
    }
  }
  
  function createFingerprint(
    value: string
  ): string {
    return value
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .toLocaleLowerCase();
  }