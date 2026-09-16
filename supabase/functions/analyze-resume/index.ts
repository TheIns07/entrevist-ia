const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
  "openai/gpt-oss-20b";

const MAX_AI_TEXT_LENGTH =
  50000;

interface AnalyzeResumeRequest {
  aiText:
    string;
}

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?:
        string;
    };
  }>;

  usage?: {
    prompt_tokens?:
      number;

    completion_tokens?:
      number;

    total_tokens?:
      number;
  };
}

const resumeAnalysisSchema = {
  type:
    "object",

  properties: {
    candidateName: {
      type: [
        "string",
        "null",
      ],
    },

    currentRole: {
      type: [
        "string",
        "null",
      ],
    },

    seniority: {
      type:
        "string",

      enum: [
        "intern",
        "junior",
        "mid",
        "senior",
        "lead",
        "manager",
        "executive",
        "unknown",
      ],
    },

    skills: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },

    experienceHighlights: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },

    education: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },

    languages: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },

    interviewFocus: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },

    uncertainties: {
      type:
        "array",

      items: {
        type:
          "string",
      },
    },
  },

  required: [
    "candidateName",
    "currentRole",
    "seniority",
    "skills",
    "experienceHighlights",
    "education",
    "languages",
    "interviewFocus",
    "uncertainties",
  ],

  additionalProperties:
    false,
};

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

      const body =
        await request.json() as
          AnalyzeResumeRequest;

      const aiText =
        body.aiText?.trim();

      if (
        !aiText
      ) {
        return jsonResponse(
          {
            error:
              "AI_TEXT_REQUIRED",
          },
          400,
          headers
        );
      }

      if (
        aiText.length >
        MAX_AI_TEXT_LENGTH
      ) {
        return jsonResponse(
          {
            error:
              "AI_TEXT_TOO_LARGE",

            maxCharacters:
              MAX_AI_TEXT_LENGTH,
          },
          413,
          headers
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

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                model:
                  GROQ_MODEL,

                messages: [
                  {
                    role:
                      "system",

                    content: [
                      "You analyze resumes for an AI job interview preparation application.",
                      "Use only information explicitly supported by the resume.",
                      "Never invent employers, technologies, degrees, dates, roles, skills, or achievements.",
                      "If information is missing or uncertain, preserve that uncertainty.",
                      "interviewFocus must contain useful topics that an interviewer could explore based specifically on this resume.",
                    ].join(
                      " "
                    ),
                  },

                  {
                    role:
                      "user",

                    content: [
                      "Analyze the following normalized resume.",
                      "",
                      aiText,
                    ].join(
                      "\n"
                    ),
                  },
                ],

                response_format: {
                  type:
                    "json_schema",

                  json_schema: {
                    name:
                      "resume_analysis",

                    strict:
                      true,

                    schema:
                      resumeAnalysisSchema,
                  },
                },
              }),
          }
        );

      const groqData =
        await groqResponse.json() as
          GroqChatResponse;

      if (
        !groqResponse.ok
      ) {
        console.error(
          "[Groq]",
          groqData
        );

        return jsonResponse(
          {
            error:
              "GROQ_REQUEST_FAILED",

            status:
              groqResponse.status,
          },
          502,
          headers
        );
      }

      const content =
        groqData
          .choices?.[0]
          ?.message
          ?.content;

      if (
        !content
      ) {
        return jsonResponse(
          {
            error:
              "GROQ_EMPTY_RESPONSE",
          },
          502,
          headers
        );
      }

      let analysis:
        unknown;

      try {
        analysis =
          JSON.parse(
            content
          );
      } catch {
        return jsonResponse(
          {
            error:
              "GROQ_INVALID_JSON",
          },
          502,
          headers
        );
      }

      return jsonResponse(
        {
          model:
            GROQ_MODEL,

          analysis,

          usage: {
            promptTokens:
              groqData
                .usage
                ?.prompt_tokens ??
              null,

            completionTokens:
              groqData
                .usage
                ?.completion_tokens ??
              null,

            totalTokens:
              groqData
                .usage
                ?.total_tokens ??
              null,
          },
        },
        200,
        headers
      );
    } catch (
      error
    ) {
      console.error(
        "[analyze-resume]",
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