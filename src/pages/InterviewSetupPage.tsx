import {
  useEffect,
  useState,
} from "react";

import {
  Mic,
  Mic2,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  InfoRow,
} from "../components";

import {
  useMicrophoneCheck,
} from "../hooks/useMicrophoneCheck";

import {
  getInterviewSession,
  startInterviewSession,
  type InterviewSession,
} from "../services/interviews";

import {
  ensureInterviewQuestions,
} from "../services/questions";

const experienceLabels = {
  junior: "Inicial",
  mid: "Intermedio",
  senior: "Avanzado",
};

const interviewTypeLabels = {
  general: "General",
  behavioral: "Behavioral",
  technical: "Técnica",
  hr: "Recursos Humanos",
};

const languageLabels = {
  es: "Español",
  en: "English",
};

export default function InterviewSetupPage() {
  const navigate =
    useNavigate();

  const {
    sessionId,
  } =
    useParams<{
      sessionId:
        string;
    }>();

  const [
    session,
    setSession,
  ] =
    useState<InterviewSession | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    starting,
    setStarting,
  ] =
    useState(
      false
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(
      null
    );

  const {
    status:
      microphoneStatus,

    level:
      microphoneLevel,

    error:
      microphoneError,

    start:
      startMicrophoneCheck,

    stop:
      stopMicrophoneCheck,
  } =
    useMicrophoneCheck();

  /*
   * =========================================================
   * CARGAR ENTREVISTA
   * =========================================================
   */

  useEffect(
    () => {
      if (
        !sessionId
      ) {
        navigate(
          "/onboarding",
          {
            replace:
              true,
          }
        );

        return;
      }

      let active =
        true;

      const loadSession =
        async (): Promise<void> => {
          try {
            setLoading(
              true
            );

            setPageError(
              null
            );

            /*
             * Primero comprobamos
             * que la entrevista exista.
             */
            const interview =
              await getInterviewSession(
                sessionId
              );

            if (
              !active
            ) {
              return;
            }

            setSession(
              interview
            );

            /*
             * Después preparamos
             * las preguntas.
             *
             * Si esto falla,
             * NO significa que la
             * entrevista no exista.
             */
            try {
              await ensureInterviewQuestions(
                interview.id
              );
            } catch (
              questionError
            ) {
              console.error(
                "Error preparando preguntas:",
                questionError
              );

              if (
                active
              ) {
                setPageError(
                  "Encontramos la entrevista, pero no pudimos preparar las preguntas. Intenta nuevamente."
                );
              }
            }
          } catch (
            error
          ) {
            console.error(
              "Error cargando entrevista:",
              error
            );

            if (
              !active
            ) {
              return;
            }

            setSession(
              null
            );

            setPageError(
              "No pudimos encontrar esta entrevista."
            );
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void loadSession();

      return () => {
        active =
          false;
      };
    },
    [
      sessionId,
      navigate,
    ]
  );

  /*
   * =========================================================
   * COMPROBAR MICRÓFONO
   * =========================================================
   */

  const handleMicrophoneCheck =
    async (): Promise<void> => {
      try {
        await startMicrophoneCheck();
      } catch (
        error
      ) {
        console.error(
          "Error comprobando micrófono:",
          error
        );
      }
    };

  /*
   * =========================================================
   * INICIAR ENTREVISTA
   * =========================================================
   */

  const handleStart =
    async (): Promise<void> => {
      if (
        !session ||
        microphoneStatus !==
          "ready" ||
        starting
      ) {
        return;
      }

      try {
        setStarting(
          true
        );

        setPageError(
          null
        );

        /*
         * Ya comprobamos el audio.
         * Cerramos el stream antes
         * de cambiar de pantalla.
         *
         * La pantalla de entrevista
         * volverá a abrir el micrófono
         * cuando sea necesario.
         */
        stopMicrophoneCheck();

        await startInterviewSession(
          session.id
        );

        navigate(
          `/interview/${session.id}`
        );
      } catch (
        error
      ) {
        console.error(
          "Error iniciando entrevista:",
          error
        );

        setPageError(
          "No pudimos iniciar la entrevista. Intenta nuevamente."
        );
      } finally {
        setStarting(
          false
        );
      }
    };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (
    loading
  ) {
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
   * SESIÓN NO ENCONTRADA
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
          backTo="/onboarding"
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
                text-[#252525]
              "
            >
              Entrevista no disponible
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

            <div
              className="
                mt-8
              "
            >
              <Button
                onClick={() =>
                  navigate(
                    "/onboarding"
                  )
                }
              >
                Preparar otra entrevista
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (
    !session
  ) {
    return null;
  }

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
        backTo="/onboarding"
      />

      <main
        className="
          px-5
          pb-16
          pt-8

          sm:px-8
          sm:pt-12
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[620px]
          "
        >
          {/* ===============================================
              HEADER
          =============================================== */}

          <header>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.12em]
                text-[#5547E8]
              "
            >
              Entrevista preparada
            </p>

            <h1
              className="
                mt-3
                text-[30px]
                font-bold
                tracking-[-0.035em]
                text-[#252525]

                sm:text-[38px]
              "
            >
              Tu entrevista está lista.
            </h1>

            <p
              className="
                mt-4
                max-w-lg
                text-sm
                leading-6
                text-[#777777]
              "
            >
              Revisa la configuración
              antes de comenzar.
            </p>
          </header>

          {/* ===============================================
              RESUMEN
          =============================================== */}

          <section
            className="
              mt-8
              rounded-2xl
              border
              border-[#E7E7E7]
              bg-white
              p-5

              sm:p-6
            "
          >
            <InfoRow
              label="Puesto"
              value={
                session.position
              }
            />

            <InfoRow
              label="Industria"
              value={
                session.industry ||
                "No especificada"
              }
            />

            <InfoRow
              label="Experiencia"
              value={
                experienceLabels[
                  session.experience
                ]
              }
            />

            <InfoRow
              label="Tipo"
              value={
                interviewTypeLabels[
                  session.interview_type
                ]
              }
            />

            <InfoRow
              label="Idioma"
              value={
                languageLabels[
                  session.language
                ]
              }
            />

            <InfoRow
              label="Duración"
              value={`${session.estimated_minutes} min`}
            />
          </section>

          {/* ===============================================
              COMPROBACIÓN REAL DE MICRÓFONO
          =============================================== */}

          <section
            className="
              mt-5
              rounded-2xl
              border
              border-[#E7E7E7]
              bg-white
              p-5

              sm:p-6
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-[#252525]
              "
            >
              Comprobación de audio
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-[#777777]
              "
            >
              Antes de comenzar,
              comprobaremos que podemos
              escucharte correctamente.
            </p>

            {/* IDLE */}

            {microphoneStatus ===
              "idle" && (
              <div
                className="
                  mt-5
                "
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleMicrophoneCheck();
                  }}
                >
                  <span
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Mic
                      size={16}
                    />

                    Probar micrófono
                  </span>
                </Button>
              </div>
            )}

            {/* CHECKING */}

            {microphoneStatus ===
              "checking" && (
              <div
                className="
                  mt-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Mic2
                    size={17}
                    className="
                      text-[#5547E8]
                    "
                  />

                  <p
                    className="
                      text-sm
                      font-medium
                      text-[#5547E8]
                    "
                  >
                    Habla para comprobar
                    tu micrófono...
                  </p>
                </div>

                <AudioLevel
                  level={
                    microphoneLevel
                  }
                />
              </div>
            )}

            {/* READY */}

            {microphoneStatus ===
              "ready" && (
              <div
                className="
                  mt-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Mic2
                    size={17}
                    className="
                      text-[#00A980]
                    "
                  />

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[#00A980]
                    "
                  >
                    Micrófono detectado.
                  </p>
                </div>

                <AudioLevel
                  level={
                    microphoneLevel
                  }
                />

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-[#00A980]
                  "
                >
                  Todo está listo.
                </p>
              </div>
            )}

            {/* ERROR */}

            {microphoneStatus ===
              "error" && (
              <div
                className="
                  mt-5
                "
              >
                <p
                  className="
                    text-sm
                    leading-6
                    text-red-600
                  "
                >
                  {microphoneError ||
                    "No pudimos acceder al micrófono."}
                </p>

                <div
                  className="
                    mt-4
                  "
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      void handleMicrophoneCheck();
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* ===============================================
              ERROR GENERAL
          =============================================== */}

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

          {/* ===============================================
              START
          =============================================== */}

          <div
            className="
              mt-8
            "
          >
            <Button
              size="lg"
              fullWidth
              loading={
                starting
              }
              disabled={
                microphoneStatus !==
                  "ready" ||
                starting ||
                Boolean(
                  pageError
                )
              }
              onClick={
                handleStart
              }
            >
              Comenzar entrevista
            </Button>

            {microphoneStatus !==
              "ready" &&
              !microphoneError && (
                <p
                  className="
                    mt-3
                    text-center
                    text-xs
                    leading-5
                    text-[#999999]
                  "
                >
                  Comprueba tu micrófono
                  para poder comenzar.
                </p>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * AUDIO LEVEL
 * =========================================================
 */

interface AudioLevelProps {
  level:
    number;
}

function AudioLevel({
  level,
}: AudioLevelProps) {
  const percentage =
    Math.max(
      2,
      Math.min(
        100,
        level *
          100
      )
    );

  return (
    <div
      className="
        mt-4
      "
    >
      <div
        className="
          h-2
          w-full
          overflow-hidden
          rounded-full
          bg-[#EEEEF2]
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-[#5547E8]
            transition-[width]
            duration-75
          "
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>

      <p
        className="
          mt-2
          text-xs
          text-[#999999]
        "
      >
        Habla normalmente y observa
        el nivel de entrada.
      </p>
    </div>
  );
}