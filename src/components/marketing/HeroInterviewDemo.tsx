import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    AnimatePresence,
    motion,
    useReducedMotion,
  } from "framer-motion";
  
  import {
    Check,
    LoaderCircle,
    MessageSquareText,
    Sparkles,
  } from "lucide-react";
  
  type DemoPhase =
    | "question"
    | "typing"
    | "analyzing"
    | "feedback"
    | "transition";
  
  interface DemoStep {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }
  
  const demoSteps: DemoStep[] = [
    {
      question:
        "Háblame de una ocasión en la que tuviste que resolver un problema con poco tiempo y muchas restricciones.",
  
      answer:
        "Priorizamos los problemas más importantes, redistribuí tareas con el equipo y logramos resolver el bloqueo a tiempo sin comprometer la calidad del proyecto.",
  
      score: 8.1,
  
      feedback:
        "Buen contexto y resultado concreto. Podrías explicar un poco más cómo tomaste la decisión.",
    },
  
    {
      question:
        "¿Cómo manejas conversaciones difíciles con tu equipo cuando existe desacuerdo sobre una decisión técnica?",
  
      answer:
        "Primero aclaro el objetivo común, escucho los argumentos de cada parte y después propongo una decisión basada en impacto, tiempo y mantenimiento futuro.",
  
      score: 8.6,
  
      feedback:
        "La respuesta tiene una estructura clara y demuestra criterio técnico y capacidad para generar acuerdos.",
    },
  
    {
      question:
        "¿Por qué te interesa este puesto y qué crees que puedes aportar desde tus primeras semanas?",
  
      answer:
        "Me interesa el reto del puesto y creo que puedo aportar experiencia, aprendizaje rápido y capacidad para convertir necesidades del equipo en resultados concretos.",
  
      score: 9.0,
  
      feedback:
        "Buena conexión entre motivación y valor. El cierre transmite seguridad sin exagerar.",
    },
  ];
  
  export default function HeroInterviewDemo() {
    const reduceMotion =
      useReducedMotion();
  
    const [
      activeIndex,
      setActiveIndex,
    ] = useState(0);
  
    const [
      phase,
      setPhase,
    ] =
      useState<DemoPhase>(
        "question"
      );
  
    const [
      typedText,
      setTypedText,
    ] = useState("");
  
    const [
      paused,
      setPaused,
    ] = useState(false);
  
    const activeStep =
      demoSteps[activeIndex];
  
    const isAnalyzing =
      phase === "analyzing";
  
    const showFeedback =
      phase === "feedback";
  
    const questionNumber =
      activeIndex + 1;
  
    /*
     * --------------------------------
     * SECUENCIA DE LA DEMO
     * --------------------------------
     */
  
    useEffect(() => {
      if (paused) {
        return;
      }
  
      let timeoutId:
        | number
        | undefined;
  
      if (phase === "question") {
        timeoutId =
          window.setTimeout(
            () => {
              setPhase("typing");
            },
            reduceMotion
              ? 250
              : 650
          );
      }
  
      if (phase === "analyzing") {
        timeoutId =
          window.setTimeout(
            () => {
              setPhase(
                "feedback"
              );
            },
            reduceMotion
              ? 350
              : 1100
          );
      }
  
      if (phase === "feedback") {
        timeoutId =
          window.setTimeout(
            () => {
              setPhase(
                "transition"
              );
            },
            2300
          );
      }
  
      if (phase === "transition") {
        timeoutId =
          window.setTimeout(
            () => {
              setActiveIndex(
                (current) =>
                  (current + 1) %
                  demoSteps.length
              );
  
              setTypedText("");
  
              setPhase(
                "question"
              );
            },
            reduceMotion
              ? 150
              : 400
          );
      }
  
      return () => {
        if (timeoutId) {
          window.clearTimeout(
            timeoutId
          );
        }
      };
    }, [
      phase,
      paused,
      reduceMotion,
    ]);
  
    /*
     * --------------------------------
     * ESCRITURA AUTOMÁTICA
     * --------------------------------
     */
  
    useEffect(() => {
      if (
        phase !== "typing" ||
        paused
      ) {
        return;
      }
  
      if (reduceMotion) {
        setTypedText(
          activeStep.answer
        );
  
        return;
      }
  
      if (
        typedText.length >=
        activeStep.answer.length
      ) {
        return;
      }
  
      const timeoutId =
        window.setTimeout(
          () => {
            setTypedText(
              activeStep.answer.slice(
                0,
                typedText.length + 1
              )
            );
          },
          17
        );
  
      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    }, [
      phase,
      paused,
      reduceMotion,
      typedText,
      activeStep.answer,
    ]);
  
    /*
     * --------------------------------
     * RESPUESTA COMPLETA
     * → ANALIZAR
     * --------------------------------
     */
  
    useEffect(() => {
      if (
        phase !== "typing" ||
        paused ||
        typedText.length <
          activeStep.answer.length
      ) {
        return;
      }
  
      const timeoutId =
        window.setTimeout(
          () => {
            setPhase(
              "analyzing"
            );
          },
          reduceMotion
            ? 150
            : 500
        );
  
      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    }, [
      phase,
      paused,
      typedText,
      activeStep.answer,
      reduceMotion,
    ]);
  
    /*
     * --------------------------------
     * GLOW SEGÚN ESTADO
     * --------------------------------
     */
  
    const glowClass =
      useMemo(() => {
        if (isAnalyzing) {
          return "bg-[#5547E8]/14";
        }
  
        if (showFeedback) {
          return "bg-[#00A980]/11";
        }
  
        return "bg-[#5547E8]/7";
      }, [
        isAnalyzing,
        showFeedback,
      ]);
  
    return (
      <motion.div
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 18,
                scale: 0.985,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.65,
          delay: 0.1,
        }}
        onMouseEnter={() =>
          setPaused(true)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
        className="
          relative
          mx-auto
          h-[650px]
          w-full
          max-w-[640px]
  
          sm:h-[640px]
        "
      >
        {/* Glow */}
        <motion.div
          animate={{
            opacity:
              isAnalyzing
                ? 1
                : 0.72,
  
            scale:
              isAnalyzing
                ? 1.035
                : 1,
          }}
          transition={{
            duration: 0.6,
          }}
          className={`
            pointer-events-none
            absolute
            inset-[6%]
            rounded-[50px]
            blur-[80px]
            transition-colors
            duration-700
            ${glowClass}
          `}
        />
  
        {/* Marco exterior */}
        <div
          className="
            relative
            h-full
            rounded-[36px]
            border
            border-white/90
            bg-white/70
            p-3
            shadow-[0_32px_90px_rgba(31,31,31,0.11)]
            backdrop-blur-xl
  
            sm:p-4
          "
        >
          {/* Ventana */}
          <div
            className="
              flex
              h-full
              flex-col
              overflow-hidden
              rounded-[28px]
              border
              border-[#E5E8ED]
              bg-white
              shadow-[0_4px_24px_rgba(31,31,31,0.04)]
            "
          >
            {/* HEADER */}
            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-5
                border-b
                border-[#EEF0F3]
                px-5
                py-5
  
                sm:px-6
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                  "
                >
                  <motion.span
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            scale: [
                              1,
                              1.18,
                              1,
                            ],
  
                            opacity: [
                              1,
                              0.65,
                              1,
                            ],
                          }
                    }
                    transition={{
                      duration: 2.2,
                      repeat:
                        Infinity,
                    }}
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-[#00A980]
                    "
                  />
  
                  <p
                    className="
                      text-sm
                      font-semibold
                      tracking-[-0.01em]
                      text-[#20242B]
                    "
                  >
                    Práctica de entrevista
                  </p>
                </div>
  
                <p
                  className="
                    mt-1.5
                    pl-[18px]
                    text-xs
                    text-[#87909F]
                  "
                >
                  Software Engineer
  
                  <span
                    className="
                      mx-2
                      text-[#C4C8CF]
                    "
                  >
                    /
                  </span>
  
                  Behavioral
                </p>
              </div>
  
              <motion.div
                key={
                  questionNumber
                }
                initial={{
                  opacity: 0,
                  y: 4,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="
                  flex
                  shrink-0
                  items-baseline
                  gap-1
                  whitespace-nowrap
                "
              >
                <span
                  className="
                    text-base
                    font-semibold
                    tabular-nums
                    text-[#323842]
                  "
                >
                  {String(
                    questionNumber
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
  
                <span
                  className="
                    text-xs
                    text-[#B4B8C0]
                  "
                >
                  /
                </span>
  
                <span
                  className="
                    text-xs
                    font-medium
                    tabular-nums
                    text-[#949AA4]
                  "
                >
                  {String(
                    demoSteps.length
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
              </motion.div>
            </div>
  
            {/* BODY */}
            <div
              className="
                flex
                min-h-0
                flex-1
                flex-col
                px-5
                pb-5
                pt-5
  
                sm:px-6
              "
            >
              {/* PREGUNTA */}
              <AnimatePresence
                mode="wait"
              >
                <motion.section
                  key={
                    activeStep.question
                  }
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 10,
                        }
                  }
                  animate={{
                    opacity:
                      phase ===
                      "transition"
                        ? 0
                        : 1,
  
                    y:
                      phase ===
                      "transition"
                        ? -7
                        : 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -7,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="
                    flex
                    h-[150px]
                    shrink-0
                    flex-col
                    justify-center
                    overflow-hidden
                    rounded-[22px]
                    bg-[#F6F7F9]
                    px-5
                    py-5
  
                    sm:px-6
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <span
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
                        questionNumber
                      }
                    </span>
  
                    <span
                      className="
                        text-[12px]
                        font-medium
                        text-[#858C98]
                      "
                    >
                      Entrevistador
                    </span>
                  </div>
  
                  <p
                    className="
                      mt-4
                      text-[15px]
                      font-semibold
                      leading-6
                      tracking-[-0.018em]
                      text-[#303743]
  
                      sm:text-[16px]
                    "
                  >
                    {
                      activeStep.question
                    }
                  </p>
                </motion.section>
              </AnimatePresence>
  
              {/* RESPUESTA */}
              <motion.section
                animate={{
                  opacity:
                    isAnalyzing
                      ? 0.58
                      : 1,
  
                  scale:
                    isAnalyzing
                      ? 0.997
                      : 1,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="
                  mt-4
                  h-[160px]
                  shrink-0
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-[#E1E5EB]
                  bg-white
                  px-5
                  py-5
  
                  sm:px-6
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                  "
                >
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#EAF8F4]
                      text-[#00A980]
                    "
                  >
                    <MessageSquareText
                      size={15}
                      strokeWidth={2}
                    />
                  </div>
  
                  <span
                    className="
                      text-sm
                      font-semibold
                      text-[#343B47]
                    "
                  >
                    Tu respuesta
                  </span>
                </div>
  
                <div
                  className="
                    mt-4
                    h-[92px]
                    overflow-hidden
                  "
                >
                  {typedText ? (
                    <p
                      className="
                        text-[14px]
                        leading-6
                        text-[#626C7C]
  
                        sm:text-[15px]
                      "
                    >
                      {typedText}
  
                      {phase ===
                        "typing" && (
                        <motion.span
                          animate={
                            reduceMotion
                              ? undefined
                              : {
                                  opacity:
                                    [
                                      1,
                                      0,
                                      1,
                                    ],
                                }
                          }
                          transition={{
                            duration:
                              0.8,
  
                            repeat:
                              Infinity,
                          }}
                          className="
                            ml-0.5
                            inline-block
                            h-[15px]
                            w-[1.5px]
                            translate-y-[2px]
                            bg-[#00A980]
                          "
                        />
                      )}
                    </p>
                  ) : (
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-[#A0A6B0]
                      "
                    >
                      <span
                        className="
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-[#C6CBD2]
                        "
                      />
  
                      Preparando respuesta
                    </div>
                  )}
                </div>
              </motion.section>
  
              {/* SLOT FIJO DE ANÁLISIS */}
              <div
                className="
                  mt-4
                  h-[128px]
                  shrink-0
                  overflow-hidden
                "
              >
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing"
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -6,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      className="
                        flex
                        h-full
                        items-center
                        justify-center
                        rounded-[22px]
                        border
                        border-[#E5E2FF]
                        bg-[#F8F7FF]
                        px-5
                        py-5
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
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
                            rounded-xl
                            bg-white
                            text-[#5547E8]
                            shadow-sm
                          "
                        >
                          <LoaderCircle
                            size={18}
                            className={
                              reduceMotion
                                ? ""
                                : "animate-spin"
                            }
                          />
                        </div>
  
                        <div>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-[#343746]
                            "
                          >
                            Analizando tu respuesta
                          </p>
  
                          <p
                            className="
                              mt-1
                              text-xs
                              text-[#9097A3]
                            "
                          >
                            Claridad, estructura e impacto
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : showFeedback ? (
                    <motion.div
                      key="feedback"
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale:
                          0.99,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -6,
                      }}
                      transition={{
                        duration:
                          0.35,
                      }}
                      className="
                        flex
                        h-full
                        flex-col
                        justify-between
                        overflow-hidden
                        rounded-[22px]
                        border
                        border-[#D4EAE4]
                        bg-[#F8FCFB]
                        px-5
                        py-4
  
                        sm:px-6
                      "
                    >
                      <div>
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
                              gap-2.5
                            "
                          >
                            <div
                              className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-white
                                text-[#00A980]
                                shadow-sm
                              "
                            >
                              <Sparkles
                                size={14}
                              />
                            </div>
  
                            <span
                              className="
                                truncate
                                text-xs
                                font-semibold
                                text-[#168C72]
                              "
                            >
                              Feedback de IA
                            </span>
                          </div>
  
                          <motion.div
                            initial={{
                              opacity: 0,
                              scale:
                                0.95,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                            }}
                            transition={{
                              delay:
                                0.12,
                            }}
                            className="
                              flex
                              shrink-0
                              items-baseline
                              gap-1
                            "
                          >
                            <span
                              className="
                                text-[23px]
                                font-bold
                                leading-none
                                tracking-[-0.04em]
                                text-[#22272E]
                              "
                            >
                              {
                                activeStep.score
                              }
                            </span>
  
                            <span
                              className="
                                text-xs
                                font-medium
                                text-[#9BA1AB]
                              "
                            >
                              /10
                            </span>
                          </motion.div>
                        </div>
  
                        <p
                          className="
                            mt-3
                            line-clamp-2
                            text-[13px]
                            leading-5
                            text-[#626C78]
  
                            sm:text-sm
                          "
                        >
                          {
                            activeStep.feedback
                          }
                        </p>
                      </div>
  
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          delay: 0.2,
                        }}
                        className="
                          flex
                          items-center
                          gap-2
                          text-[10px]
                          font-medium
                          text-[#84908B]
                        "
                      >
                        <div
                          className="
                            flex
                            h-5
                            w-5
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#E8F7F2]
                            text-[#00A980]
                          "
                        >
                          <Check
                            size={11}
                            strokeWidth={2.5}
                          />
                        </div>
  
                        Evaluación completada
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="
                        flex
                        h-full
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-xs
                          text-[#AFB4BC]
                        "
                      >
                        <Sparkles
                          size={13}
                        />
  
                        El feedback aparecerá al terminar
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
  
        {/* Pausa */}
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 4,
              }}
              className="
                pointer-events-none
                absolute
                bottom-[-28px]
                left-1/2
                -translate-x-1/2
                whitespace-nowrap
                text-[10px]
                font-medium
                text-[#A0A6AF]
              "
            >
              Demo en pausa
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }