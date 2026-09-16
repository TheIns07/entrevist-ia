import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileText,
  Languages,
  Layers3,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  Input,
} from "../components";

import {
  useAuth,
} from "../auth/useAuth";

import {
  createInterviewSession,
} from "../services/interviews";

import {
  PdfEngineError,
} from "../lib/pdf-engine/errors";

import {
  extractPdfTextPreview,
  type PdfTextPreviewResult,
} from "../services/pdf.service";

import type {
  PdfProbeProgress,
} from "../lib/pdf-engine/content/RawTextProbe";

type Experience =
  | "junior"
  | "mid"
  | "senior";

type InterviewType =
  | "general"
  | "behavioral"
  | "technical"
  | "hr";

type InterviewLanguage =
  | "es"
  | "en";

type OnboardingStep =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5;

interface ChoiceOption<T extends string> {
  value: T;
  title: string;
  description: string;
}

const experienceOptions: ChoiceOption<Experience>[] = [
  {
    value: "junior",
    title: "Inicial",
    description:
      "Estoy comenzando mi carrera o tengo poca experiencia en el puesto.",
  },
  {
    value: "mid",
    title: "Intermedio",
    description:
      "Ya tengo experiencia profesional y quiero prepararme para el siguiente nivel.",
  },
  {
    value: "senior",
    title: "Avanzado",
    description:
      "Tengo experiencia sólida y busco practicar conversaciones de mayor profundidad.",
  },
];

const interviewTypeOptions: ChoiceOption<InterviewType>[] = [
  {
    value: "general",
    title: "General",
    description:
      "Una entrevista equilibrada con preguntas sobre experiencia, motivación y situaciones profesionales.",
  },
  {
    value: "behavioral",
    title: "Behavioral",
    description:
      "Enfocada en situaciones reales, toma de decisiones, colaboración y resolución de problemas.",
  },
  {
    value: "technical",
    title: "Técnica",
    description:
      "Orientada a conocimientos, razonamiento técnico y situaciones propias del puesto.",
  },
  {
    value: "hr",
    title: "Recursos Humanos",
    description:
      "Motivaciones, expectativas, cultura, fortalezas y trayectoria profesional.",
  },
];

const languageOptions: ChoiceOption<InterviewLanguage>[] = [
  {
    value: "es",
    title: "Español",
    description:
      "La entrevista y el feedback se realizarán en español.",
  },
  {
    value: "en",
    title: "English",
    description:
      "The interview and feedback will be conducted in English.",
  },
];

