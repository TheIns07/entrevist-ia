import {
  ContactDetector,
} from "./ContactDetector";

import type {
  ContactTextLine,
} from "./ContactDetector";

import type {
  ResumeDetectionResult,
  ResumeSection,
  ResumeSectionKind,
} from "./types";

interface RecognizedHeading {
  lineIndex:
    number;

  heading:
    string;

  kind:
    ResumeSectionKind;

  inlineText:
    string;
}

interface SectionMarker {
  kind:
    ResumeSectionKind;

  heading:
    string;

  inlineText:
    string;
}

const SECTION_ALIASES:
  Record<
    Exclude<
      ResumeSectionKind,
      "header" |
      "unknown"
    >,
    string[]
  > = {
    contact: [
      "contact",
      "contact information",
      "contact details",
      "contacto",
      "datos de contacto",
      "informacion de contacto",
    ],

    summary: [
      "summary",
      "professional summary",
      "profile",
      "professional profile",
      "about me",
      "resumen",
      "resumen profesional",
      "perfil",
      "perfil profesional",
      "sobre mi",
    ],

    experience: [
      "experience",
      "work experience",
      "professional experience",
      "employment history",
      "career history",
      "experiencia",
      "experiencia laboral",
      "experiencia profesional",
      "trayectoria profesional",
    ],

    education: [
      "education",
      "education and qualifications",
      "qualifications",
      "academic background",
      "academic education",
      "educacion",
      "formacion",
      "formacion academica",
      "estudios",
    ],

    skills: [
      "skills",
      "technical skills",
      "core skills",
      "professional skills",
      "competencies",
      "technologies",
      "technology",
      "tech stack",
      "habilidades",
      "habilidades tecnicas",
      "competencias",
      "tecnologias",
    ],

    languages: [
      "languages",
      "language",
      "language skills",
      "idiomas",
      "idioma",
    ],

    certifications: [
      "certifications",
      "certification",
      "certificates",
      "licenses and certifications",
      "certificaciones",
      "certificacion",
      "certificados",
      "licencias y certificaciones",
    ],

    projects: [
      "projects",
      "project",
      "personal projects",
      "professional projects",
      "proyectos",
      "proyecto",
      "proyectos personales",
      "proyectos profesionales",
    ],

    achievements: [
      "achievements",
      "achievement",
      "accomplishments",
      "awards",
      "honors",
      "honours",
      "logros",
      "logro",
      "reconocimientos",
      "premios",
    ],

    interests: [
      "interests",
      "interest",
      "hobbies",
      "activities",
      "intereses",
      "interes",
      "aficiones",
      "actividades",
    ],

    nationality: [
      "nationality",
      "citizenship",
      "nacionalidad",
      "ciudadania",
    ],

    additional: [
      "additional information",
      "additional info",
      "other information",
      "other details",
      "informacion adicional",
      "otros datos",
      "otra informacion",
      "otros",
    ],
  };

export class ResumeSectionDetector {
  private readonly contactDetector =
    new ContactDetector();

