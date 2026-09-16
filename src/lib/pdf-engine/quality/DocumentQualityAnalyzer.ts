import type {
    PdfWarning,
  } from "../types";
  
  import {
    TrustScore,
  } from "./TrustScore";
  
  import type {
    DocumentQuality,
    DocumentQualityLevel,
    DocumentQualityMetric,
  } from "./types";
  
  export interface DocumentQualityInput {
    cleanText: string;
  
    structureConfidence:
      number;
  
    warnings:
      PdfWarning[];
  }
  
  export class DocumentQualityAnalyzer {
    analyze(
      input:
        DocumentQualityInput
    ): DocumentQuality {
      const text =
        input.cleanText;
  
      const textPresence =
        calculateTextPresence(
          text
        );
  
      const unicodeIntegrity =
        calculateUnicodeIntegrity(
          text
        );
  
      const continuity =
        calculateContinuity(
          text
        );
  
      const warningIntegrity =
        calculateWarningIntegrity(
          input.warnings
        );
  
      const structureIntegrity =
        TrustScore.clamp(
          input.structureConfidence
        );
  
      const metrics:
        DocumentQualityMetric[] = [
          {
            name:
              "text-presence",
  
            score:
              textPresence,
  
            weight:
              0.2,
          },
          {
            name:
              "unicode-integrity",
  
            score:
              unicodeIntegrity,
  
            weight:
              0.25,
          },
          {
            name:
              "structure-integrity",
  
            score:
              structureIntegrity,
  
            weight:
              0.25,
          },
          {
            name:
              "text-continuity",
  
            score:
              continuity,
  
            weight:
              0.2,
          },
          {
            name:
              "warning-integrity",
  
            score:
              warningIntegrity,
  
            weight:
              0.1,
          },
        ];
  
      const score =
        TrustScore.calculate(
          metrics.map(
            (
              metric
            ) => ({
              value:
                metric.score,
  
              weight:
                metric.weight,
            })
          )
        );
  
      const issues:
        string[] = [];
  
      if (
        textPresence <
        0.55
      ) {
        issues.push(
          "LOW_TEXT_VOLUME"
        );
      }
  
      if (
        unicodeIntegrity <
        0.9
      ) {
        issues.push(
          "UNICODE_QUALITY"
        );
      }
  
      if (
        structureIntegrity <
        0.55
      ) {
        issues.push(
          "LOW_STRUCTURE_CONFIDENCE"
        );
      }
  
      if (
        continuity <
        0.75
      ) {
        issues.push(
          "FRAGMENTED_TEXT"
        );
      }
  
      if (
        warningIntegrity <
        0.7
      ) {
        issues.push(
          "PDF_WARNINGS"
        );
      }
  
      return {
        score,
  
        level:
          getQualityLevel(
            score
          ),
  
        metrics,
  
        issues,
      };
    }
  }
  
  function calculateTextPresence(
    text:
      string
  ): number {
    const meaningful =
      text
        .replace(
          /\s/g,
          ""
        )
        .length;
  
    if (
      meaningful ===
      0
    ) {
      return 0;
    }
  
    return Math.min(
      1,
      meaningful /
        800
    );
  }
  
  function calculateUnicodeIntegrity(
    text:
      string
  ): number {
    if (
      text.length ===
      0
    ) {
      return 0;
    }
  
    let suspicious =
      0;
  
    for (
      const character of
        text
    ) {
      const code =
        character.charCodeAt(
          0
        );
  
      if (
        character ===
          "\uFFFD" ||
        (
          code >=
            0xe000 &&
          code <=
            0xf8ff
        )
      ) {
        suspicious +=
          1;
      }
    }
  
    const ratio =
      suspicious /
      text.length;
  
    return TrustScore.clamp(
      1 -
        ratio *
          25
    );
  }
  
  function calculateContinuity(
    text:
      string
  ): number {
    const lines =
      text
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
          Boolean
        );
  
    if (
      lines.length ===
      0
    ) {
      return 0;
    }
  
    let fragmented =
      0;
  
    for (
      const line of lines
    ) {
      if (
        /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]$/.test(
          line
        )
      ) {
        fragmented +=
          1;
      }
    }
  
    return TrustScore.clamp(
      1 -
        fragmented /
          lines.length
    );
  }
  
  function calculateWarningIntegrity(
    warnings:
      PdfWarning[]
  ): number {
    if (
      warnings.length ===
      0
    ) {
      return 1;
    }
  
    let penalty =
      0;
  
    for (
      const warning of
        warnings
    ) {
      const code =
        String(
          warning.code
        );
  
      if (
        code.includes(
          "MALFORMED"
        ) ||
        code.includes(
          "FAILED"
        ) ||
        code.includes(
          "CORRUPT"
        )
      ) {
        penalty +=
          0.12;
  
        continue;
      }
  
      if (
        code.includes(
          "MISSING_PAGE"
        )
      ) {
        penalty +=
          0.08;
  
        continue;
      }
  
      penalty +=
        0.025;
    }
  
    return TrustScore.clamp(
      1 -
        Math.min(
          0.6,
          penalty
        )
    );
  }
  
  function getQualityLevel(
    score:
      number
  ): DocumentQualityLevel {
    if (
      score >=
      0.9
    ) {
      return "excellent";
    }
  
    if (
      score >=
      0.75
    ) {
      return "good";
    }
  
    if (
      score >=
      0.55
    ) {
      return "fair";
    }
  
    return "poor";
  }