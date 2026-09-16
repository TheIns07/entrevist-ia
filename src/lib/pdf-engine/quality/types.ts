export type DocumentQualityLevel =
  | "excellent"
  | "good"
  | "fair"
  | "poor";

export interface DocumentQualityMetric {
  name: string;

  score: number;

  weight: number;
}

export interface DocumentQuality {
  score: number;

  level:
    DocumentQualityLevel;

  metrics:
    DocumentQualityMetric[];

  issues:
    string[];
}