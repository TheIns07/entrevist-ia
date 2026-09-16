import {
    FunctionsHttpError,
  } from "@supabase/supabase-js";
  
  import {
    supabase,
  } from "../../lib/supabase";
  
  export type TranscriptionLanguage =
    | "auto"
    | "es"
    | "en";
  
  export interface TranscriptionResult {
    text:
      string;
  
    model:
      string;
  
    language:
      TranscriptionLanguage;
  }
  
  interface TranscriptionResponse {
    text?:
      string;
  
    model?:
      string;
  
    language?:
      TranscriptionLanguage;
  
    error?:
      string;
  
    message?:
      string;
  }
  
  export interface TranscribeAudioOptions {
    language?:
      TranscriptionLanguage;
  }
  
  export async function transcribeAudio(
    audio:
      Blob,
  
    options:
      TranscribeAudioOptions = {}
  ): Promise<TranscriptionResult> {
    if (
      audio.size ===
      0
    ) {
      throw new Error(
        "La grabación está vacía."
      );
    }
  
    const language =
      options.language ??
      "auto";
  
    const extension =
      getAudioExtension(
        audio.type
      );
  
    const file =
      new File(
        [
          audio,
        ],
  
        `recording.${extension}`,
  
        {
          type:
            audio.type ||
            getFallbackMimeType(
              extension
            ),
        }
      );
  
    const formData =
      new FormData();
  
    formData.append(
      "file",
      file
    );
  
    formData.append(
      "language",
      language
    );
  
    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke<TranscriptionResponse>(
          "transcribe-audio",
          {
            body:
              formData,
          }
        );
  
    if (error) {
      console.error(
        "[Transcription]",
        error
      );
  
      if (
        error instanceof
        FunctionsHttpError
      ) {
        try {
          const responseBody =
            await error.context.json() as
              TranscriptionResponse;
  
          console.error(
            "[Transcription] Edge Function body:",
            responseBody
          );
  
          throw new Error(
            getServerErrorMessage(
              responseBody
            )
          );
        } catch (
          parseError
        ) {
          if (
            parseError instanceof
              Error &&
            parseError.message !==
              "No fue posible transcribir el audio."
          ) {
            throw parseError;
          }
        }
      }
  
      throw new Error(
        error.message ||
          "No fue posible transcribir el audio."
      );
    }
  
    if (
      !data
    ) {
      throw new Error(
        "La función de transcripción no devolvió información."
      );
    }
  
    if (
      data.error
    ) {
      throw new Error(
        getServerErrorMessage(
          data
        )
      );
    }
  
    if (
      !data.text
        ?.trim()
    ) {
      throw new Error(
        "No se detectó voz en la grabación."
      );
    }
  
    return {
      text:
        data.text.trim(),
  
      model:
        data.model ??
        "unknown",
  
      language:
        data.language ??
        language,
    };
  }
  
  function getAudioExtension(
    mimeType:
      string
  ): string {
    const normalized =
      mimeType
        .toLowerCase();
  
    if (
      normalized.includes(
        "mp4"
      )
    ) {
      return "mp4";
    }
  
    if (
      normalized.includes(
        "ogg"
      )
    ) {
      return "ogg";
    }
  
    if (
      normalized.includes(
        "wav"
      )
    ) {
      return "wav";
    }
  
    return "webm";
  }
  
  function getFallbackMimeType(
    extension:
      string
  ): string {
    switch (
      extension
    ) {
      case "mp4":
        return "audio/mp4";
  
      case "ogg":
        return "audio/ogg";
  
      case "wav":
        return "audio/wav";
  
      case "webm":
      default:
        return "audio/webm";
    }
  }
  
  function getServerErrorMessage(
    response:
      TranscriptionResponse
  ): string {
    switch (
      response.error
    ) {
      case "AUDIO_FILE_REQUIRED":
        return "No se recibió una grabación de audio.";
  
      case "EMPTY_AUDIO_FILE":
        return "La grabación está vacía.";
  
      case "AUDIO_FILE_TOO_LARGE":
        return "La grabación es demasiado grande.";
  
      case "EMPTY_TRANSCRIPTION":
        return "No se detectó voz suficiente para transcribir.";
  
      case "GROQ_API_KEY_NOT_CONFIGURED":
        return "El servicio de transcripción no está configurado.";
  
      case "GROQ_TRANSCRIPTION_FAILED":
        return "El proveedor de transcripción no pudo procesar el audio.";
  
      case "INTERNAL_ERROR":
        return (
          response.message ||
          "Ocurrió un error procesando el audio."
        );
  
      default:
        return "No fue posible transcribir el audio.";
    }
  }