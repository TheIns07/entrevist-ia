import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  AppHeader,
  Button,
  ChoiceCard,
  Input,
} from "../components";

import { useAuth } from "../auth/useAuth";

import {
  createInterviewSession,
} from "../services/interviews";

import type {
  ExperienceLevel,
  InterviewLanguage,
  InterviewType,
} from "../types/interview";

type OnboardingStage =
  | "intro"
  | "position"
  | "experience"
  | "type"
  | "language";

const configurationStages: Exclude<
  OnboardingStage,
  "intro"
>[] = [
    "position",
    "experience",
    "type",
    "language",
  ];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [
    creatingInterview,
    setCreatingInterview,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(
    null
  );

  const [stage, setStage] =
    useState<OnboardingStage>("intro");

  const [position, setPosition] = useState("");
  const [industry, setIndustry] = useState("");

  const [experience, setExperience] =
    useState<ExperienceLevel | null>(null);

  const [interviewType, setInterviewType] =
    useState<InterviewType | null>(null);

  const [language, setLanguage] =
    useState<InterviewLanguage>("es");

  const currentStep =
    stage === "intro"
      ? 0
      : configurationStages.indexOf(stage) + 1;

  const progress =
    stage === "intro"
      ? 0
      : (currentStep / configurationStages.length) * 100;

  const handleBack = () => {
    if (stage === "intro") {
      navigate("/register");
      return;
    }

    if (stage === "position") {
      setStage("intro");
      return;
    }

    if (stage === "experience") {
      setStage("position");
      return;
    }

    if (stage === "type") {
      setStage("experience");
      return;
    }

    if (stage === "language") {
      setStage("type");
    }
  };

  const handleFinish = async () => {
    if (
      !user ||
      !experience ||
      !interviewType ||
      position.trim().length < 2 ||
      creatingInterview
    ) {
      return;
    }
  
    try {
      setCreatingInterview(true);
      setSubmitError(null);
  
      const session =
        await createInterviewSession({
          userId: user.id,
          position,
          industry,
          experience,
          interviewType,
          language,
        });
  
      navigate(
        `/interview/setup/${session.id}`
      );
    } catch (error) {
      console.error(
        "Error creando entrevista:",
        error
      );
  
      setSubmitError(
        "No pudimos preparar tu entrevista. Intenta nuevamente."
      );
    } finally {
      setCreatingInterview(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        backLabel={stage === "intro" ? "Volver" : "Atrás"}
        onBack={handleBack}
      />

      {stage !== "intro" && (
        <div className="h-[2px] w-full bg-[#EEEEF2]">
          <div
            className="
              h-full
              bg-[#5547E8]
              transition-all
              duration-300
              ease-out
            "
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      <main
        className="
          px-5
          pb-16
          pt-10
          sm:px-8
          sm:pt-16
          lg:pb-24
        "
      >
        <div className="mx-auto w-full max-w-[640px]">
          {stage === "intro" && (
            <IntroStep
              onStart={() => setStage("position")}
            />
          )}

          {stage === "position" && (
            <div
              key="position"
              className="premium-step-enter"
            >
              <StepCounter step={1} />

              <StepHeading
                title="¿Qué puesto quieres conseguir?"
                description="Usaremos esto para adaptar las preguntas y el nivel de la conversación."
              />

              <div className="mt-10 space-y-5">
                <Input
                  label="Puesto objetivo"
                  name="position"
                  placeholder="Ej. Software Engineer"
                  value={position}
                  onChange={(event) =>
                    setPosition(event.target.value)
                  }
                  autoFocus
                />

                <Input
                  label="Industria"
                  name="industry"
                  placeholder="Ej. Tecnología"
                  value={industry}
                  onChange={(event) =>
                    setIndustry(event.target.value)
                  }
                  helperText="Opcional"
                />
              </div>

              <div className="mt-10 flex justify-end">
                <Button
                  size="lg"
                  disabled={position.trim().length < 2}
                  onClick={() =>
                    setStage("experience")
                  }
                  className="w-full sm:w-auto"
                >
                  Continuar
                  <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          )}

          {stage === "experience" && (
            <div
              key="experience"
              className="premium-step-enter"
            >
              <StepCounter step={2} />

              <StepHeading
                title="¿Cuánta experiencia tienes?"
                description="No buscamos juzgar tu nivel. Esto nos ayuda a calibrar la exigencia de la entrevista."
              />

              <div className="mt-10 space-y-3">
                <ChoiceCard
                  title="Estoy empezando"
                  description="Estudiantes, recién egresados o primeras experiencias profesionales."
                  selected={experience === "junior"}
                  onClick={() =>
                    setExperience("junior")
                  }
                />

                <ChoiceCard
                  title="Tengo experiencia"
                  description="Ya has trabajado en el área y puedes hablar de proyectos y resultados."
                  selected={experience === "mid"}
                  onClick={() =>
                    setExperience("mid")
                  }
                />

                <ChoiceCard
                  title="Tengo experiencia avanzada"
                  description="Roles senior, liderazgo, decisiones complejas o responsabilidad sobre equipos."
                  selected={experience === "senior"}
                  onClick={() =>
                    setExperience("senior")
                  }
                />
              </div>

              <div className="mt-10 flex justify-end">
                <Button
                  size="lg"
                  disabled={!experience}
                  onClick={() => setStage("type")}
                  className="w-full sm:w-auto"
                >
                  Continuar
                  <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          )}

          {stage === "type" && (
            <div
              key="type"
              className="premium-step-enter"
            >
              <StepCounter step={3} />

              <StepHeading
                title="¿Qué quieres practicar?"
                description="Elige el tipo de conversación que más se parece a tu próxima entrevista."
              />

              <div className="mt-10 space-y-3">
                <ChoiceCard
                  title="Entrevista general"
                  description="Una combinación equilibrada de experiencia, motivación y situaciones profesionales."
                  selected={
                    interviewType === "general"
                  }
                  onClick={() =>
                    setInterviewType("general")
                  }
                />

                <ChoiceCard
                  title="Behavioral"
                  description="Situaciones reales, conflictos, logros, decisiones y trabajo en equipo."
                  selected={
                    interviewType === "behavioral"
                  }
                  onClick={() =>
                    setInterviewType("behavioral")
                  }
                />

                <ChoiceCard
                  title="Técnica"
                  description="Conocimiento, razonamiento y preguntas relacionadas con tu especialidad."
                  selected={
                    interviewType === "technical"
                  }
                  onClick={() =>
                    setInterviewType("technical")
                  }
                />

                <ChoiceCard
                  title="Recursos Humanos"
                  description="Motivaciones, fortalezas, expectativas y compatibilidad con la organización."
                  selected={interviewType === "hr"}
                  onClick={() =>
                    setInterviewType("hr")
                  }
                />
              </div>

              <div className="mt-10 flex justify-end">
                <Button
                  size="lg"
                  disabled={!interviewType}
                  onClick={() =>
                    setStage("language")
                  }
                  className="w-full sm:w-auto"
                >
                  Continuar
                  <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          )}

          {stage === "language" && (
            <div
              key="language"
              className="premium-step-enter"
            >
              <StepCounter step={4} />

              <StepHeading
                title="¿En qué idioma será tu entrevista?"
                description="La sesión completa, las preguntas y el feedback utilizarán este idioma."
              />

              <div
                className="
                  mt-10
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <ChoiceCard
                  title="Español"
                  description="Realiza toda la práctica en español."
                  selected={language === "es"}
                  onClick={() => setLanguage("es")}
                />

                <ChoiceCard
                  title="English"
                  description="Practice the full interview in English."
                  selected={language === "en"}
                  onClick={() => setLanguage("en")}
                />
              </div>

              <div className="mt-10 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleFinish}
                  loading={creatingInterview}
                  disabled={creatingInterview}
                  className="w-full sm:w-auto"
                >
                  Preparar entrevista

                  {!creatingInterview && (
                    <ArrowRight size={17} />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface IntroStepProps {
  onStart: () => void;
}

function IntroStep({
  onStart,
}: IntroStepProps) {
  return (
    <section
      className="
        premium-step-enter
        flex
        min-h-[60vh]
        flex-col
        justify-center
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          bg-[#F0EEFF]
          text-[#5547E8]
        "
      >
        <Sparkles size={20} />
      </div>

      <h1
        className="
          mt-7
          max-w-xl
          text-[36px]
          font-bold
          leading-[1.08]
          tracking-[-0.04em]
          text-[#252525]
          sm:text-[48px]
        "
      >
        Vamos a preparar tu entrevista.
      </h1>

      <p
        className="
          mt-5
          max-w-lg
          text-base
          leading-7
          text-[#777777]
        "
      >
        En menos de un minuto adaptaremos la
        sesión a tu experiencia y al puesto que
        quieres conseguir.
      </p>

      <div className="mt-9">
        <Button
          size="lg"
          onClick={onStart}
          className="w-full sm:w-auto"
        >
          Empezar
          <ArrowRight size={17} />
        </Button>
      </div>

      <p className="mt-4 text-xs text-[#999999]">
        Toma menos de 1 minuto.
      </p>
    </section>
  );
}

interface StepCounterProps {
  step: number;
}

function StepCounter({
  step,
}: StepCounterProps) {
  return (
    <p
      className="
        text-xs
        font-semibold
        tracking-[0.08em]
        text-[#999999]
      "
    >
      {step} de 4
    </p>
  );
}

interface StepHeadingProps {
  title: string;
  description: string;
}

function StepHeading({
  title,
  description,
}: StepHeadingProps) {
  return (
    <header className="mt-4">
      <h1
        className="
          text-[30px]
          font-bold
          leading-tight
          tracking-[-0.035em]
          text-[#252525]
          sm:text-[38px]
        "
      >
        {title}
      </h1>

      <p
        className="
          mt-4
          max-w-lg
          text-sm
          leading-6
          text-[#777777]
          sm:text-base
        "
      >
        {description}
      </p>
    </header>
  );
}