  detect(
    text:
      string
  ): ResumeDetectionResult {
    const lines =
      text.split(
        "\n"
      );

    const recognized:
      RecognizedHeading[] = [];

    for (
      let index = 0;
      index <
      lines.length;
      index += 1
    ) {
      const line =
        (
          lines[index] ??
          ""
        ).trim();

      if (
        line.length ===
        0
      ) {
        continue;
      }

      const marker =
        detectSectionMarker(
          line
        );

      if (!marker) {
        continue;
      }

      recognized.push({
        lineIndex:
          index,

        heading:
          marker.heading,

        kind:
          marker.kind,

        inlineText:
          marker.inlineText,
      });
    }

    /*
     * =====================================================
     * SIN HEADINGS RECONOCIDOS
     * =====================================================
     */

    if (
      recognized.length ===
      0
    ) {
      return this.createUnstructuredResult(
        text,
        lines
      );
    }

    const sections:
      ResumeSection[] = [];

    /*
     * =====================================================
     * PREÁMBULO
     * =====================================================
     *
     * Todo lo anterior a la primera
     * sección conocida normalmente es:
     *
     * - nombre
     * - cargo
     * - email
     * - teléfono
     * - LinkedIn
     *
     * Separamos HEADER de CONTACT.
     * =====================================================
     */

    const firstHeading =
      recognized[0];

    if (
      firstHeading &&
      firstHeading.lineIndex >
        0
    ) {
      const preambleLines =
        lines.slice(
          0,
          firstHeading.lineIndex
        );

      const preamble =
        this.contactDetector.splitPreamble(
          preambleLines,
          0
        );

      const headerSection =
        createPreambleSection(
          "header",
          preamble.headerLines
        );

      if (
        headerSection
      ) {
        sections.push(
          headerSection
        );
      }

      const contactSection =
        createPreambleSection(
          "contact",
          preamble.contactLines
        );

      if (
        contactSection
      ) {
        sections.push(
          contactSection
        );
      }
    }

    /*
     * =====================================================
     * SECCIONES
     * =====================================================
     */

    for (
      let index = 0;
      index <
      recognized.length;
      index += 1
    ) {
      const current =
        recognized[
          index
        ];

      if (!current) {
        continue;
      }

      const next =
        recognized[
          index + 1
        ];

      const bodyStart =
        current.lineIndex +
        1;

      const bodyEndExclusive =
        next
          ? next.lineIndex
          : lines.length;

      const followingText =
        extractText(
          lines,
          bodyStart,
          bodyEndExclusive
        );

      const body =
        combineInlineAndFollowingText(
          current.inlineText,
          followingText
        );

      /*
       * Un wrapper como:
       *
       * Additional Information
       *
       * puede quedar inmediatamente
       * seguido por:
       *
       * Interests: ...
       *
       * En ese caso no emitimos una
       * sección vacía.
       */
      if (
        body.length ===
        0
      ) {
        continue;
      }

      sections.push({
        kind:
          current.kind,

        heading:
          current.heading,

        text:
          body,

        startLine:
          current.lineIndex,

        endLine:
          Math.max(
            current.lineIndex,
            bodyEndExclusive -
              1
          ),

        confidence:
          0.98,
      });
    }

    const recognizedKinds =
      new Set(
        sections
          .filter(
            (
              section
            ) =>
              section.kind !==
                "header" &&
              section.kind !==
                "contact" &&
              section.kind !==
                "unknown"
          )
          .map(
            (
              section
            ) =>
              section.kind
          )
      );

    const hasContact =
      sections.some(
        (
          section
        ) =>
          section.kind ===
          "contact"
      );

    const hasEmail =
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
        text
      );

    const hasDates =
      /\b(?:19|20)\d{2}\b/.test(
        text
      ) ||
      /\b[A-Z][a-z]{2}-\d{2}\b/.test(
        text
      );

    const hasBullets =
      /(?:^|\n)\s*[•▪◦‣*-]\s+/m.test(
        text
      );

    let confidence =
      0.3;

    confidence +=
      Math.min(
        0.4,
        recognizedKinds.size *
          0.1
      );

    if (
      hasContact ||
      hasEmail
    ) {
      confidence +=
        0.1;
    }

    if (hasDates) {
      confidence +=
        0.1;
    }

    if (hasBullets) {
      confidence +=
        0.1;
    }

    confidence =
      Math.min(
        1,
        confidence
      );

    const isResume =
      recognizedKinds.size >=
        2 ||
      (
        recognizedKinds.size >=
          1 &&
        (
          hasContact ||
          hasEmail ||
          hasDates ||
          hasBullets
        )
      );

