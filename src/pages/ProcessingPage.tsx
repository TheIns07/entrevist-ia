import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  LoaderCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AppHeader,
  ProgressBar,
} from "../components";

import {
  completeInterviewSession,
  getInterviewAnswers,
  getInterviewSession,
} from "../services/interviews";

const processingSteps = [
  "Revisando tus respuestas",
  "Evaluando claridad y estructura",
  "Identificando tus fortalezas",
  "Detectando áreas de mejora",
  "Preparando recomendaciones",
];

export default function ProcessingPage() {
  const navigate = useNavigate();

  const {
    sessionId,
  } = useParams<{
    sessionId: string;
  }>();

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(null);

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

    let cancelled = false;
    let intervalId: number | undefined;
    let finishTimeoutId:
      | number
      | undefined;

    const prepareProcessing =
      async () => {
        try {
          /*
           * Validamos que:
           *
           * 1. la entrevista existe
           * 2. pertenece al usuario actual
           * 3. tiene respuestas
           *
           * RLS se encarga de la propiedad.
           */
          const [
            interview,
            answers,
          ] = await Promise.all([
            getInterviewSession(
              sessionId
            ),

            getInterviewAnswers(
              sessionId
            ),
          ]);

          if (cancelled) {
            return;
          }

          if (
            interview.status ===
              "completed"
          ) {
            navigate(
              `/interview/${sessionId}/results`,
              {
                replace: true,
              }
            );

            return;
          }

          if (
            answers.length === 0
          ) {
            setPageError(
              "Esta entrevista todavía no tiene respuestas para evaluar."
            );

            return;
          }

          intervalId =
            window.setInterval(
              () => {
                setCurrentStep(
                  (current) => {
                    if (
                      current >=
                      processingSteps.length -
                        1
                    ) {
                      if (
                        intervalId
                      ) {
                        window.clearInterval(
                          intervalId
                        );
                      }

                      return current;
                    }

                    return (
                      current + 1
                    );
                  }
                );
              },
              900
            );

          finishTimeoutId =
            window.setTimeout(
              async () => {
                try {
                  await completeInterviewSession(
                    sessionId
                  );

                  if (
                    cancelled
                  ) {
                    return;
                  }

                  navigate(
                    `/interview/${sessionId}/results`,
                    {
                      replace: true,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Error completando entrevista:",
                    error
                  );

                  if (
                    !cancelled
                  ) {
                    setPageError(
                      "No pudimos completar el análisis."
                    );
                  }
                }
              },
              processingSteps.length *
                900 +
                500
            );
        } catch (error) {
          console.error(
            "Error cargando entrevista:",
            error
          );

          if (!cancelled) {
            setPageError(
              "No pudimos cargar esta entrevista."
            );
          }
        }
      };

    prepareProcessing();

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(
          intervalId
        );
      }

      if (finishTimeoutId) {
        window.clearTimeout(
          finishTimeoutId
        );
      }
    };
  }, [
    sessionId,
    navigate,
  ]);

  const progress =
    (
      (currentStep + 1) /
      processingSteps.length
    ) * 100;

  if (pageError) {
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
              No pudimos procesar la entrevista
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
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AppHeader
        backTo="/dashboard"
        backLabel="Salir"
      />

      <main
        className="
          px-5
          pb-16
          pt-16
          sm:px-8
          sm:pt-24
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[560px]
          "
        >
          <header className="text-center">
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-[#F0EEFF]
                text-[#5547E8]
              "
            >
              <LoaderCircle
                size={22}
                className="animate-spin"
              />
            </div>

            <h1
              className="
                mt-6
                text-[30px]
                font-bold
                tracking-[-0.035em]
                text-[#252525]
                sm:text-[36px]
              "
            >
              Analizando tu entrevista
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-sm
                leading-6
                text-[#777777]
              "
            >
              Estamos revisando tus respuestas
              para preparar feedback útil y
              accionable.
            </p>
          </header>

          <div className="mt-10">
            <ProgressBar
              value={progress}
            />
          </div>

          <div className="mt-8 space-y-3">
            {processingSteps.map(
              (
                step,
                index
              ) => {
                const completed =
                  index <
                  currentStep;

                const active =
                  index ===
                  currentStep;

                return (
                  <div
                    key={step}
                    className="
                      flex
                      items-center
                      gap-4
                      rounded-xl
                      bg-white
                      px-4
                      py-4
                    "
                  >
                    <div
                      className={`
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          completed
                            ? `
                              bg-[#E8F8F3]
                              text-[#00A980]
                            `
                            : active
                            ? `
                              bg-[#F0EEFF]
                              text-[#5547E8]
                            `
                            : `
                              bg-[#F2F2F2]
                              text-[#AAAAAA]
                            `
                        }
                      `}
                    >
                      {completed ? (
                        <Check
                          size={14}
                          strokeWidth={
                            2.5
                          }
                        />
                      ) : active ? (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <span
                          className="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-current
                          "
                        />
                      )}
                    </div>

                    <span
                      className={`
                        text-sm
                        ${
                          active ||
                          completed
                            ? `
                              font-medium
                              text-[#252525]
                            `
                            : `
                              text-[#999999]
                            `
                        }
                      `}
                    >
                      {step}
                    </span>
                  </div>
                );
              }
            )}
          </div>

          <p
            className="
              mt-8
              text-center
              text-xs
              text-[#AAAAAA]
            "
          >
            No cierres esta ventana mientras
            terminamos el análisis.
          </p>
        </div>
      </main>
    </div>
  );
}