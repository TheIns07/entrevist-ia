import { supabase } from "../lib/supabase";

import type {
  InterviewSession,
} from "./interviews";

export interface DashboardInterview
  extends InterviewSession {
  score: number | null;
}

export interface DashboardData {
  fullName: string;

  stats: {
    completedInterviews: number;
    averageScore: number | null;
    minutesPracticed: number;
  };

  progress: {
    id: string;
    label: string;
    score: number;
  }[];

  interviews: DashboardInterview[];
}

export async function getDashboardData(
  userId: string
): Promise<DashboardData> {
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const {
    data: sessions,
    error: sessionsError,
  } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (sessionsError) {
    throw sessionsError;
  }

  const interviewSessions =
    (sessions ?? []) as InterviewSession[];

  const sessionIds =
    interviewSessions.map(
      (session) => session.id
    );

  let results: {
    session_id: string;
    overall_score: number | null;
  }[] = [];

  if (sessionIds.length > 0) {
    const {
      data: resultRows,
      error: resultsError,
    } = await supabase
      .from("interview_results")
      .select(
        "session_id, overall_score"
      )
      .in(
        "session_id",
        sessionIds
      );

    if (resultsError) {
      throw resultsError;
    }

    results =
      resultRows ?? [];
  }

  const scoreBySession =
    new Map<string, number>();

  results.forEach(
    (result) => {
      if (
        result.overall_score !==
        null
      ) {
        scoreBySession.set(
          result.session_id,
          Number(
            result.overall_score
          )
        );
      }
    }
  );

  const interviews:
    DashboardInterview[] =
    interviewSessions.map(
      (session) => ({
        ...session,

        score:
          scoreBySession.get(
            session.id
          ) ?? null,
      })
    );

  const completedInterviews =
    interviews.filter(
      (interview) =>
        interview.status ===
        "completed"
    );

  const scores =
    completedInterviews
      .map(
        (interview) =>
          interview.score
      )
      .filter(
        (
          score
        ): score is number =>
          score !== null
      );

  const averageScore =
    scores.length > 0
      ? Number(
          (
            scores.reduce(
              (
                total,
                score
              ) =>
                total +
                score,
              0
            ) / scores.length
          ).toFixed(1)
        )
      : null;

  const minutesPracticed =
    completedInterviews.reduce(
      (
        total,
        interview
      ) => {
        if (
          !interview.started_at ||
          !interview.completed_at
        ) {
          return total;
        }

        const started =
          new Date(
            interview.started_at
          ).getTime();

        const completed =
          new Date(
            interview.completed_at
          ).getTime();

        const difference =
          completed - started;

        if (
          difference <= 0 ||
          Number.isNaN(difference)
        ) {
          return total;
        }

        const minutes =
          Math.max(
            1,
            Math.round(
              difference /
                1000 /
                60
            )
          );

        return total + minutes;
      },
      0
    );

  const progress =
    completedInterviews
      .filter(
        (
          interview
        ): interview is DashboardInterview & {
          score: number;
        } =>
          interview.score !==
          null
      )
      .slice(0, 5)
      .reverse()
      .map(
        (
          interview,
          index
        ) => ({
          id: interview.id,

          label:
            `Entrevista ${index + 1}`,

          score:
            interview.score,
        })
      );

  return {
    fullName:
      profile.full_name,

    stats: {
      completedInterviews:
        completedInterviews.length,

      averageScore,

      minutesPracticed,
    },

    progress,

    interviews:
      interviews.slice(0, 6),
  };
}