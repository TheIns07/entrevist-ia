import {
    supabase,
  } from "../../lib/supabase";

  import {
    FunctionsHttpError,
  } from "@supabase/supabase-js";
  
  export type ResumeSeniority =
    | "intern"
    | "junior"
    | "mid"
    | "senior"
    | "lead"
    | "manager"
    | "executive"
    | "unknown";
  
  export interface ResumeAnalysis {
    candidateName:
      string |
      null;
  
    currentRole:
      string |
      null;
  
    seniority:
      ResumeSeniority;
  
    skills:
      string[];
  
    experienceHighlights:
      string[];
  
    education:
      string[];
  
    languages:
      string[];
  
    interviewFocus:
      string[];
  
    uncertainties:
      string[];
  }
  
  export interface ResumeAnalysisUsage {
    promptTokens:
      number |
      null;
  
    completionTokens:
      number |
      null;
  
    totalTokens:
      number |
      null;
  }
  
  export interface AnalyzeResumeResult {
    model:
      string;
  
    analysis:
      ResumeAnalysis;
  
    usage:
      ResumeAnalysisUsage;
  }
  
  interface AnalyzeResumeResponse {
    model?:
      string;
  
    analysis?:
      ResumeAnalysis;
  
    usage?:
      ResumeAnalysisUsage;
  
    error?:
      string;
  }
  
  export async function analyzeResume(
    aiText:
      string
  ): Promise<AnalyzeResumeResult> {
    const normalizedText =
      aiText.trim();
  
    if (
      normalizedText.length ===
      0
    ) {
      throw new Error(
        "No hay contenido del CV para analizar."
      );
    }
  
    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke<AnalyzeResumeResponse>(
          "analyze-resume",
          {
            body: {
              aiText:
                normalizedText,
            },
          }
        );
  
        if (error) {
          console.error(
            "[Resume Analysis]",
            error
          );
        
          if (
            error instanceof
            FunctionsHttpError
          ) {
            try {
              const details =
                await error.context.json();
        
              console.error(
                "[Resume Analysis] Edge Function body:",
                details
              );
        
              throw new Error(
                typeof details?.message ===
                  "string"
                  ? details.message
                  : typeof details?.error ===
                      "string"
                    ? details.error
                    : "La Edge Function devolvió un error."
              );
            } catch (
              parseError
            ) {
              if (
                parseError instanceof
                Error &&
                parseError.message !==
                  "La Edge Function devolvió un error."
              ) {
                throw parseError;
              }
            }
          }
        
          throw new Error(
            error.message ||
              "No fue posible analizar el CV."
          );
        }
  
    if (
      !data
    ) {
      throw new Error(
        "La función de análisis no devolvió información."
      );
    }
  
    if (
      data.error
    ) {
      throw new Error(
        `El análisis falló: ${data.error}`
      );
    }
  
    if (
      !data.analysis ||
      !data.model
    ) {
      throw new Error(
        "La respuesta del análisis está incompleta."
      );
    }
  
    return {
      model:
        data.model,
  
      analysis:
        data.analysis,
  
      usage:
        data.usage ?? {
          promptTokens:
            null,
  
          completionTokens:
            null,
  
          totalTokens:
            null,
        },
    };
  }