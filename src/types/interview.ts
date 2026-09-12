export type ExperienceLevel =
  | "junior"
  | "mid"
  | "senior";

export type InterviewType =
  | "general"
  | "behavioral"
  | "technical"
  | "hr";

export type InterviewLanguage =
  | "es"
  | "en";

export interface InterviewConfiguration {
  position: string;
  industry: string;
  experience: ExperienceLevel;
  interviewType: InterviewType;
  language: InterviewLanguage;
}