    return {
      isResume,

      confidence,

      sections,

      recognizedSectionCount:
        recognized.length,
    };
  }

  private createUnstructuredResult(
    text:
      string,

    lines:
      string[]
  ): ResumeDetectionResult {
    const clean =
      text.trim();

    if (
      clean.length ===
      0
    ) {
      return {
        isResume:
          false,

        confidence:
          0,

        sections: [],

        recognizedSectionCount:
          0,
      };
    }

    const hasEmail =
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
        clean
      );

    const hasDates =
      /\b(?:19|20)\d{2}\b/.test(
        clean
      );

    const hasBullets =
      /(?:^|\n)\s*[•▪◦‣*-]\s+/m.test(
        clean
      );

    const signalCount =
      [
        hasEmail,
        hasDates,
        hasBullets,
      ].filter(
        Boolean
      ).length;

    const confidence =
      Math.min(
        0.65,
        0.25 +
          signalCount *
            0.12
      );

    return {
      isResume:
        signalCount >=
        2,

      confidence,

      sections: [
        {
          kind:
            "unknown",

          text:
            clean,

          startLine:
            0,

          endLine:
            Math.max(
              0,
              lines.length -
                1
            ),

          confidence:
            0.4,
        },
      ],

      recognizedSectionCount:
        0,
    };
  }
}

function detectSectionMarker(
  line:
    string
):
  | SectionMarker
  | undefined {
  const trimmed =
    line.trim();

  /*
   * =====================================================
   * HEADING NORMAL
   * =====================================================
   *
   * Languages
   * Languages:
   * =====================================================
   */

  const exact =
    findSectionKind(
      normalizeHeading(
        trimmed
      )
    );

  if (
    exact
  ) {
    return {
      kind:
        exact,

      heading:
        removeTrailingColon(
          trimmed
        ),

      inlineText:
        "",
    };
  }

  /*
   * =====================================================
   * HEADING INLINE
   * =====================================================
   *
   * Languages: English, Spanish
   * Interests: Running
   * Skills: Java, Kotlin
   * =====================================================
   */

  const colonIndex =
    trimmed.indexOf(
      ":"
    );

  if (
    colonIndex <=
    0
  ) {
    return undefined;
  }

  const label =
    trimmed
      .slice(
        0,
        colonIndex
      )
      .trim();

  const inlineText =
    trimmed
      .slice(
        colonIndex +
          1
      )
      .trim();

  const kind =
    findSectionKind(
      normalizeHeading(
        label
      )
    );

  if (!kind) {
    return undefined;
  }

  return {
    kind,

    heading:
      label,

    inlineText,
  };
}

function findSectionKind(
  normalized:
    string
):
  | ResumeSectionKind
  | undefined {
  for (
    const [
      kind,
      aliases,
    ] of Object.entries(
      SECTION_ALIASES
    )
  ) {
    if (
      aliases.includes(
        normalized
      )
    ) {
      return kind as
        ResumeSectionKind;
    }
  }

  return undefined;
}

function normalizeHeading(
  value:
    string
): string {
  return value
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /:$/,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLocaleLowerCase();
}

function removeTrailingColon(
  value:
    string
): string {
  return value
    .replace(
      /:\s*$/,
      ""
    )
    .trim();
}

function extractText(
  lines:
    string[],

  start:
    number,

  endExclusive:
    number
): string {
  return lines
    .slice(
      start,
      endExclusive
    )
    .join(
      "\n"
    )
    .replace(
      /^\s+|\s+$/g,
      ""
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    );
}

function combineInlineAndFollowingText(
  inlineText:
    string,

  followingText:
    string
): string {
  return [
    inlineText.trim(),
    followingText.trim(),
  ]
    .filter(
      Boolean
    )
    .join(
      "\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function createPreambleSection(
  kind:
    "header" |
    "contact",

  lines:
    ContactTextLine[]
):
  | ResumeSection
  | undefined {
  if (
    lines.length ===
    0
  ) {
    return undefined;
  }

  const text =
    lines
      .map(
        (
          line
        ) =>
          line.text
      )
      .join(
        "\n"
      )
      .trim();

  if (
    text.length ===
    0
  ) {
    return undefined;
  }

  const indexes =
    lines.map(
      (
        line
      ) =>
        line.lineIndex
    );

  return {
    kind,

    text,

    startLine:
      Math.min(
        ...indexes
      ),

    endLine:
      Math.max(
        ...indexes
      ),

    confidence:
      kind ===
        "contact"
        ? 0.95
        : 0.9,
  };
}