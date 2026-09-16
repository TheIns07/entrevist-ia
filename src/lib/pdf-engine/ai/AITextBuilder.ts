import type {
  DocumentQuality,
} from "../quality/types";

import type {
  ResumeDetectionResult,
  ResumeSection,
  ResumeSectionKind,
} from "../structure/types";

export interface AITextBuilderInput {
  cleanText:
    string;

  resume:
    ResumeDetectionResult;

  quality:
    DocumentQuality;
}

export class AITextBuilder {
  build(
    input:
      AITextBuilderInput
  ): string {
    if (
      !input.resume.isResume ||
      input.resume.sections.length ===
        0
    ) {
      return buildGenericDocument(
        input.cleanText
      );
    }

    const parts:
      string[] = [
        "[RESUME]",
      ];

    for (
      const section of
        input.resume.sections
    ) {
      const rendered =
        renderSection(
          section
        );

      if (
        rendered.length ===
        0
      ) {
        continue;
      }

      parts.push(
        rendered
      );
    }

    if (
      input.quality.score <
      0.55
    ) {
      parts.push(
        [
          "[EXTRACTION_WARNING]",
          "The source PDF had low extraction confidence. Treat ambiguous text cautiously.",
        ].join(
          "\n"
        )
      );
    }

    return parts
      .join(
        "\n\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim()
      .normalize(
        "NFC"
      );
  }
}

function renderSection(
  section:
    ResumeSection
): string {
  const text =
    section.text.trim();

  if (
    text.length ===
    0
  ) {
    return "";
  }

  const label =
    getSectionLabel(
      section.kind
    );

  return [
    `[${label}]`,
    text,
  ].join(
    "\n"
  );
}

function getSectionLabel(
  kind:
    ResumeSectionKind
): string {
  switch (kind) {
    case "header":
      return "HEADER";

    case "contact":
      return "CONTACT";

    case "summary":
      return "SUMMARY";

    case "experience":
      return "EXPERIENCE";

    case "education":
      return "EDUCATION";

    case "skills":
      return "SKILLS";

    case "languages":
      return "LANGUAGES";

    case "certifications":
      return "CERTIFICATIONS";

    case "projects":
      return "PROJECTS";

    case "achievements":
      return "ACHIEVEMENTS";

    case "interests":
      return "INTERESTS";

    case "nationality":
      return "NATIONALITY";

    case "additional":
      return "ADDITIONAL_INFORMATION";

    case "unknown":
      return "OTHER";

    default:
      return "OTHER";
  }
}

function buildGenericDocument(
  text:
    string
): string {
  return [
    "[DOCUMENT]",
    text.trim(),
  ]
    .filter(
      Boolean
    )
    .join(
      "\n"
    )
    .trim()
    .normalize(
      "NFC"
    );
}