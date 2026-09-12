export interface QuestionResult {
    id: string;
    number: number;
    score: number;
    title: string;
    summary: string;
    strength: string;
    improvement: string;
    suggestedAnswer: string;
  }
  
  export interface MockInterviewResult {
    score: number;
    label: string;
    description: string;
    strengths: string[];
    improvements: string[];
    mainAdvice: string;
    questions: QuestionResult[];
  }
  
  export const mockInterviewResult: MockInterviewResult = {
    score: 6.4,
  
    label: "Buena preparación",
  
    description:
      "Tienes una base sólida para responder una entrevista, pero todavía hay oportunidades claras para mejorar la estructura y el impacto de tus respuestas.",
  
    strengths: [
      "Comunicación directa y fácil de seguir.",
      "Utilizaste ejemplos concretos en varias respuestas.",
      "Mostraste claridad sobre tu experiencia y motivación.",
    ],
  
    improvements: [
      "Faltó explicar con mayor claridad el impacto de algunas acciones.",
      "La estructura temporal de algunas respuestas puede ser más clara.",
      "Algunas respuestas fueron demasiado breves para demostrar profundidad.",
    ],
  
    mainAdvice:
      "Cuando cuentes una experiencia profesional, termina siempre explicando cuál fue el resultado de tus acciones. Intenta incluir una consecuencia concreta, una mejora observable o una métrica cuando sea posible.",
  
    questions: [
      {
        id: "q1",
        number: 1,
        score: 8,
        title: "Trayectoria profesional",
        summary:
          "Presentaste una trayectoria clara y conectaste tu experiencia con el puesto.",
        strength:
          "La respuesta fue directa y fácil de comprender.",
        improvement:
          "Podrías cerrar explicando con mayor precisión qué buscas en tu siguiente oportunidad.",
        suggestedAnswer:
          "Resume tu experiencia, menciona uno o dos logros relevantes y conecta explícitamente tu siguiente paso profesional con el puesto al que estás aplicando.",
      },
      {
        id: "q2",
        number: 2,
        score: 7,
        title: "Resolución de problemas",
        summary:
          "El ejemplo fue relevante, aunque el resultado pudo explicarse mejor.",
        strength:
          "Describiste correctamente el problema y las acciones que realizaste.",
        improvement:
          "Faltó demostrar el impacto concreto de la solución.",
        suggestedAnswer:
          "Después de explicar qué hiciste, agrega una frase específica sobre qué cambió gracias a tu intervención.",
      },
      {
        id: "q3",
        number: 3,
        score: 8,
        title: "Trabajo bajo presión",
        summary:
          "Mostraste capacidad para priorizar y mantener el control de la situación.",
        strength:
          "Explicaste correctamente tu proceso de toma de decisiones.",
        improvement:
          "Podrías explicar mejor cómo involucraste al resto del equipo.",
        suggestedAnswer:
          "Incluye cómo comunicaste prioridades y cómo coordinaste a las personas involucradas.",
      },
      {
        id: "q4",
        number: 4,
        score: 3,
        title: "Área de mejora",
        summary:
          "La respuesta fue demasiado general y no mostró suficiente evidencia de progreso.",
        strength:
          "Identificaste una oportunidad real de desarrollo.",
        improvement:
          "Faltó explicar acciones concretas que estés realizando actualmente.",
        suggestedAnswer:
          "Menciona una debilidad específica, explica cómo la identificaste y describe una acción medible que estés realizando para mejorarla.",
      },
      {
        id: "q5",
        number: 5,
        score: 6,
        title: "¿Por qué tú?",
        summary:
          "La respuesta mencionó fortalezas relevantes, pero pudo conectarse mejor con el puesto.",
        strength:
          "Mencionaste experiencia y motivación.",
        improvement:
          "Necesitas relacionar tus fortalezas directamente con las necesidades del rol.",
        suggestedAnswer:
          "Selecciona dos fortalezas relevantes para el puesto y explica cómo pueden generar valor desde tus primeras semanas.",
      },
    ],
  };