import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  FeedbackCard,
  ScoreCard,
} from "../components";

import {
  mockInterviewResult,
} from "../mocks/mockResults";

import {
  getInterviewAnswers,
  getInterviewSession,
  type InterviewAnswer,
  type InterviewSession,
} from "../services/interviews";

export default function ResultsPage() {
  const navigate = useNavigate();

  const {
    sessionId,
  } = useParams<{
    sessionId: string;
  }>();

  const [
    session,
    setSession,
  ] =
    useState<InterviewSession | null>(
      null
    );

  const [
    answers,
    setAnswers,
  ] =
    useState<InterviewAnswer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(null);

  const [
    openQuestion,
    setOpenQuestion,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    if (!sessionId) {
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );

      return;
    }

    const loadResults =
      async () => {
        try {
          setLoading(true);
          setPageError(null);

          const [
            interview,
            savedAnswers,
          ] = await Promise.all([
            getInterviewSession(
              sessionId
            ),

            getInterviewAnswers(
              sessionId
            ),
          ]);

          if (
            interview.status !==
            "completed"
          ) {
            navigate(
              `/interview/${sessionId}/processing`,
              {
                replace: true,
              }
            );

            return;
          }

          setSession(interview);

          setAnswers(
            savedAnswers
          );
        } catch (error) {
          console.error(
            "Error cargando resultados:",
            error
          );

          setPageError(
            "No pudimos cargar los resultados de esta entrevista."
          );
        } finally {
          setLoading(false);
        }
      };

    loadResults();
  }, [
    sessionId,
    navigate,
  ]);

  const handlePracticeAgain =
    () => {
      navigate(
        "/onboarding"
      );
    };

  const handleDashboard =
    () => {
      navigate(
        "/dashboard"
      );
    };

  const toggleQuestion = (
    questionId: string
  ) => {
    setOpenQuestion(
      (current) =>
        current ===
        questionId
          ? null
          : questionId
    );
  };

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#F7F8FA]
        "
      >
        <div
          className="
            h-6
            w-6
            animate-spin
            rounded-full
            border-2
            border-[#E3E1FB]
            border-t-[#5547E8]
          "
        />
      </div>
    );
  }

  if (
    pageError ||
    !session
  ) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <AppHeader
          backTo="/dashboard"
        />

        <main className="px-5 py-20">
          <div
            className="
              mx-auto
              max-w-[520px]
              text-center
            "
          >
            <h1
              className="
                text-2xl
                font-bold
                text-[#252525]
              "
            >
              Resultados no disponibles
            </h1>

            <p
              className="
                mt-3
                text-sm
                text-[#777777]
              "
            >
              {pageError}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AppHeader
        backTo="/dashboard"
        backLabel="Cerrar"
      />

      <main
        className="
          px-5
          pb-16
          pt-6
          sm:px-8
          sm:pt-10
          lg:pb-24
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[760px]
          "
        >
          <header className="mb-8">
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#5547E8]
              "
            >
              Entrevista completada
            </p>

            <h1
              className="
                mt-3
                text-[28px]
                font-bold
                tracking-[-0.025em]
                text-[#252525]
                sm:text-[34px]
              "
            >
              Tu feedback
            </h1>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-[#777777]
              "
            >
              {session.position}
              {" · "}
              {session.interview_type}
            </p>
          </header>

          <ScoreCard
            score={
              mockInterviewResult.score
            }
            label={
              mockInterviewResult.label
            }
            description={
              mockInterviewResult.description
            }
          />

          <div
            className="
              mt-6
              grid
              gap-6
              md:grid-cols-2
            "
          >
            <FeedbackCard title="Fortalezas">
              <ul className="space-y-4">
                {mockInterviewResult.strengths.map(
                  (strength) => (
                    <li
                      key={strength}
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      <span
                        className="
                          mt-2
                          h-1.5
                          w-1.5
                          shrink-0
                          rounded-full
                          bg-[#00A980]
                        "
                      />

                      <span
                        className="
                          text-sm
                          leading-6
                          text-[#555555]
                        "
                      >
                        {strength}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </FeedbackCard>

            <FeedbackCard title="Áreas a mejorar">
              <ul className="space-y-4">
                {mockInterviewResult.improvements.map(
                  (
                    improvement
                  ) => (
                    <li
                      key={
                        improvement
                      }
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      <span
                        className="
                          mt-2
                          h-1.5
                          w-1.5
                          shrink-0
                          rounded-full
                          bg-[#F59E0B]
                        "
                      />

                      <span
                        className="
                          text-sm
                          leading-6
                          text-[#555555]
                        "
                      >
                        {
                          improvement
                        }
                      </span>
                    </li>
                  )
                )}
              </ul>
            </FeedbackCard>
          </div>

          <section
            className="
              mt-6
              rounded-2xl
              border
              border-[#DDD8FF]
              bg-[#F5F3FF]
              p-5
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-[#5547E8]
                "
              >
                <Lightbulb
                  size={18}
                />
              </div>

              <div>
                <h2
                  className="
                    text-sm
                    font-semibold
                    text-[#252525]
                  "
                >
                  Consejo principal
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-[#666666]
                  "
                >
                  {
                    mockInterviewResult.mainAdvice
                  }
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2
              className="
                text-xl
                font-bold
                tracking-[-0.02em]
                text-[#252525]
              "
            >
              Detalle por pregunta
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-[#777777]
              "
            >
              Revisa tu respuesta y el
              feedback correspondiente.
            </p>

            <div className="mt-5 space-y-3">
              {mockInterviewResult.questions.map(
                (
                  question
                ) => {
                  const isOpen =
                    openQuestion ===
                    question.id;

                  const savedAnswer =
                    answers.find(
                      (answer) =>
                        answer.question_id ===
                        question.id
                    );

                  return (
                    <article
                      key={
                        question.id
                      }
                      className="
                        overflow-hidden
                        rounded-xl
                        border
                        border-[#E5E5E5]
                        bg-white
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleQuestion(
                            question.id
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-4
                          p-4
                          text-left
                          transition-colors
                          hover:bg-[#FAFAFA]
                          sm:p-5
                        "
                      >
                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#F2F0FF]
                            text-sm
                            font-bold
                            text-[#5547E8]
                          "
                        >
                          P
                          {
                            question.number
                          }
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-[#252525]
                            "
                          >
                            {
                              question.title
                            }
                          </p>
                        </div>

                        <div
                          className="
                            flex
                            shrink-0
                            items-center
                            gap-4
                          "
                        >
                          <span
                            className="
                              text-sm
                              font-bold
                              text-[#252525]
                            "
                          >
                            {
                              question.score
                            }
                            /10
                          </span>

                          {isOpen ? (
                            <ChevronUp
                              size={18}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                            />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div
                          className="
                            border-t
                            border-[#EEEEEE]
                            px-4
                            pb-5
                            pt-5
                            sm:px-5
                          "
                        >
                          {savedAnswer && (
                            <div
                              className="
                                mb-6
                                rounded-xl
                                bg-[#F7F8FA]
                                p-4
                              "
                            >
                              <h3
                                className="
                                  text-xs
                                  font-semibold
                                  uppercase
                                  tracking-[0.08em]
                                  text-[#777777]
                                "
                              >
                                Tu respuesta
                              </h3>

                              <p
                                className="
                                  mt-2
                                  whitespace-pre-wrap
                                  text-sm
                                  leading-6
                                  text-[#555555]
                                "
                              >
                                {
                                  savedAnswer.answer_text
                                }
                              </p>
                            </div>
                          )}

                          <div className="space-y-5">
                            <FeedbackDetail
                              label="Qué hiciste bien"
                              text={
                                question.strength
                              }
                            />

                            <FeedbackDetail
                              label="Qué puedes mejorar"
                              text={
                                question.improvement
                              }
                            />

                            <FeedbackDetail
                              label="Cómo mejorar tu respuesta"
                              text={
                                question.suggestedAnswer
                              }
                            />
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          </section>

          <div
            className="
              mt-10
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <Button
              size="lg"
              fullWidth
              onClick={
                handlePracticeAgain
              }
            >
              Practicar de nuevo
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={
                handleDashboard
              }
            >
              Ver mi dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface FeedbackDetailProps {
  label: string;
  text: string;
}

function FeedbackDetail({
  label,
  text,
}: FeedbackDetailProps) {
  return (
    <div>
      <h3
        className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.08em]
          text-[#777777]
        "
      >
        {label}
      </h3>

      <p
        className="
          mt-2
          text-sm
          leading-6
          text-[#555555]
        "
      >
        {text}
      </p>
    </div>
  );
}