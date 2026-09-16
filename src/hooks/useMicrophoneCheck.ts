import {
    useEffect,
    useRef,
    useState,
  } from "react";
  
  export type MicrophoneCheckStatus =
    | "idle"
    | "checking"
    | "ready"
    | "error";
  
  export function useMicrophoneCheck() {
    const [
      status,
      setStatus,
    ] =
      useState<MicrophoneCheckStatus>(
        "idle"
      );
  
    const [
      level,
      setLevel,
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
  
    const streamRef =
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
  
    const detectedSignalRef =
      useRef(
        false
      );
  
    const stop =
      (): void => {
        if (
          animationFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );
  
          animationFrameRef.current =
            null;
        }
  
        streamRef.current
          ?.getTracks()
          .forEach(
            (
              track
            ) => {
              track.stop();
            }
          );
  
        streamRef.current =
          null;
  
        void audioContextRef.current
          ?.close();
  
        audioContextRef.current =
          null;
  
        setLevel(
          0
        );
      };
  
    const start =
      async (): Promise<void> => {
        stop();
  
        setError(
          null
        );
  
        setStatus(
          "checking"
        );
  
        detectedSignalRef.current =
          false;
  
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
  
          streamRef.current =
            stream;
  
          const audioContext =
            new AudioContext();
  
          audioContextRef.current =
            audioContext;
  
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
                    8
                );
  
              setLevel(
                normalized
              );
  
              /*
               * No basta con tener permiso:
               * necesitamos detectar señal.
               */
              if (
                rms >
                  0.015 &&
                !detectedSignalRef.current
              ) {
                detectedSignalRef.current =
                  true;
  
                setStatus(
                  "ready"
                );
              }
  
              animationFrameRef.current =
                requestAnimationFrame(
                  update
                );
            };
  
          update();
        } catch (
          caughtError
        ) {
          stop();
  
          const message =
            getMicrophoneErrorMessage(
              caughtError
            );
  
          setError(
            message
          );
  
          setStatus(
            "error"
          );
        }
      };
  
    useEffect(
      () => {
        return () => {
          stop();
        };
      },
      []
    );
  
    return {
      status,
      level,
      error,
      start,
      stop,
    };
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
          return "El navegador no tiene permiso para usar el micrófono.";
  
        case "NotFoundError":
          return "No encontramos un micrófono disponible.";
  
        case "NotReadableError":
          return "No pudimos acceder al micrófono.";
  
        default:
          return error.message;
      }
    }
  
    return "No pudimos comprobar el micrófono.";
  }