export default function OnboardingPage() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const [
    step,
    setStep,
  ] =
    useState<OnboardingStep>(
      0
    );

  const [
    position,
    setPosition,
  ] = useState("");

  const [
    industry,
    setIndustry,
  ] = useState("");

  const [
    experience,
    setExperience,
  ] =
    useState<Experience>(
      "mid"
    );

  const [
    interviewType,
    setInterviewType,
  ] =
    useState<InterviewType>(
      "general"
    );

  const [
    language,
    setLanguage,
  ] =
    useState<InterviewLanguage>(
      "es"
    );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] =
    useState<string | null>(
      null
    );

  const [
    pdfFile,
    setPdfFile,
  ] = useState<File | null>(
    null
  );

  const [
    pdfPreview,
    setPdfPreview,
  ] =
    useState<PdfTextPreviewResult | null>(
      null
    );

  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);

  const [
    pdfError,
    setPdfError,
  ] =
    useState<string | null>(
      null
    );

  const [
    pdfProgress,
    setPdfProgress,
  ] =
    useState<PdfProbeProgress | null>(
      null
    );

  /*
   * =========================================================
   * PROGRESO
   * =========================================================
   */

  const progress =
    useMemo(() => {
      if (step === 0) {
        return 0;
      }

      return (
        (step / 5) *
        100
      );
    }, [step]);

  /*
   * =========================================================
   * VALIDACIÓN
   * =========================================================
   */

  const canContinue =
    useMemo(() => {
      switch (step) {
        case 0:
          return true;

        case 1:
          return (
            position
              .trim()
              .length >= 2
          );

        case 2:
          return !pdfLoading;

        case 3:
          return Boolean(
            experience
          );

        case 4:
          return Boolean(
            interviewType
          );

        case 5:
          return Boolean(
            language
          );

        default:
          return false;
      }
    }, [
      step,
      position,
      experience,
      interviewType,
      language,
      pdfLoading
    ]);

  const handlePdfChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setPdfFile(file);

      setPdfPreview(null);

      setPdfError(null);

      setPdfLoading(true);

      setPdfProgress({
        stage: "starting",
        message:
          "Preparando archivo...",
        progress: 1,
      });

      try {
        const result =
          await extractPdfTextPreview(
            file,
            (
              progress
            ) => {
              setPdfProgress(
                progress
              );

              console.log(
                "[Onboarding PDF]",
                progress
              );
            }
          );

        setPdfPreview(
          result
        );

        console.log(
          "=============================="
        );

        console.log(
          "RAW TEXT"
        );

        console.log(
          "=============================="
        );

        console.log(
          result.rawText
        );

        console.log(
          "=============================="
        );

        console.log(
          "LAYOUT TEXT"
        );

        console.log(
          "=============================="
        );

        console.log(
          result.layoutText
        );

        console.log(
          "=============================="
        );

        console.log(
          "CLEAN TEXT"
        );

        console.log(
          "=============================="
        );

        console.log(
          result.cleanText
        );

        console.log(
          "=============================="
        );

        console.log(
          "REMOVED FRAGMENTS"
        );

        console.log(
          "=============================="
        );

        console.table(
          result.removedFragments
        );
      } catch (error) {
        console.error(
          "PDF Engine error:",
          error
        );

        if (
          error instanceof
          PdfEngineError
        ) {
          setPdfError(
            `${error.code}: ${error.message}`
          );
        } else if (
          error instanceof
          Error
        ) {
          setPdfError(
            error.message
          );
        } else {
          setPdfError(
            "No pudimos procesar este PDF."
          );
        }
      } finally {
        setPdfLoading(false);
      }
    };

  const clearPdf =
    () => {
      setPdfFile(null);

      setPdfPreview(null);

      setPdfError(null);

      setPdfProgress(null);
    };

  /*
   * =========================================================
   * ATRÁS
   * =========================================================
   */

  const handleBack =
    () => {
      setSubmitError(
        null
      );

      if (step === 0) {
        navigate(
          "/dashboard"
        );

        return;
      }

      setStep(
        (
          current
        ) =>
          Math.max(
            0,
            current - 1
          ) as OnboardingStep
      );
    };

  /*
   * =========================================================
   * CONTINUAR
   * =========================================================
   */

  const handleContinue =
    async () => {
      if (
        !canContinue ||
        submitting
      ) {
        return;
      }

      setSubmitError(
        null
      );

      /*
       * Si todavía no estamos
       * en el último paso,
       * simplemente avanzamos.
       */
      if (step < 5) {
        setStep(
          (
            current
          ) =>
            (
              current + 1
            ) as OnboardingStep
        );

        return;
      }

      /*
       * Necesitamos un usuario
       * autenticado para crear
       * la entrevista.
       */
      if (!user) {
        setSubmitError(
          "Tu sesión ha expirado. Inicia sesión nuevamente."
        );

        return;
      }

      /*
       * =====================================================
       * CREAR ENTREVISTA EN SUPABASE
       * =====================================================
       */

      try {
        setSubmitting(
          true
        );

        const session =
          await createInterviewSession({
            userId:
              user.id,

            position:
              position.trim(),

            industry:
              industry.trim() ||
              undefined,

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
        setSubmitting(
          false
        );
      }
    };

  /*
   * =========================================================
   * TEXTO DEL BOTÓN
   * =========================================================
   */

  const buttonText =
    step === 0
      ? "Comenzar"
      : step === 5
        ? "Preparar entrevista"
        : "Continuar";

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
        onBack={
          handleBack
        }
        backLabel={
          step === 0
            ? "Volver"
            : "Atrás"
        }
      />

      {/* PROGRESS */}
      <div
        className="
          h-[2px]
          w-full
          bg-[#EBEBF0]
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
          lg:pt-16
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[680px]
          "
        >
          {/* ===============================================
              INTRO
          =============================================== */}

          {step === 0 && (
            <div
              key="intro"
              className="premium-step-enter"
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#EEECFF]
                  text-[#5547E8]
                "
              >
                <BriefcaseBusiness
                  size={22}
                  strokeWidth={2}
                />
              </div>

              <h1
                className="
                  mt-7
                  text-[34px]
                  font-bold
                  leading-[1.1]
                  tracking-[-0.04em]
                  text-[#242424]

                  sm:text-[46px]
                "
              >
                Vamos a preparar
                tu entrevista.
              </h1>

              <p
                className="
                  mt-5
                  max-w-[570px]
                  text-[15px]
                  leading-7
                  text-[#737373]

                  sm:text-base
                "
              >
                Cuéntanos un poco
                sobre la entrevista
                que quieres practicar.
                Usaremos esta
                información para
                adaptar la experiencia
                a tu objetivo.
              </p>

              <div
                className="
                  mt-10
                  grid
                  gap-3

                  sm:grid-cols-3
                "
              >
                <MiniFeature
                  number="01"
                  text="Define el puesto"
                />

                <MiniFeature
                  number="02"
                  text="Analiza tu CV"
                />

                <MiniFeature
                  number="03"
                  text="Personaliza la entrevista"
                />
              </div>
            </div>
          )}

          {/* ===============================================
              POSITION
          =============================================== */}

          {step === 1 && (
            <div
              key="position"
              className="premium-step-enter"
            >
              <StepLabel
                current={1}
                total={5}
              />

              <h1
                className="
                  mt-4
                  text-[30px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-[#252525]

                  sm:text-[40px]
                "
              >
                ¿Para qué puesto
                quieres practicar?
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#777777]

                  sm:text-base
                "
              >
                Entre más específico
                seas, mejor podremos
                adaptar las preguntas.
              </p>

              <div
                className="
                  mt-9
                  space-y-5
                "
              >
                <Input
                  label="Puesto"
                  value={
                    position
                  }
                  onChange={(
                    event
                  ) =>
                    setPosition(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Ej. Software Engineer"
                  autoFocus
                />

                <Input
                  label="Industria"
                  value={
                    industry
                  }
                  onChange={(
                    event
                  ) =>
                    setIndustry(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Ej. Tecnología"
                  helperText="Opcional"
                />
              </div>
            </div>
          )}

          {/* ===============================================
    PDF / CV
=============================================== */}


          {step === 2 && (
            <div
              key="pdf"
              className="premium-step-enter"
            >
              <StepLabel
                current={2}
                total={5}
              />

              <div
                className="
        mt-5
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-xl
        bg-[#EAF8F4]
        text-[#00A980]
      "
              >
                <FileText
                  size={20}
                />
              </div>

              <h1
                className="
        mt-5
        text-[30px]
        font-bold
        leading-tight
        tracking-[-0.035em]
        text-[#252525]

        sm:text-[40px]
      "
              >
                Probemos tu CV.
              </h1>

              <p
                className="
        mt-4
        max-w-xl
        text-sm
        leading-6
        text-[#777777]

        sm:text-base
      "
              >
                Sube un PDF para probar
                nuestro motor de extracción.
                Por ahora mostraremos
                exactamente el texto que
                logramos recuperar.
              </p>

              {!pdfFile && (
                <label
                  htmlFor="cv-pdf-upload"
                  className="
          mt-8
          flex
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-[#DADAE3]
          bg-white
          px-6
          py-10
          text-center
          transition

          hover:border-[#BDB7F5]
          hover:bg-[#FCFBFF]
        "
                >
                  <div
                    className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-[#F1EFFF]
            text-[#5547E8]
          "
                  >
                    <UploadCloud
                      size={20}
                    />
                  </div>

                  <p
                    className="
            mt-4
            text-sm
            font-semibold
            text-[#323232]
          "
                  >
                    Selecciona tu CV
                  </p>

                  <p
                    className="
            mt-1
            text-xs
            text-[#999999]
          "
                  >
                    PDF · máximo 25 MB
                  </p>

                  <input
                    id="cv-pdf-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={
                      handlePdfChange
                    }
                  />
                </label>
              )}

              {pdfFile && (
                <div
                  className="
          mt-8
          rounded-2xl
          border
          border-[#E4E4E8]
          bg-white
          p-5
        "
                >
                  <div
                    className="
            flex
            items-center
            justify-between
            gap-4
          "
                  >
                    <div
                      className="
              flex
              min-w-0
              items-center
              gap-3
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
                rounded-xl
                bg-[#F1EFFF]
                text-[#5547E8]
              "
                      >
                        <FileText
                          size={18}
                        />
                      </div>

                      <div
                        className="
                min-w-0
              "
                      >
                        <p
                          className="
                  truncate
                  text-sm
                  font-semibold
                  text-[#333333]
                "
                        >
                          {pdfFile.name}
                        </p>

                        <p
                          className="
                  mt-0.5
                  text-xs
                  text-[#999999]
                "
                        >
                          {formatFileSize(
                            pdfFile.size
                          )}
                        </p>
                      </div>
                    </div>

                    {!pdfLoading && (
                      <button
                        type="button"
                        onClick={
                          clearPdf
                        }
                        className="
                text-xs
                font-medium
                text-[#888888]
              "
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  {pdfLoading && (
                    <div
                      className="
                        mt-5
                        rounded-xl
                        bg-[#F8F7FF]
                        px-4
                        py-4
                      "
                    >
                      <div
                        className="
        flex
        items-center
        gap-2
        text-sm
        text-[#5547E8]
      "
                      >
                        <LoaderCircle
                          size={15}
                          className="animate-spin"
                        />

                        {pdfProgress?.message ??
                          "Leyendo PDF..."}
                      </div>

                      <div
                        className="
        mt-3
        h-1.5
        overflow-hidden
        rounded-full
        bg-[#E7E4FF]
      "
                      >
                        <div
                          className="
          h-full
          rounded-full
          bg-[#5547E8]
          transition-all
          duration-300
        "
                          style={{
                            width:
                              `${pdfProgress?.progress ?? 0}%`,
                          }}
                        />
                      </div>

                      <div
                        className="
        mt-2
        flex
        justify-between
        text-[11px]
        text-[#999999]
      "
                      >
                        <span>
                          {pdfProgress?.stage ??
                            "starting"}
                        </span>

                        <span>
                          {pdfProgress?.progress ??
                            0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pdfError && (
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
                    {pdfError}
                  </p>
                </div>
              )}

              {pdfPreview && (
                <div
                  className="
          mt-5
          overflow-hidden
          rounded-2xl
          border
          border-[#E4E4E8]
          bg-white
        "
                >
                  <div
                    className="
            flex
            items-center
            justify-between
            border-b
            border-[#EEEEF1]
            px-5
            py-4
          "
                  >
                    <div>
                      <p
                        className="
                text-sm
                font-semibold
                text-[#303030]
              "
                      >
                        Texto obtenido
                      </p>

                      <p
                        className="
                mt-1
                text-xs
                text-[#999999]
              "
                      >
                        {pdfPreview.pageCount}{" "}
                        {pdfPreview.pageCount === 1
                          ? "página"
                          : "páginas"}
                      </p>
                    </div>

                    <Check
                      size={17}
                      className="
              text-[#00A980]
            "
                    />
                  </div>

                  <pre
                    className="
            max-h-[420px]
            overflow-auto
            whitespace-pre-wrap
            break-words
            px-5
            py-5
            font-mono
            text-[12px]
            leading-6
            text-[#505050]
          "
                  >
                    {pdfPreview.cleanText ||
                      pdfPreview.layoutText ||
                      pdfPreview.rawText ||
                      "No se recuperó texto legible."}
                  </pre>
                </div>
              )}

              <p
                className="
        mt-5
        text-xs
        text-[#999999]
      "
              >
                Este paso es opcional por ahora.
              </p>
            </div>
          )}

          {/* ===============================================
              EXPERIENCE
          =============================================== */}

          {step === 3 && (
            <div
              key="experience"
              className="premium-step-enter"
            >
              <StepLabel
                current={3}
                total={5}
              />

              <h1
                className="
                  mt-4
                  text-[30px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-[#252525]

                  sm:text-[40px]
                "
              >
                ¿Qué nivel de
                experiencia tienes?
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#777777]

                  sm:text-base
                "
              >
                Esto nos ayuda a
                ajustar la profundidad
                y dificultad de la
                entrevista.
              </p>

              <div
                className="
                  mt-9
                  space-y-3
                "
              >
                {experienceOptions.map(
                  (
                    option
                  ) => (
                    <SelectableCard
                      key={
                        option.value
                      }
                      title={
                        option.title
                      }
                      description={
                        option.description
                      }
                      selected={
                        experience ===
                        option.value
                      }
                      onClick={() =>
                        setExperience(
                          option.value
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ===============================================
              INTERVIEW TYPE
          =============================================== */}

          {step === 4 && (
            <div
              key="type"
              className="premium-step-enter"
            >
              <StepLabel
                current={4}
                total={5}
              />

              <div
                className="
                  mt-5
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EEECFF]
                  text-[#5547E8]
                "
              >
                <Layers3
                  size={20}
                />
              </div>

              <h1
                className="
                  mt-5
                  text-[30px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-[#252525]

                  sm:text-[40px]
                "
              >
                ¿Qué tipo de
                entrevista quieres
                practicar?
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#777777]

                  sm:text-base
                "
              >
                Selecciona el enfoque
                que más se parezca a
                tu próxima entrevista.
              </p>

              <div
                className="
                  mt-9
                  grid
                  gap-3

                  sm:grid-cols-2
                "
              >
                {interviewTypeOptions.map(
                  (
                    option
                  ) => (
                    <SelectableCard
                      key={
                        option.value
                      }
                      title={
                        option.title
                      }
                      description={
                        option.description
                      }
                      selected={
                        interviewType ===
                        option.value
                      }
                      onClick={() =>
                        setInterviewType(
                          option.value
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ===============================================
              LANGUAGE
          =============================================== */}

          {step === 5 && (
            <div
              key="language"
              className="premium-step-enter"
            >
              <StepLabel
                current={5}
                total={5}
              />

              <div
                className="
                  mt-5
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EAF8F4]
                  text-[#00A980]
                "
              >
                <Languages
                  size={20}
                />
              </div>

              <h1
                className="
                  mt-5
                  text-[30px]
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  text-[#252525]

                  sm:text-[40px]
                "
              >
                ¿En qué idioma
                quieres practicar?
              </h1>

              <p
                className="
                  mt-4
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#777777]

                  sm:text-base
                "
              >
                Tanto las preguntas
                como el feedback se
                adaptarán al idioma
                seleccionado.
              </p>

              <div
                className="
                  mt-9
                  space-y-3
                "
              >
                {languageOptions.map(
                  (
                    option
                  ) => (
                    <SelectableCard
                      key={
                        option.value
                      }
                      title={
                        option.title
                      }
                      description={
                        option.description
                      }
                      selected={
                        language ===
                        option.value
                      }
                      onClick={() =>
                        setLanguage(
                          option.value
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ===============================================
              ERROR
          =============================================== */}

          {submitError && (
            <div
              className="
                mt-7
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
                {submitError}
              </p>
            </div>
          )}

          {/* ===============================================
              NAVIGATION
          =============================================== */}

          <div
            className="
              mt-10
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {step > 0 ? (
              <Button
                variant="ghost"
                size="lg"
                disabled={
                  submitting || 
                  pdfLoading
                }
                onClick={
                  handleBack
                }
              >
                <span
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <ArrowLeft
                    size={16}
                  />

                  Atrás
                </span>
              </Button>
            ) : (
              <div />
            )}

            <Button
              size="lg"
              disabled={
                !canContinue ||
                submitting
              }
              loading={
                submitting
              }
              onClick={
                handleContinue
              }
            >
              <span
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                {buttonText}

                {!submitting && (
                  <ArrowRight
                    size={16}
                  />
                )}
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * STEP LABEL
 * =========================================================
 */

interface StepLabelProps {
  current: number;
  total: number;
}

function StepLabel({
  current,
  total,
}: StepLabelProps) {
  return (
    <p
      className="
        text-xs
        font-semibold
        tracking-[0.08em]
        text-[#5547E8]
      "
    >
      PASO {current} DE{" "}
      {total}
    </p>
  );
}

/*
 * =========================================================
 * SELECTABLE CARD
 * =========================================================
 */

interface SelectableCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function SelectableCard({
  title,
  description,
  selected,
  onClick,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        w-full
        rounded-2xl
        border
        p-5
        text-left
        transition-all
        duration-200

        ${selected
          ? `
              border-[#5547E8]
              bg-[#F7F6FF]
              shadow-[0_8px_30px_rgba(85,71,232,0.08)]
            `
          : `
              border-[#E5E5E8]
              bg-white
              hover:border-[#CBC7F6]
              hover:bg-[#FCFBFF]
            `
        }
      `}
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-sm
              font-semibold
              text-[#292929]
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-[#777777]
            "
          >
            {description}
          </p>
        </div>

        <div
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            transition-all

            ${selected
              ? `
                  border-[#5547E8]
                  bg-[#5547E8]
                  text-white
                `
              : `
                  border-[#D7D7DC]
                  bg-white
                  text-transparent
                `
            }
          `}
        >
          <Check
            size={13}
            strokeWidth={3}
          />
        </div>
      </div>
    </button>
  );
}

/*
 * =========================================================
 * MINI FEATURE
 * =========================================================
 */

interface MiniFeatureProps {
  number: string;
  text: string;
}

function MiniFeature({
  number,
  text,
}: MiniFeatureProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#E7E7EA]
        bg-white
        p-4
      "
    >
      <p
        className="
          text-[11px]
          font-semibold
          text-[#AAA7C9]
        "
      >
        {number}
      </p>

      <p
        className="
          mt-2
          text-sm
          font-semibold
          leading-5
          text-[#444444]
        "
      >
        {text}
      </p>
    </div>
  );
}

function formatFileSize(
  bytes: number
): string {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(
    1
  )} MB`;
}