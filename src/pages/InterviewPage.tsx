import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  Textarea,
} from "../components";

import {
  getInterviewQuestions,
} from "../services/questions";

import {
  getInterviewAnswers,
  getInterviewSession,
  markInterviewProcessing,
  saveInterviewAnswer,
  type InterviewSession,
} from "../services/interviews";

import type {
  InterviewQuestion,
} from "../types/question";

type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

export default function InterviewPage() {
  const navigate =
    useNavigate();

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
    questions,
    setQuestions,
  ] =
    useState<InterviewQuestion[]>(
      []
    );

  const [
    answers,
    setAnswers,
  ] = useState<
    Record<string, string>
  >({});

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(
      null
    );

  const [
    saveStatus,
    setSaveStatus,
  ] =
    useState<SaveStatus>(
      "idle"
    );

  /*
   * =========================================================
   * PREGUNTA ACTUAL
   * =========================================================
   */

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  const currentAnswer =
    currentQuestion
      ? answers[
          currentQuestion.id
        ] ?? ""
      : "";

  const isLastQuestion =
    questions.length > 0 &&
    currentQuestionIndex ===
      questions.length - 1;

  const canContinue =
    currentAnswer
      .trim()
      .length >= 10;

  const progress =
    questions.length > 0
      ? (
          (
            currentQuestionIndex +
            1
          ) /
          questions.length
        ) * 100
      : 0;

  /*
   * =========================================================
   * CARGAR ENTREVISTA
   * =========================================================
   */

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

    let cancelled =
      false;

    const loadInterview =
      async () => {
        try {
          setLoading(true);
          setPageError(null);

          const [
            interview,
            interviewQuestions,
            savedAnswers,
          ] =
            await Promise.all([
              getInterviewSession(
                sessionId
              ),

              getInterviewQuestions(
                sessionId
              ),

              getInterviewAnswers(
                sessionId
              ),
            ]);

          if (cancelled) {
            return;
          }

          /*
           * Controlamos estados para impedir
           * entrar manualmente a rutas
           * incompatibles.
           */

          if (
            interview.status ===
            "configured"
          ) {
            navigate(
              `/interview/setup/${interview.id}`,
              {
                replace: true,
              }
            );

            return;
          }

          if (
            interview.status ===
            "processing" ||
            interview.status ===
              "evaluation_failed"
          ) {
            navigate(
              `/interview/${interview.id}/processing`,
              {
                replace: true,
              }
            );

            return;
          }

          if (
            interview.status ===
            "completed"
          ) {
            navigate(
              `/interview/${interview.id}/results`,
              {
                replace: true,
              }
            );

            return;
          }

          if (
            interview.status ===
            "abandoned"
          ) {
            navigate(
              "/dashboard",
              {
                replace: true,
              }
            );

            return;
          }

          if (
            interviewQuestions.length ===
            0
          ) {
            setPageError(
              "Esta entrevista no tiene preguntas disponibles."
            );

            return;
          }

          setSession(
            interview
          );

          setQuestions(
            interviewQuestions
          );

          /*
           * Convertimos las respuestas
           * guardadas en:
           *
           * {
           *   questionUUID: "respuesta"
           * }
           */
          const answersRecord =
            savedAnswers.reduce<
              Record<
                string,
                string
              >
            >(
              (
                accumulator,
                answer
              ) => {
                accumulator[
                  answer.question_id
                ] =
                  answer.answer_text;

                return accumulator;
              },
              {}
            );

          setAnswers(
            answersRecord
          );

          /*
           * Continuamos en la primera
           * pregunta que todavía no tenga
           * una respuesta válida.
           */
          const firstUnansweredIndex =
            interviewQuestions.findIndex(
              (
                question
              ) => {
                const answer =
                  answersRecord[
                    question.id
                  ];

                return (
                  !answer ||
                  answer
                    .trim()
                    .length < 10
                );
              }
            );

          if (
            firstUnansweredIndex !==
            -1
          ) {
            setCurrentQuestionIndex(
              firstUnansweredIndex
            );
          } else {
            /*
             * Todas tienen respuesta.
             * Mostramos la última para que
             * pueda revisar/finalizar.
             */
            setCurrentQuestionIndex(
              interviewQuestions.length -
                1
            );
          }
        } catch (error) {
          console.error(
            "Error cargando entrevista:",
            error
          );

          if (
            !cancelled
          ) {
            setPageError(
              "No pudimos cargar esta entrevista."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(false);
          }
        }
      };

    loadInterview().catch(
      (error) => {
        console.error(
          "Error inesperado cargando entrevista:",
          error
        );

        if (
          !cancelled
        ) {
          setPageError(
            "Ocurrió un error inesperado al cargar la entrevista."
          );

          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    navigate,
  ]);

  /*
   * =========================================================
   * GUARDAR RESPUESTA
   * =========================================================
   */

  const persistCurrentAnswer =
    useCallback(
      async (
        answerOverride?: string
      ) => {
        if (
          !sessionId ||
          !currentQuestion
        ) {
          return;
        }

        const answer =
          answerOverride ??
          currentAnswer;

        const normalizedAnswer =
          answer.trim();

        if (
          normalizedAnswer.length ===
          0
        ) {
          return;
        }

        try {
          setSaveStatus(
            "saving"
          );

          await saveInterviewAnswer({
            sessionId,

            questionId:
              currentQuestion.id,

            questionOrder:
              currentQuestion.question_order,

            questionText:
              currentQuestion.question_text,

            answerText:
              normalizedAnswer,
          });

          setSaveStatus(
            "saved"
          );

          setPageError(
            null
          );
        } catch (error) {
          console.error(
            "Error guardando respuesta:",
            error
          );

          setSaveStatus(
            "error"
          );

          throw error;
        }
      },
      [
        sessionId,
        currentQuestion,
        currentAnswer,
      ]
    );

  /*
   * =========================================================
   * AUTOSAVE
   * =========================================================
   *
   * Esperamos 900 ms después de
   * la última tecla.
   * =========================================================
   */

  useEffect(() => {
    if (
      loading ||
      !currentQuestion ||
      currentAnswer
        .trim()
        .length === 0
    ) {
      return;
    }

    setSaveStatus(
      "idle"
    );

    const timeoutId =
      window.setTimeout(
        () => {
          persistCurrentAnswer(
            currentAnswer
          ).catch(
            () => {
              /*
               * El estado visual ya
               * mostrará el error.
               */
            }
          );
        },
        900
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    currentAnswer,
    currentQuestion,
    loading,
    persistCurrentAnswer,
  ]);

  /*
   * =========================================================
   * CAMBIO DEL TEXTAREA
   * =========================================================
   */

  const handleAnswerChange = (
    value: string
  ) => {
    if (
      !currentQuestion
    ) {
      return;
    }

    setAnswers(
      (
        currentAnswers
      ) => ({
        ...currentAnswers,

        [currentQuestion.id]:
          value,
      })
    );
  };

  /*
   * =========================================================
   * PREGUNTA ANTERIOR
   * =========================================================
   */

  const handlePrevious =
    async () => {
      if (
        currentQuestionIndex ===
        0 ||
        finishing
      ) {
        return;
      }

      try {
        if (
          currentAnswer
            .trim()
            .length > 0
        ) {
          await persistCurrentAnswer();
        }

        setCurrentQuestionIndex(
          (
            current
          ) =>
            Math.max(
              0,
              current - 1
            )
        );

        setSaveStatus(
          "idle"
        );

        setPageError(
          null
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } catch {
        setPageError(
          "No pudimos guardar tu respuesta antes de cambiar de pregunta."
        );
      }
    };

  /*
   * =========================================================
   * SIGUIENTE
   * =========================================================
   */

  const handleNext =
    async () => {
      if (
        !canContinue ||
        finishing
      ) {
        return;
      }

      try {
        setPageError(
          null
        );

        /*
         * Antes de avanzar aseguramos
         * que la respuesta esté persistida.
         */
        await persistCurrentAnswer();

        if (
          isLastQuestion
        ) {
          await finishInterview();

          return;
        }

        setCurrentQuestionIndex(
          (
            current
          ) =>
            Math.min(
              questions.length -
                1,
              current + 1
            )
        );

        setSaveStatus(
          "idle"
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } catch {
        setPageError(
          "No pudimos guardar tu respuesta. Revisa tu conexión e intenta nuevamente."
        );
      }
    };

  /*
   * =========================================================
   * FINALIZAR
   * =========================================================
   */

  const finishInterview =
    async () => {
      if (
        !session ||
        !sessionId ||
        finishing
      ) {
        return;
      }

      try {
        setFinishing(
          true
        );

        setPageError(
          null
        );

        /*
         * in_progress
         *      ↓
         * processing
         */
        await markInterviewProcessing(
          sessionId
        );

        navigate(
          `/interview/${sessionId}/processing`
        );
      } catch (error) {
        console.error(
          "Error finalizando entrevista:",
          error
        );

        setPageError(
          "No pudimos finalizar la entrevista. Intenta nuevamente."
        );
      } finally {
        setFinishing(
          false
        );
      }
    };

  /*
   * =========================================================
   * ESTADO DE GUARDADO
   * =========================================================
   */

  const saveStatusText =
    useMemo(() => {
      switch (
        saveStatus
      ) {
        case "saving":
          return "Guardando...";

        case "saved":
          return "Guardado";

        case "error":
          return "No se pudo guardar";

        default:
          return "";
      }
    }, [
      saveStatus,
    ]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

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

  /*
   * =========================================================
   * ERROR FATAL
   * =========================================================
   */

  if (
    pageError &&
    !session
  ) {
    return (
      <div
        className="
          min-h-screen
          bg-[#F7F8FA]
        "
      >
        <AppHeader
          backTo="/dashboard"
        />

        <main
          className="
            px-5
            py-20
          "
        >
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
                tracking-[-0.025em]
                text-[#252525]
              "
            >
              Entrevista no disponible
            </h1>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-[#777777]
              "
            >
              {pageError}
            </p>

            <div className="mt-8">
              <Button
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
              >
                Volver al dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (
    !session ||
    !currentQuestion
  ) {
    return null;
  }

  /*
   * =========================================================
   * TIEMPO ESTIMADO
   * =========================================================
   */

  const estimatedMinutes =
    currentQuestion
      .estimated_seconds
      ? Math.max(
          1,
          Math.round(
            currentQuestion
              .estimated_seconds /
              60
          )
        )
      : 2;

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        min-h-screen
        bg-[#F7F8FA]
      "
    >
      <AppHeader
        backTo="/dashboard"
        backLabel="Salir"
      />

      {/* PROGRESO DISCRETO */}
      <div
        className="
          h-[2px]
          w-full
          bg-[#E9E9EF]
        "
      >
        <div
          className="
            h-full
            bg-[#5547E8]
            transition-all
            duration-300
            ease-out
          "
          style={{
            width:
              `${progress}%`,
          }}
        />
      </div>

      <main
        className="
          px-5
          pb-16
          pt-10

          sm:px-8
          sm:pt-14

          lg:pb-24
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[720px]
          "
        >
          {/* META */}
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <p
              className="
                text-xs
                font-semibold
                tabular-nums
                tracking-[0.04em]
                text-[#999999]
              "
            >
              {String(
                currentQuestionIndex +
                  1
              ).padStart(
                2,
                "0"
              )}

              <span
                className="
                  mx-1.5
                  font-normal
                  text-[#CCCCCC]
                "
              >
                /
              </span>

              {String(
                questions.length
              ).padStart(
                2,
                "0"
              )}
            </p>

            <p
              className={`
                text-xs
                transition-colors

                ${
                  saveStatus ===
                  "error"
                    ? "text-red-500"
                    : "text-[#999999]"
                }
              `}
            >
              {saveStatusText}
            </p>
          </div>

          {/* QUESTION */}
          <section
            className="
              mt-8

              sm:mt-12
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-7
                  min-w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#5547E8]
                  px-2
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                Q
                {
                  currentQuestion.question_order
                }
              </div>

              <p
                className="
                  text-xs
                  font-medium
                  text-[#858C98]
                "
              >
                Entrevistador
              </p>
            </div>

            <h1
              className="
                mt-5
                text-[27px]
                font-bold
                leading-[1.25]
                tracking-[-0.035em]
                text-[#252525]

                sm:text-[35px]
              "
            >
              {
                currentQuestion.question_text
              }
            </h1>

            <p
              className="
                mt-4
                text-sm
                text-[#8A8A8A]
              "
            >
              Tiempo sugerido:{" "}
              {estimatedMinutes}{" "}
              {estimatedMinutes ===
              1
                ? "minuto"
                : "minutos"}
            </p>
          </section>

          {/* ANSWER */}
          <div className="mt-8">
            <Textarea
              value={
                currentAnswer
              }
              onChange={(
                event
              ) =>
                handleAnswerChange(
                  event.target.value
                )
              }
              placeholder="Escribe tu respuesta..."
              maxLength={
                1200
              }
              showCount
              size="lg"
              aria-label="Respuesta de la entrevista"
            />
          </div>

          {/* ERROR NO FATAL */}
          {pageError && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
              "
            >
              <p
                className="
                  text-sm
                  leading-6
                  text-red-700
                "
              >
                {pageError}
              </p>
            </div>
          )}

          {/* NAVIGATION */}
          <div
            className="
              mt-8
              flex
              flex-col-reverse
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <Button
              variant="ghost"
              size="lg"
              disabled={
                currentQuestionIndex ===
                  0 ||
                finishing
              }
              onClick={
                handlePrevious
              }
              className="
                w-full

                sm:w-auto
              "
            >
              Anterior
            </Button>

            <Button
              size="lg"
              disabled={
                !canContinue ||
                finishing ||
                saveStatus ===
                  "saving"
              }
              loading={
                finishing
              }
              onClick={
                handleNext
              }
              className="
                w-full

                sm:w-auto
              "
            >
              {isLastQuestion
                ? "Finalizar entrevista"
                : "Enviar respuesta"}
            </Button>
          </div>

          <p
            className="
              mt-5
              text-center
              text-xs
              leading-5
              text-[#AAAAAA]
            "
          >
            Tus respuestas se guardan
            automáticamente.
          </p>
        </div>
      </main>
    </div>
  );
}