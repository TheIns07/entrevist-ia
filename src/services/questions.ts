import { supabase } from "../lib/supabase";

import {
  mockInterviewQuestions,
} from "../mocks/mockInterview";

import type {
  InterviewQuestion,
  InterviewQuestionType,
} from "../types/question";

interface CreateQuestionInput {
  sessionId: string;

  order: number;

  text: string;

  type?: InterviewQuestionType;

  estimatedSeconds?: number;

  generatedBy?:
    | "system"
    | "ai";
}

/*
 * =========================================================
 * OBTENER PREGUNTAS DE UNA ENTREVISTA
 * =========================================================
 */

export async function getInterviewQuestions(
  sessionId: string
): Promise<InterviewQuestion[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "interview_questions"
    )
    .select("*")
    .eq(
      "session_id",
      sessionId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "Error obteniendo preguntas:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as InterviewQuestion[];
}

/*
 * =========================================================
 * CREAR PREGUNTAS
 * =========================================================
 *
 * Utilizamos UPSERT en lugar de INSERT.
 *
 * Esto evita errores si React ejecuta
 * accidentalmente la inicialización dos veces
 * durante desarrollo.
 *
 * La restricción:
 *
 * unique(session_id, question_order)
 *
 * evita preguntas duplicadas.
 * =========================================================
 */

export async function createInterviewQuestions(
  questions: CreateQuestionInput[]
): Promise<InterviewQuestion[]> {
  if (
    questions.length === 0
  ) {
    return [];
  }

  const rows =
    questions.map(
      (question) => ({
        session_id:
          question.sessionId,

        question_order:
          question.order,

        question_text:
          question.text,

        question_type:
          question.type ??
          null,

        estimated_seconds:
          question.estimatedSeconds ??
          null,

        generated_by:
          question.generatedBy ??
          "system",
      })
    );

  const {
    data,
    error,
  } = await supabase
    .from(
      "interview_questions"
    )
    .upsert(
      rows,
      {
        onConflict:
          "session_id,question_order",

        ignoreDuplicates:
          true,
      }
    )
    .select("*");

  if (error) {
    console.error(
      "Error creando preguntas:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as InterviewQuestion[];
}

/*
 * =========================================================
 * ASEGURAR QUE LA ENTREVISTA TENGA PREGUNTAS
 * =========================================================
 *
 * Por ahora:
 *
 * mockInterviewQuestions
 *          ↓
 * PostgreSQL
 *
 * Más adelante:
 *
 * OpenAI
 *   ↓
 * PostgreSQL
 *
 * InterviewPage no tendrá que cambiar.
 * =========================================================
 */

export async function ensureInterviewQuestions(
  sessionId: string
): Promise<InterviewQuestion[]> {
  /*
   * Primero buscamos preguntas existentes.
   */
  const existingQuestions =
    await getInterviewQuestions(
      sessionId
    );

  if (
    existingQuestions.length > 0
  ) {
    return existingQuestions;
  }

  /*
   * Mientras todavía no conectemos IA,
   * usamos nuestro conjunto provisional.
   */
  const questions:
    CreateQuestionInput[] =
    mockInterviewQuestions.map(
      (
        question,
        index
      ) => {
        let type:
          InterviewQuestionType =
          "behavioral";

        if (index === 0) {
          type = "intro";
        }

        if (
          index ===
          mockInterviewQuestions.length -
            1
        ) {
          type =
            "closing";
        }

        return {
          sessionId,

          order:
            index + 1,

          text:
            question.question,

          type,

          estimatedSeconds:
            150,

          generatedBy:
            "system",
        };
      }
    );

  /*
   * Creamos las preguntas.
   *
   * No dependemos de lo que devuelva
   * este request porque puede existir
   * otra inicialización concurrente.
   */
  await createInterviewQuestions(
    questions
  );

  /*
   * Consultamos nuevamente la base de datos.
   *
   * Así obtenemos siempre el estado definitivo
   * con UUIDs reales.
   */
  const createdQuestions =
    await getInterviewQuestions(
      sessionId
    );

  if (
    createdQuestions.length === 0
  ) {
    throw new Error(
      "No fue posible preparar las preguntas de la entrevista."
    );
  }

  return createdQuestions;
}