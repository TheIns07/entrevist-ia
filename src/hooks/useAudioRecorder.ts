import {
  useEffect,
  useRef,
  useState,
} from "react";

export interface RecordedAudio {
  blob:
    Blob;

  mimeType:
    string;

  durationMs:
    number;
}

export type AudioRecorderStatus =
  | "idle"
  | "recording";

export interface AudioRecorderResult {
  status:
    AudioRecorderStatus;

  isRecording:
    boolean;

  isSupported:
    boolean;

  elapsedSeconds:
    number;

  audioLevel:
    number;

  error:
    string |
    null;

  startRecording:
    () =>
      Promise<void>;

  stopRecording:
    () =>
      Promise<RecordedAudio>;

  cancelRecording:
    () => void;

  clearError:
    () => void;
}

export function useAudioRecorder():
  AudioRecorderResult {
  const [
    status,
    setStatus,
  ] =
    useState<AudioRecorderStatus>(
      "idle"
    );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState(
      0
    );

  const [
    audioLevel,
    setAudioLevel,
  ] =
    useState(
      0
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const mediaStreamRef =
    useRef<MediaStream | null>(
      null
    );

  const audioContextRef =
    useRef<AudioContext | null>(
      null
    );

  const animationFrameRef =
    useRef<number | null>(
      null
    );

  const chunksRef =
    useRef<Blob[]>(
      []
    );

  const startedAtRef =
    useRef<number | null>(
      null
    );

  const intervalRef =
    useRef<number | null>(
      null
    );

  const stopResolveRef =
    useRef<
      (
        (
          audio:
            RecordedAudio
        ) => void
      ) |
      null
    >(
      null
    );

  const stopRejectRef =
    useRef<
      (
        (
          reason?:
            unknown
        ) => void
      ) |
      null
    >(
      null
    );

  const cancelRequestedRef =
    useRef(
      false
    );

  const isSupported =
    typeof window !==
      "undefined" &&
    typeof navigator !==
      "undefined" &&
    typeof MediaRecorder !==
      "undefined" &&
    Boolean(
      navigator
        .mediaDevices
        ?.getUserMedia
    );

  const clearTimer =
    (): void => {
      if (
        intervalRef.current !==
        null
      ) {
        window.clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    };

  const stopAudioLevel =
    (): void => {
      if (
        animationFrameRef.current !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      const audioContext =
        audioContextRef.current;

      audioContextRef.current =
        null;

      if (
        audioContext &&
        audioContext.state !==
          "closed"
      ) {
        void audioContext.close();
      }

      setAudioLevel(
        0
      );
    };

  const stopTracks =
    (): void => {
      const stream =
        mediaStreamRef.current;

      if (!stream) {
        return;
      }

      for (
        const track of
          stream.getTracks()
      ) {
        track.stop();
      }

      mediaStreamRef.current =
        null;
    };

  const resetRecorder =
    (): void => {
      clearTimer();

      stopAudioLevel();

      stopTracks();

      mediaRecorderRef.current =
        null;

      chunksRef.current =
        [];

      startedAtRef.current =
        null;

      setElapsedSeconds(
        0
      );

      setStatus(
        "idle"
      );
    };

  const startAudioLevel =
    (
      stream:
        MediaStream
    ): void => {
      const audioContext =
        new AudioContext();

      const source =
        audioContext
          .createMediaStreamSource(
            stream
          );

      const analyser =
        audioContext
          .createAnalyser();

      analyser.fftSize =
        512;

      analyser.smoothingTimeConstant =
        0.75;

      source.connect(
        analyser
      );

      audioContextRef.current =
        audioContext;

      const data =
        new Uint8Array(
          analyser.fftSize
        );

      const update =
        (): void => {
          analyser.getByteTimeDomainData(
            data
          );

          let total =
            0;

          for (
            let index = 0;
            index <
            data.length;
            index += 1
          ) {
            const sample =
              (
                data[index] -
                128
              ) /
              128;

            total +=
              sample *
              sample;
          }

          const rms =
            Math.sqrt(
              total /
                data.length
            );

          const normalized =
            Math.min(
              1,
              rms *
                9
            );

          setAudioLevel(
            normalized
          );

          animationFrameRef.current =
            window.requestAnimationFrame(
              update
            );
        };

      update();
    };

  const startRecording =
    async (): Promise<void> => {
      setError(
        null
      );

      if (
        !isSupported
      ) {
        const message =
          "Este navegador no permite grabar audio.";

        setError(
          message
        );

        throw new Error(
          message
        );
      }

      if (
        mediaRecorderRef
          .current &&
        mediaRecorderRef
          .current
          .state !==
          "inactive"
      ) {
        return;
      }

      try {
        const stream =
          await navigator
            .mediaDevices
            .getUserMedia({
              audio: {
                echoCancellation:
                  true,

                noiseSuppression:
                  true,

                autoGainControl:
                  true,
              },
            });

        const mimeType =
          chooseMimeType();

        const recorder =
          mimeType
            ? new MediaRecorder(
                stream,
                {
                  mimeType,
                }
              )
            : new MediaRecorder(
                stream
              );

        chunksRef.current =
          [];

        mediaStreamRef.current =
          stream;

        mediaRecorderRef.current =
          recorder;

        cancelRequestedRef.current =
          false;

        recorder.ondataavailable =
          (
            event:
              BlobEvent
          ) => {
            if (
              event.data.size >
              0
            ) {
              chunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onerror =
          () => {
            const recorderError =
              new Error(
                "Ocurrió un error mientras se grababa el audio."
              );

            setError(
              recorderError.message
            );

            stopRejectRef
              .current?.(
                recorderError
              );

            stopResolveRef.current =
              null;

            stopRejectRef.current =
              null;

            resetRecorder();
          };

        recorder.onstop =
          () => {
            const durationMs =
              startedAtRef.current
                ? Date.now() -
                  startedAtRef.current
                : 0;

            const outputMimeType =
              recorder.mimeType ||
              mimeType ||
              "audio/webm";

            const blob =
              new Blob(
                chunksRef.current,
                {
                  type:
                    outputMimeType,
                }
              );

            const wasCancelled =
              cancelRequestedRef.current;

            const resolve =
              stopResolveRef.current;

            const reject =
              stopRejectRef.current;

            stopResolveRef.current =
              null;

            stopRejectRef.current =
              null;

            resetRecorder();

            if (
              wasCancelled
            ) {
              reject?.(
                new Error(
                  "La grabación fue cancelada."
                )
              );

              return;
            }

            if (
              blob.size ===
              0
            ) {
              reject?.(
                new Error(
                  "La grabación no contiene audio."
                )
              );

              return;
            }

            resolve?.({
              blob,

              mimeType:
                outputMimeType,

              durationMs,
            });
          };

        startedAtRef.current =
          Date.now();

        recorder.start(
          250
        );

        startAudioLevel(
          stream
        );

        setElapsedSeconds(
          0
        );

        setStatus(
          "recording"
        );

        intervalRef.current =
          window.setInterval(
            () => {
              const startedAt =
                startedAtRef.current;

              if (!startedAt) {
                return;
              }

              setElapsedSeconds(
                Math.floor(
                  (
                    Date.now() -
                    startedAt
                  ) /
                    1000
                )
              );
            },
            250
          );
      } catch (
        recordingError
      ) {
        resetRecorder();

        const message =
          getMicrophoneErrorMessage(
            recordingError
          );

        setError(
          message
        );

        throw new Error(
          message
        );
      }
    };

  const stopRecording =
    (): Promise<RecordedAudio> => {
      const recorder =
        mediaRecorderRef.current;

      if (
        !recorder ||
        recorder.state ===
          "inactive"
      ) {
        return Promise.reject(
          new Error(
            "No hay una grabación activa."
          )
        );
      }

      return new Promise<
        RecordedAudio
      >(
        (
          resolve,
          reject
        ) => {
          stopResolveRef.current =
            resolve;

          stopRejectRef.current =
            reject;

          recorder.stop();
        }
      );
    };

  const cancelRecording =
    (): void => {
      const recorder =
        mediaRecorderRef.current;

      if (
        !recorder ||
        recorder.state ===
          "inactive"
      ) {
        resetRecorder();

        return;
      }

      cancelRequestedRef.current =
        true;

      recorder.stop();
    };

  const clearError =
    (): void => {
      setError(
        null
      );
    };

  useEffect(
    () => {
      return () => {
        const recorder =
          mediaRecorderRef.current;

        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {
          cancelRequestedRef.current =
            true;

          recorder.stop();
        }

        clearTimer();

        stopAudioLevel();

        stopTracks();
      };
    },
    []
  );

  return {
    status,

    isRecording:
      status ===
      "recording",

    isSupported,

    elapsedSeconds,

    audioLevel,

    error,

    startRecording,

    stopRecording,

    cancelRecording,

    clearError,
  };
}

function chooseMimeType():
  string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (
    const candidate of
      candidates
  ) {
    if (
      MediaRecorder
        .isTypeSupported(
          candidate
        )
    ) {
      return candidate;
    }
  }

  return "";
}

function getMicrophoneErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    DOMException
  ) {
    switch (
      error.name
    ) {
      case "NotAllowedError":
        return "Necesitamos permiso para usar el micrófono.";

      case "NotFoundError":
        return "No encontramos un micrófono disponible.";

      case "NotReadableError":
        return "No pudimos acceder al micrófono. Puede estar siendo utilizado por otra aplicación.";

      case "SecurityError":
        return "El navegador bloqueó el acceso al micrófono.";

      default:
        return error.message ||
          "No pudimos iniciar el micrófono.";
    }
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "No pudimos iniciar el micrófono.";
}