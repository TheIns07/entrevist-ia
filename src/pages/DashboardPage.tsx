import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  Clock3,
  MessageSquareText,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  StatCard,
} from "../components";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getDashboardData,
  type DashboardData,
  type DashboardInterview,
} from "../services/dashboard";

export default function DashboardPage() {
  const navigate = useNavigate();

  const {
    user,
    signOut,
  } = useAuth();

  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    pageError,
    setPageError,
  ] =
    useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadDashboard =
      async () => {
        try {
          setLoading(true);
          setPageError(null);

          const data =
            await getDashboardData(
              user.id
            );

          setDashboard(data);
        } catch (error) {
          console.error(
            "Error cargando dashboard:",
            error
          );

          setPageError(
            "No pudimos cargar tu información."
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, [user]);

  const handlePractice =
    () => {
      navigate(
        "/onboarding"
      );
    };

  const handleSignOut =
    async () => {
      try {
        await signOut();

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Error cerrando sesión:",
          error
        );
      }
    };

  const openInterview = (
    interview:
      DashboardInterview
  ) => {
    switch (
      interview.status
    ) {
      case "configured":
        navigate(
          `/interview/setup/${interview.id}`
        );
        return;

      case "in_progress":
        navigate(
          `/interview/${interview.id}`
        );
        return;

      case "processing":
        navigate(
          `/interview/${interview.id}/processing`
        );
        return;

      case "completed":
        navigate(
          `/interview/${interview.id}/results`
        );
        return;
        
      case "evaluation_failed":
        navigate(
          `/interview/${interview.id}/processing`
        );
        return;


      default:
        navigate(
          "/onboarding"
        );
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
    pageError ||
    !dashboard
  ) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <AppHeader
          backLabel="Cerrar sesión"
          onBack={
            handleSignOut
          }
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
              No pudimos cargar tu dashboard
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

  const userName =
    dashboard.fullName ||
    user?.user_metadata?.name ||
    "Usuario";

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <AppHeader
        backLabel="Cerrar sesión"
        onBack={
          handleSignOut
        }
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
            max-w-[980px]
          "
        >
          <header
            className="
              flex
              flex-col
              gap-6
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-[#5547E8]
                "
              >
                Dashboard
              </p>

              <h1
                className="
                  mt-3
                  text-[30px]
                  font-bold
                  tracking-[-0.025em]
                  text-[#252525]
                  sm:text-[36px]
                "
              >
                Hola, {userName}
              </h1>

              <p
                className="
                  mt-3
                  text-sm
                  leading-6
                  text-[#777777]
                "
              >
                Revisa tu progreso y continúa
                preparando tu próxima entrevista.
              </p>
            </div>

            <Button
              onClick={
                handlePractice
              }
              className="
                w-full
                sm:w-auto
              "
            >
              Nueva entrevista
            </Button>
          </header>

          <section className="mt-8">
            <h2
              className="
                text-lg
                font-bold
                text-[#252525]
              "
            >
              Tu progreso
            </h2>

            <div
              className="
                mt-4
                grid
                gap-4
                sm:grid-cols-3
              "
            >
              <StatCard
                label="Entrevistas completadas"
                value={
                  dashboard.stats
                    .completedInterviews
                }
                description="Sesiones finalizadas"
              />

              <StatCard
                label="Score promedio"
                value={
                  dashboard.stats
                    .averageScore ??
                  "—"
                }
                description={
                  dashboard.stats
                    .averageScore !==
                  null
                    ? "Promedio sobre 10"
                    : "Disponible con evaluaciones"
                }
              />

              <StatCard
                label="Minutos practicados"
                value={
                  dashboard.stats
                    .minutesPracticed
                }
                description="Tiempo de sesiones completadas"
              />
            </div>
          </section>

          <section
            className="
              mt-8
              rounded-2xl
              border
              border-[#E8E8E8]
              bg-white
              p-5
              shadow-sm
              sm:p-6
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
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F0EEFF]
                  text-[#5547E8]
                "
              >
                <BarChart3
                  size={18}
                />
              </div>

              <div>
                <h2
                  className="
                    text-base
                    font-semibold
                    text-[#252525]
                  "
                >
                  Progreso reciente
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[#888888]
                  "
                >
                  Evolución de tus evaluaciones.
                </p>
              </div>
            </div>

            {dashboard.progress.length >
            0 ? (
              <div className="mt-7 space-y-5">
                {dashboard.progress.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="
                        grid
                        grid-cols-[100px_1fr_40px]
                        items-center
                        gap-4
                        sm:grid-cols-[130px_1fr_50px]
                      "
                    >
                      <span
                        className="
                          text-xs
                          font-medium
                          text-[#666666]
                        "
                      >
                        {
                          item.label
                        }
                      </span>

                      <div
                        className="
                          h-2
                          overflow-hidden
                          rounded-full
                          bg-[#ECECF2]
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-[#5547E8]
                          "
                          style={{
                            width:
                              `${
                                item.score *
                                10
                              }%`,
                          }}
                        />
                      </div>

                      <span
                        className="
                          text-right
                          text-sm
                          font-bold
                          text-[#252525]
                        "
                      >
                        {
                          item.score
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div
                className="
                  mt-7
                  rounded-xl
                  bg-[#F7F8FA]
                  px-5
                  py-8
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                    text-[#555555]
                  "
                >
                  Tu evolución aparecerá aquí.
                </p>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-sm
                    text-xs
                    leading-5
                    text-[#999999]
                  "
                >
                  Cuando las evaluaciones estén
                  conectadas, podrás comparar
                  cómo mejora tu desempeño entre
                  entrevistas.
                </p>
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2
              className="
                text-lg
                font-bold
                text-[#252525]
              "
            >
              Tus entrevistas
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[#777777]
              "
            >
              Continúa una sesión o revisa
              entrevistas anteriores.
            </p>

            {dashboard.interviews.length >
            0 ? (
              <div className="mt-4 space-y-3">
                {dashboard.interviews.map(
                  (
                    interview
                  ) => (
                    <InterviewRow
                      key={
                        interview.id
                      }
                      interview={
                        interview
                      }
                      onOpen={() =>
                        openInterview(
                          interview
                        )
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div
                className="
                  mt-5
                  rounded-2xl
                  border
                  border-[#E8E8E8]
                  bg-white
                  px-6
                  py-10
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#252525]
                  "
                >
                  Todavía no tienes entrevistas.
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    text-[#888888]
                  "
                >
                  Prepara tu primera sesión para
                  empezar a construir tu progreso.
                </p>

                <div className="mt-6">
                  <Button
                    onClick={
                      handlePractice
                    }
                  >
                    Preparar entrevista
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section
            className="
              mt-8
              rounded-2xl
              bg-[#1F1F1F]
              p-6
              sm:flex
              sm:items-center
              sm:justify-between
              sm:gap-8
              sm:p-8
            "
          >
            <div>
              <h2
                className="
                  text-xl
                  font-bold
                  tracking-[-0.02em]
                  text-white
                "
              >
                Sigue practicando
              </h2>

              <p
                className="
                  mt-2
                  max-w-lg
                  text-sm
                  leading-6
                  text-white/60
                "
              >
                Cada sesión te ayuda a entender
                mejor cómo responder cuando
                llegue la entrevista real.
              </p>
            </div>

            <div
              className="
                mt-6
                sm:mt-0
              "
            >
              <Button
                variant="secondary"
                onClick={
                  handlePractice
                }
                className="
                  w-full
                  sm:w-auto
                "
              >
                Nueva entrevista
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface InterviewRowProps {
  interview:
    DashboardInterview;

  onOpen: () => void;
}

function InterviewRow({
  interview,
  onOpen,
}: InterviewRowProps) {
  const date =
    new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "numeric",
        month: "short",
      }
    ).format(
      new Date(
        interview.created_at
      )
    );

  const statusLabels = {
    configured:
      "Lista para comenzar",

    in_progress:
      "En progreso",

    processing:
      "Procesando",

    completed:
      "Completada",

    abandoned:
      "Abandonada",

    evaluation_failed:
      "Error de evaluación",
  };

  const actionLabels = {
    configured:
      "Preparar",

    in_progress:
      "Continuar",

    processing:
      "Ver progreso",

    completed:
      "Ver resultados",

    evaluation_failed:
      "Reintentar",

    abandoned:
      "Ver",
  };

  return (
    <article
      className="
        rounded-xl
        border
        border-[#E8E8E8]
        bg-white
        p-4
        shadow-sm
        sm:p-5
      "
    >
      <div
        className="
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-center
          sm:justify-between
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
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F0EEFF]
              text-[#5547E8]
            "
          >
            <MessageSquareText
              size={18}
            />
          </div>

          <div>
            <h3
              className="
                text-sm
                font-semibold
                text-[#252525]
              "
            >
              {
                interview.position
              }
            </h3>

            <div
              className="
                mt-1
                flex
                flex-wrap
                items-center
                gap-x-3
                gap-y-1
                text-xs
                text-[#888888]
              "
            >
              <span>
                {
                  formatInterviewType(
                    interview.interview_type
                  )
                }
              </span>

              <span>·</span>

              <span>
                {
                  statusLabels[
                    interview.status
                  ]
                }
              </span>

              <span>·</span>

              <span
                className="
                  flex
                  items-center
                  gap-1
                "
              >
                <Clock3
                  size={12}
                />

                {date}
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            justify-between
            gap-5
            border-t
            border-[#EEEEEE]
            pt-4
            sm:border-0
            sm:pt-0
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-[#999999]
              "
            >
              Score
            </p>

            <p
              className="
                mt-1
                text-base
                font-bold
                text-[#252525]
              "
            >
              {interview.score !==
              null
                ? `${interview.score}/10`
                : "—"}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={
              onOpen
            }
          >
            {
              actionLabels[
                interview.status
              ]
            }
          </Button>
        </div>
      </div>
    </article>
  );
}

function formatInterviewType(
  type: DashboardInterview["interview_type"]
) {
  const labels = {
    general: "General",
    behavioral: "Behavioral",
    technical: "Técnica",
    hr: "Recursos Humanos",
  };

  return labels[type];
}