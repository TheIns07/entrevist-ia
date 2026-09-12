import { supabase } from "../lib/supabase";

import type {
  ExperienceLevel,
  InterviewLanguage,
  InterviewType,
} from "../types/interview";

export type InterviewStatus =
  | "configured"
  | "in_progress"
  | "processing"
  | "completed"
  | "abandoned"
  | "evaluation_failed";

export type InterviewMode =
  | "text"
  | "voice";

export interface InterviewSession {
  id: string;
  user_id: string;

  position: string;
  industry: string | null;

  experience: ExperienceLevel;
  interview_type: InterviewType;
  language: InterviewLanguage;

  mode: InterviewMode;
  status: InterviewStatus;

  estimated_minutes: number;

  started_at: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
}

interface CreateInterviewSessionInput {
  userId: string;
  position: string;
  industry?: string;

  experience: ExperienceLevel;
  interviewType: InterviewType;
  language: InterviewLanguage;
}

export async function createInterviewSession(
  input: CreateInterviewSessionInput
) {
  const {
    data,
    error,
  } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: input.userId,

      position: input.position.trim(),

      industry:
        input.industry?.trim() ||
        null,

      experience:
        input.experience,

      interview_type:
        input.interviewType,

      language:
        input.language,

      mode: "text",

      status: "configured",

      estimated_minutes: 15,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as InterviewSession;
}

export async function getInterviewSession(
  sessionId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    throw error;
  }

  return data as InterviewSession;
}

export async function startInterviewSession(
  sessionId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("interview_sessions")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as InterviewSession;
}

export interface InterviewAnswer {
    id: string;
  
    session_id: string;
  
    question_id: string;
    question_order: number;
    question_text: string;
  
    answer_text: string;
  
    answered_at: string;
    created_at: string;
  }
  
  interface SaveInterviewAnswerInput {
    sessionId: string;
  
    questionId: string;
  
    questionOrder: number;
  
    questionText: string;
  
    answerText: string;
  }
  
  export async function getInterviewAnswers(
    sessionId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("interview_answers")
      .select("*")
      .eq("session_id", sessionId)
      .order("question_order", {
        ascending: true,
      });
  
    if (error) {
      throw error;
    }
  
    return data as InterviewAnswer[];
  }
  
  export async function saveInterviewAnswer(
    input: SaveInterviewAnswerInput
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("interview_answers")
      .upsert(
        {
          session_id:
            input.sessionId,
      
          interview_question_id:
            input.questionId,
      
          question_id:
            input.questionId,
      
          question_order:
            input.questionOrder,
      
          question_text:
            input.questionText,
      
          answer_text:
            input.answerText,
      
          answered_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "session_id,question_id",
        }
      )
      .select("*")
      .single();
  
    if (error) {
      throw error;
    }
  
    return data as InterviewAnswer;
  }
  
  export async function markInterviewProcessing(
    sessionId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("interview_sessions")
      .update({
        status: "processing",
      })
      .eq("id", sessionId)
      .select("*")
      .single();
  
    if (error) {
      throw error;
    }
  
    return data as InterviewSession;
  }

  export async function completeInterviewSession(
    sessionId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("interview_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select("*")
      .single();
  
    if (error) {
      throw error;
    }
  
    return data as InterviewSession;
  }

  export async function markInterviewEvaluationFailed(
    sessionId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("interview_sessions")
      .update({
        status:
          "evaluation_failed",
      })
      .eq(
        "id",
        sessionId
      )
      .select("*")
      .single();
  
    if (error) {
      throw error;
    }
  
    return data as InterviewSession;
  }