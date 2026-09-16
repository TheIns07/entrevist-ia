import {
    DocumentQualityAnalyzer,
  } from "../quality/DocumentQualityAnalyzer";
  
  import {
    TrustScore,
  } from "../quality/TrustScore";
  
  import type {
    DocumentQuality,
  } from "../quality/types";
  
  import {
    ResumeSectionDetector,
  } from "../structure/ResumeSectionDetector";
  
  import {
    StructureDetector,
  } from "../structure/StructureDetector";
  
  import type {
    DocumentStructure,
    ResumeDetectionResult,
  } from "../structure/types";
  
  import type {
    PdfWarning,
  } from "../types";
  
  import {
    AITextBuilder,
  } from "./AITextBuilder";
  
  export interface DocumentIntelligenceInput {
    cleanText:
      string;
  
    warnings:
      PdfWarning[];
  }
  
  export interface DocumentIntelligenceResult {
    aiText:
      string;
  
    structure:
      DocumentStructure;
  
    resume:
      ResumeDetectionResult;
  
    quality:
      DocumentQuality;
  
    confidence:
      number;
  }
  
  export class DocumentIntelligenceEngine {
    private readonly structureDetector =
      new StructureDetector();
  
    private readonly resumeSectionDetector =
      new ResumeSectionDetector();
  
    private readonly qualityAnalyzer =
      new DocumentQualityAnalyzer();
  
    private readonly aiTextBuilder =
      new AITextBuilder();
  
    analyze(
      input:
        DocumentIntelligenceInput
    ): DocumentIntelligenceResult {
      const structure =
        this.structureDetector.detect(
          input.cleanText
        );
  
      const resume =
        this.resumeSectionDetector.detect(
          input.cleanText
        );
  
      const quality =
        this.qualityAnalyzer.analyze({
          cleanText:
            input.cleanText,
  
          structureConfidence:
            structure.confidence,
  
          warnings:
            input.warnings,
        });
  
      const semanticConfidence =
        resume.isResume
          ? resume.confidence
          : structure.confidence;
  
      const confidence =
        TrustScore.calculate([
          {
            value:
              quality.score,
  
            weight:
              0.6,
          },
          {
            value:
              semanticConfidence,
  
            weight:
              0.4,
          },
        ]);
  
      const aiText =
        this.aiTextBuilder.build({
          cleanText:
            input.cleanText,
  
          resume,
  
          quality,
        });
  
      return {
        aiText,
  
        structure,
  
        resume,
  
        quality,
  
        confidence,
      };
    }
  }