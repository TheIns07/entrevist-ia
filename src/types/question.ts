export type InterviewQuestionType =
  | "intro"
  | "behavioral"
  | "technical"
  | "motivation"
  | "situational"
  | "closing";

export type QuestionGenerator =
  | "system"
  | "ai";

export interface InterviewQuestion {
  id: string;

  session_id: string;

  question_order: number;

  question_text: string;

  question_type:
    | InterviewQuestionType
    | null;

  estimated_seconds:
    | number
    | null;

  generated_by:
    QuestionGenerator;

  created_at: string;
}