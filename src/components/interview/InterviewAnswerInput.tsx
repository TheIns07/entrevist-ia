import {
    useEffect,
    useState,
  } from "react";
  
  import {
    Keyboard,
    LoaderCircle,
    Mic,
    Square,
  } from "lucide-react";
  
  import {
    Textarea,
  } from "../";
  
  import {
    useAudioRecorder,
  } from "../../hooks/useAudioRecorder";
  
  import {
    transcribeAudio,
  } from "../../services/ai/transcription.service";
  
  import type {
    InterviewLanguage,
  } from "../../types/interview";
  
  type AnswerMode =
    | "voice"
    | "text";
  
  interface InterviewAnswerInputProps {
    value:
      string;
  
    onChange:
      (
        value:
          string
      ) => void;
  
    language:
      InterviewLanguage;
  
    maxLength?:
      number;
  
    disabled?:
      boolean;
  
    onBusyChange?:
      (
        busy:
          boolean
      ) => void;
  }
  
  export default function InterviewAnswerInput({
    value,
  
    onChange,
  
    language,
  
    maxLength =
      1200,
  
    disabled =
      false,
  
    onBusyChange,
  }: InterviewAnswerInputProps) {
    const [
      mode,
      setMode,
    ] =
      useState<AnswerMode>(
        "text"
      );
  
    const [
      transcribing,
      setTranscribing,
    ] =
      useState(
        false
      );
  
    const [
      transcriptionError,
      setTranscriptionError,
    ] =
      useState<string | null>(
        null
      );
  
    const {
      isRecording,
  
      isSupported,
  
      elapsedSeconds,
  
      audioLevel,
  
      error:
        recorderError,
  
      startRecording,
  
      stopRecording,
  
      cancelRecording,
  
      clearError,
    } =
      useAudioRecorder();
  
    const busy =
      isRecording ||
      transcribing;
  
    useEffect(
      () => {
        onBusyChange?.(
          busy
        );
      },
      [
        busy,
        onBusyChange,
      ]
    );
  
    const switchMode =
      (
        nextMode:
          AnswerMode
      ): void => {
        if (
          nextMode ===
          mode
        ) {
          return;
        }
  
        if (
          isRecording
        ) {
          cancelRecording();
        }
  
        clearError();
  
        setTranscriptionError(
          null
        );
  
        setMode(
          nextMode
        );
      };
  
    const handleMicrophone =
      async (): Promise<void> => {
        if (
          disabled ||
          transcribing
        ) {
          return;
        }
  
        clearError();
  
        setTranscriptionError(
          null
        );
  
        if (
          !isRecording
        ) {
          try {
            await startRecording();
          } catch (
            error
          ) {
            setTranscriptionError(
              error instanceof
                Error
                ? error.message
                : "No pudimos iniciar el micrófono."
            );
          }
  
          return;
        }
  
        try {
          const recording =
            await stopRecording();
  
          setTranscribing(
            true
          );
  
          const result =
            await transcribeAudio(
              recording.blob,
              {
                language,
              }
            );
  
          appendTranscript(
            result.text
          );
        } catch (
          error
        ) {
          setTranscriptionError(
            error instanceof
              Error
              ? error.message
              : "No pudimos transcribir el audio."
          );
        } finally {
          setTranscribing(
            false
          );
        }
      };
  
    const appendTranscript =
      (
        transcriptValue:
          string
      ): void => {
        const transcript =
          transcriptValue.trim();
  
        if (
          !transcript
        ) {
          return;
        }
  
        const previous =
          value.trim();
  
        const combined =
          previous
            ? `${previous} ${transcript}`
            : transcript;
  
        onChange(
          combined.slice(
            0,
            maxLength
          )
        );
      };
  
    return (
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#DDDDE5]
          bg-white
        "
      >
        {/* ===============================================
    SELECTOR DE MODO
=============================================== */}

        <div
          className="
    relative
    m-3
    grid
    grid-cols-2
    rounded-xl
    bg-[#F3F3F8]
    p-1
  "
        >
          {/* INDICADOR DESLIZANTE */}

          <div
            aria-hidden="true"
            className={`
      pointer-events-none
      absolute
      bottom-1
      left-1
      top-1
      w-[calc(50%-4px)]
      rounded-lg
      bg-white
      shadow-sm
      transition-transform
      duration-300
      ease-[cubic-bezier(0.22,1,0.36,1)]

      ${mode ===
                "voice"
                ? "translate-x-0"
                : "translate-x-full"
              }
    `}
          />

          <ModeButton
            active={
              mode ===
              "voice"
            }
            onClick={() => {
              switchMode(
                "voice"
              );
            }}
            icon={
              <Mic
                size={17}
              />
            }
          >
            Hablar
          </ModeButton>

          <ModeButton
            active={
              mode ===
              "text"
            }
            onClick={() => {
              switchMode(
                "text"
              );
            }}
            icon={
              <Keyboard
                size={18}
              />
            }
          >
            Escribir
          </ModeButton>
        </div>
  
        {/* ===============================================
            TEXTO
        =============================================== */}
  
        {mode ===
          "text" && (
          <div
            className="
              px-3
              pb-3
            "
          >
            <Textarea
              value={
                value
              }
              onChange={(
                event
              ) => {
                onChange(
                  event
                    .target
                    .value
                    .slice(
                      0,
                      maxLength
                    )
                );
              }}
              placeholder="Comparte tu respuesta aquí..."
              maxLength={
                maxLength
              }
              showCount
              size="lg"
              aria-label="Respuesta de la entrevista"
            />
          </div>
        )}
  
        {/* ===============================================
            VOZ
        =============================================== */}
  
        {mode ===
          "voice" && (
          <div
            className="
              flex
              min-h-[350px]
              flex-col
              items-center
              justify-center
              px-6
              py-10
              text-center
            "
          >
            {!isSupported ? (
              <p
                className="
                  text-sm
                  text-red-600
                "
              >
                Este navegador no permite
                grabar audio.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  disabled={
                    disabled ||
                    transcribing
                  }
                  onClick={() => {
                    void handleMicrophone();
                  }}
                  className={`
                    relative
                    flex
                    h-[92px]
                    w-[92px]
                    items-center
                    justify-center
                    rounded-full
                    transition-all
                    duration-200
  
                    ${
                      isRecording
                        ? `
                            bg-red-500
                            text-white
                            shadow-[0_0_0_12px_rgba(239,68,68,0.10)]
                          `
                        : `
                            bg-[#5547E8]
                            text-white
                            shadow-[0_0_0_12px_rgba(85,71,232,0.08)]
                            hover:scale-[1.03]
                          `
                    }
  
                    ${
                      disabled ||
                      transcribing
                        ? `
                            cursor-not-allowed
                            opacity-60
                          `
                        : ""
                    }
                  `}
                >
                  {transcribing ? (
                    <LoaderCircle
                      size={31}
                      className="
                        animate-spin
                      "
                    />
                  ) : isRecording ? (
                    <Square
                      size={25}
                      fill="currentColor"
                    />
                  ) : (
                    <Mic
                      size={32}
                    />
                  )}
  
                  {isRecording && (
                    <span
                      className="
                        absolute
                        inset-[-12px]
                        animate-ping
                        rounded-full
                        border
                        border-red-300
                        opacity-40
                      "
                    />
                  )}
                </button>
  
                <p
                  className="
                    mt-7
                    text-sm
                    font-semibold
                    text-[#5547E8]
                  "
                >
                  {transcribing
                    ? "Transcribiendo..."
                    : isRecording
                      ? "Escuchando..."
                      : "Pulsa para comenzar"}
                </p>
  
                {isRecording && (
                  <>
                    <p
                      className="
                        mt-2
                        text-sm
                        text-[#999999]
                      "
                    >
                      {formatTime(
                        elapsedSeconds
                      )}
                    </p>
  
                    <VoiceLevel
                      level={
                        audioLevel
                      }
                    />
                  </>
                )}
  
                {!isRecording &&
                  !transcribing && (
                    <p
                      className="
                        mt-2
                        max-w-[340px]
                        text-xs
                        leading-5
                        text-[#999999]
                      "
                    >
                      Habla de forma natural.
                      Cuando termines,
                      vuelve a pulsar el
                      micrófono.
                    </p>
                  )}
  
                {value &&
                  !isRecording &&
                  !transcribing && (
                    <div
                      className="
                        mt-7
                        w-full
                        max-w-[520px]
                        rounded-xl
                        bg-[#F8F8FB]
                        px-4
                        py-3
                        text-left
                      "
                    >
                      <p
                        className="
                          text-[11px]
                          font-semibold
                          uppercase
                          tracking-[0.08em]
                          text-[#AAAAAA]
                        "
                      >
                        Respuesta actual
                      </p>
  
                      <p
                        className="
                          mt-2
                          line-clamp-4
                          text-sm
                          leading-6
                          text-[#555555]
                        "
                      >
                        {value}
                      </p>
  
                      <button
                        type="button"
                        onClick={() => {
                          switchMode(
                            "text"
                          );
                        }}
                        className="
                          mt-3
                          text-xs
                          font-semibold
                          text-[#5547E8]
                        "
                      >
                        Editar transcripción
                      </button>
                    </div>
                  )}
              </>
            )}
  
            {(transcriptionError ||
              recorderError) && (
              <p
                className="
                  mt-5
                  text-sm
                  leading-6
                  text-red-600
                "
              >
                {transcriptionError ||
                  recorderError}
              </p>
            )}
          </div>
        )}
  
        {/* ===============================================
            CONTADOR EN VOZ
        =============================================== */}
  
        {mode ===
          "voice" && (
          <div
            className="
              border-t
              border-[#EEEEF2]
              px-5
              py-3
              text-right
            "
          >
            <span
              className="
                text-xs
                text-[#999999]
              "
            >
              {value.length}/
              {maxLength} caracteres
            </span>
          </div>
        )}
      </div>
    );
  }
  
  /*
   * =========================================================
   * MODE BUTTON
   * =========================================================
   */
  
  interface ModeButtonProps {
    active:
      boolean;
  
    onClick:
      () => void;
  
    icon:
      React.ReactNode;
  
    children:
      React.ReactNode;
  }
  
  function ModeButton({
    active,
    onClick,
    icon,
    children,
  }: ModeButtonProps) {
    return (
      <button
        type="button"
        onClick={
          onClick
        }
        className={`
          relative
          z-10
          flex
          items-center
          justify-center
          gap-2
          rounded-lg
          px-4
          py-3
          text-sm
          font-semibold
          transition-colors
          duration-300
  
          ${
            active
              ? `
                  text-[#5547E8]
                `
              : `
                  text-[#7C8494]
  
                  hover:text-[#5F6673]
                `
          }
        `}
      >
        <span
          className={`
            transition-transform
            duration-300
  
            ${
              active
                ? "scale-105"
                : "scale-100"
            }
          `}
        >
          {icon}
        </span>
  
        <span>
          {children}
        </span>
      </button>
    );
  }
  
  /*
   * =========================================================
   * VOICE LEVEL
   * =========================================================
   */
  
  interface VoiceLevelProps {
    level:
      number;
  }
  
  function VoiceLevel({
    level,
  }: VoiceLevelProps) {
    const bars =
      [
        0.38,
        0.7,
        1,
        0.58,
        0.85,
        0.48,
        0.92,
        0.64,
        0.42,
      ];
  
    return (
      <div
        className="
          mt-6
          flex
          h-10
          items-center
          justify-center
          gap-1.5
        "
      >
        {bars.map(
          (
            multiplier,
            index
          ) => {
            const height =
              Math.max(
                5,
                Math.min(
                  36,
                  5 +
                    level *
                      36 *
                      multiplier
                )
              );
  
            return (
              <span
                key={
                  index
                }
                className="
                  w-[3px]
                  rounded-full
                  bg-[#7165EE]
                  transition-[height]
                  duration-75
                "
                style={{
                  height:
                    `${height}px`,
                }}
              />
            );
          }
        )}
      </div>
    );
  }
  
  function formatTime(
    seconds:
      number
  ): string {
    const minutes =
      Math.floor(
        seconds /
          60
      );
  
    const remainder =
      seconds %
      60;
  
    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainder
    ).padStart(
      2,
      "0"
    )}`;
  }