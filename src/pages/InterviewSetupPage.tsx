import {
  useEffect,
  useState,
} from "react";

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
  getInterviewSession,
  startInterviewSession,
  type InterviewSession,
} from "../services/interviews";
import { ensureInterviewQuestions } from "../services/questions";

type MicrophoneStatus =
  | "pending"
  | "checking"
  | "ready";

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
    loading,
    setLoading,
  ] = useState(true);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(null);

  const [
    microphoneStatus,
    setMicrophoneStatus,
  ] =
    useState<MicrophoneStatus>(
      "pending"
    );

  useEffect(() => {
    if (!sessionId) {
      navigate(
        "/onboarding",
        {
          replace: true,
        }
      );

      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);

        const interview =
          await getInterviewSession(
            sessionId
          );

        await ensureInterviewQuestions(
          interview.id
        );

        setSession(interview);

        setPageError(
          "No pudimos encontrar esta entrevista."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [
    sessionId,
    navigate,
  ]);

  const checkMicrophone = () => {
    setMicrophoneStatus(
      "checking"
    );

    window.setTimeout(() => {
      setMicrophoneStatus(
        "ready"
      );
    }, 1200);
  };

  const handleStart = async () => {
    if (
      !session ||
      microphoneStatus !== "ready" ||
      starting
    ) {
      return;
    }

    try {
      setStarting(true);
      setPageError(null);

      await startInterviewSession(
        session.id
      );

      navigate(
        `/interview/${session.id}`
      );
    } catch (error) {
      console.error(
        "Error iniciando entrevista:",
        error
      );

      setPageError(
        "No pudimos iniciar la entrevista. Intenta nuevamente."
      );
    } finally {
      setStarting(false);
    }
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
    pageError &&
    !session
  ) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <AppHeader
          backTo="/onboarding"
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

            <div className="mt-8">
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

  if (!session) {
    return null;
  }

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
              Revisa la configuración antes
              de comenzar.
            </p>
          </header>

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
              comprobaremos que todo esté
              listo para tu sesión.
            </p>

            <div className="mt-5">
              {microphoneStatus ===
                "pending" && (
                <Button
                  variant="outline"
                  onClick={
                    checkMicrophone
                  }
                >
                  Comprobar micrófono
                </Button>
              )}

              {microphoneStatus ===
                "checking" && (
                <p
                  className="
                    text-sm
                    font-medium
                    text-[#5547E8]
                  "
                >
                  Comprobando...
                </p>
              )}

              {microphoneStatus ===
                "ready" && (
                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#00A980]
                  "
                >
                  Todo está listo.
                </p>
              )}
            </div>
          </section>

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
              <p className="text-sm text-red-700">
                {pageError}
              </p>
            </div>
          )}

          <div className="mt-8">
            <Button
              size="lg"
              fullWidth
              loading={starting}
              disabled={
                microphoneStatus !==
                  "ready" ||
                starting
              }
              onClick={
                handleStart
              }
            >
              Comenzar entrevista
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}