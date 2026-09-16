import {
    useState,
  } from "react";
  
  import {
    LoaderCircle,
    Mic,
    Square,
  } from "lucide-react";
  
  import {
    useAudioRecorder,
  } from "../../hooks/useAudioRecorder";
  
  import {
    transcribeAudio,
    type TranscriptionLanguage,
  } from "../../services/ai/transcription.service";
  
  interface VoiceInputButtonProps {
    onTranscript:
      (
        text:
          string
      ) => void;
  
    language?:
      TranscriptionLanguage;
  
    disabled?:
      boolean;
  
    label?:
      string;
  }
  
  export default function VoiceInputButton({
    onTranscript,
  
    language =
      "auto",
  
    disabled =
      false,
  
    label =
      "Dictar",
  }: VoiceInputButtonProps) {
    const {
      isRecording,
      isSupported,
      elapsedSeconds,
      error:
        recorderError,
      startRecording,
      stopRecording,
      clearError,
    } =
      useAudioRecorder();
  
    const [
      transcribing,
      setTranscribing,
    ] =
      useState(
        false
      );
  
    const [
      actionError,
      setActionError,
    ] =
      useState<string | null>(
        null
      );
  
    const handleClick =
      async (): Promise<void> => {
        if (
          disabled ||
          transcribing
        ) {
          return;
        }
  
        setActionError(
          null
        );
  
        clearError();
  
        if (
          !isRecording
        ) {
          try {
            await startRecording();
          } catch (
            error
          ) {
            setActionError(
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
  
          onTranscript(
            result.text
          );
        } catch (
          error
        ) {
          setActionError(
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
  
    const visibleError =
      actionError ??
      recorderError;
  
    if (
      !isSupported
    ) {
      return (
        <p
          className="
            text-xs
            text-[#999999]
          "
        >
          El micrófono no está disponible
          en este navegador.
        </p>
      );
    }
  
    return (
      <div>
        <button
          type="button"
          disabled={
            disabled ||
            transcribing
          }
          aria-pressed={
            isRecording
          }
          onClick={() => {
            void handleClick();
          }}
          className={`
            inline-flex
            min-h-9
            items-center
            gap-2
            rounded-xl
            border
            px-3
            py-2
            text-xs
            font-semibold
            transition
  
            ${
              isRecording
                ? `
                    border-red-200
                    bg-red-50
                    text-red-700
  
                    hover:bg-red-100
                  `
                : `
                    border-[#DEDCEB]
                    bg-white
                    text-[#5547E8]
  
                    hover:border-[#C8C3F6]
                    hover:bg-[#F8F7FF]
                  `
            }
  
            ${
              disabled ||
              transcribing
                ? `
                    cursor-not-allowed
                    opacity-60
                  `
                : `
                    cursor-pointer
                  `
            }
          `}
        >
          {transcribing ? (
            <>
              <LoaderCircle
                size={14}
                className="animate-spin"
              />
  
              Transcribiendo...
            </>
          ) : isRecording ? (
            <>
              <Square
                size={12}
                fill="currentColor"
              />
  
              Terminar
              {" "}
              {formatTime(
                elapsedSeconds
              )}
            </>
          ) : (
            <>
              <Mic
                size={14}
              />
  
              {label}
            </>
          )}
        </button>
  
        {visibleError && (
          <p
            className="
              mt-2
              text-xs
              leading-5
              text-red-600
            "
          >
            {visibleError}
          </p>
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
  
    return `${minutes}:${String(
      remainder
    ).padStart(
      2,
      "0"
    )}`;
  }