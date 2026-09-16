const GROQ_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";

const GROQ_MODEL =
  "whisper-large-v3-turbo";

const MAX_AUDIO_SIZE_BYTES =
  20 *
  1024 *
  1024;

type TranscriptionLanguage =
  | "auto"
  | "es"
  | "en";

interface GroqTranscriptionResponse {
  text?:
    string;
}

Deno.serve(
  async (
    request:
      Request
  ) => {
    const headers =
      corsHeaders();

    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers,
        }
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          error:
            "METHOD_NOT_ALLOWED",
        },
        405,
        headers
      );
    }

    try {
      const groqApiKey =
        Deno.env.get(
          "GROQ_API_KEY"
        );

      if (
        !groqApiKey
      ) {
        return jsonResponse(
          {
            error:
              "GROQ_API_KEY_NOT_CONFIGURED",
          },
          500,
          headers
        );
      }

      const formData =
        await request.formData();

      const audio =
        formData.get(
          "file"
        );

      const languageValue =
        formData.get(
          "language"
        );

      if (
        !(audio instanceof File)
      ) {
        return jsonResponse(
          {
            error:
              "AUDIO_FILE_REQUIRED",
          },
          400,
          headers
        );
      }

      if (
        audio.size ===
        0
      ) {
        return jsonResponse(
          {
            error:
              "EMPTY_AUDIO_FILE",
          },
          400,
          headers
        );
      }

      if (
        audio.size >
        MAX_AUDIO_SIZE_BYTES
      ) {
        return jsonResponse(
          {
            error:
              "AUDIO_FILE_TOO_LARGE",

            maxBytes:
              MAX_AUDIO_SIZE_BYTES,
          },
          413,
          headers
        );
      }

      const language =
        normalizeLanguage(
          languageValue
        );

      const groqForm =
        new FormData();

      groqForm.append(
        "file",
        audio,
        audio.name ||
          "recording.webm"
      );

      groqForm.append(
        "model",
        GROQ_MODEL
      );

      groqForm.append(
        "response_format",
        "json"
      );

      groqForm.append(
        "temperature",
        "0"
      );

      /*
       * Si es "auto", dejamos que
       * Whisper detecte el idioma.
       */
      if (
        language !==
        "auto"
      ) {
        groqForm.append(
          "language",
          language
        );
      }

      const groqResponse =
        await fetch(
          GROQ_URL,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${groqApiKey}`,
            },

            body:
              groqForm,
          }
        );

      const groqData =
        await groqResponse.json() as
          GroqTranscriptionResponse;

      if (
        !groqResponse.ok
      ) {
        console.error(
          "[Groq Transcription]",
          {
            status:
              groqResponse.status,

            body:
              groqData,
          }
        );

        return jsonResponse(
          {
            error:
              "GROQ_TRANSCRIPTION_FAILED",

            status:
              groqResponse.status,
          },
          502,
          headers
        );
      }

      const text =
        groqData.text
          ?.trim() ??
        "";

      if (
        text.length ===
        0
      ) {
        return jsonResponse(
          {
            error:
              "EMPTY_TRANSCRIPTION",
          },
          422,
          headers
        );
      }

      return jsonResponse(
        {
          text,

          model:
            GROQ_MODEL,

          language,
        },
        200,
        headers
      );
    } catch (
      error
    ) {
      console.error(
        "[transcribe-audio]",
        error
      );

      return jsonResponse(
        {
          error:
            "INTERNAL_ERROR",

          message:
            error instanceof
              Error
              ? error.message
              : "Unknown error",
        },
        500,
        headers
      );
    }
  }
);

function normalizeLanguage(
  value:
    FormDataEntryValue |
    null
): TranscriptionLanguage {
  if (
    value ===
      "es" ||
    value ===
      "en"
  ) {
    return value;
  }

  return "auto";
}

function jsonResponse(
  body:
    unknown,

  status:
    number,

  headers:
    Record<
      string,
      string
    >
): Response {
  return new Response(
    JSON.stringify(
      body
    ),

    {
      status,

      headers: {
        ...headers,

        "Content-Type":
          "application/json",
      },
    }
  );
}

function corsHeaders():
  Record<
    string,
    string
  > {
  return {
    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
  };
}