export interface MockInterviewQuestion {
    id: string;
    question: string;
    estimatedDuration: string;
    placeholder: string;
    maxLength: number;
  }
  
  export const mockInterviewQuestions: MockInterviewQuestion[] = [
    {
      id: "q1",
      question:
        "Para empezar, cuéntame sobre tu trayectoria y qué te llevó a buscar este puesto.",
      estimatedDuration: "2-3 minutos",
      placeholder:
        "Cuéntame sobre tu experiencia, formación y qué estás buscando actualmente...",
      maxLength: 500,
    },
    {
      id: "q2",
      question:
        "Cuéntame sobre una situación en la que tuviste que resolver un problema complejo.",
      estimatedDuration: "2-3 minutos",
      placeholder:
        "Describe la situación, qué hiciste y cuál fue el resultado...",
      maxLength: 500,
    },
    {
      id: "q3",
      question:
        "Háblame de una ocasión en la que tuviste que trabajar bajo presión o con poco tiempo.",
      estimatedDuration: "2-3 minutos",
      placeholder:
        "Explica el contexto, cómo priorizaste y qué resultado obtuviste...",
      maxLength: 500,
    },
    {
      id: "q4",
      question:
        "¿Cuál consideras que es una de tus principales áreas de mejora profesional y qué estás haciendo al respecto?",
      estimatedDuration: "2 minutos",
      placeholder:
        "Sé concreto sobre el área y explica qué acciones estás tomando...",
      maxLength: 500,
    },
    {
      id: "q5",
      question:
        "¿Por qué deberíamos considerarte para este puesto?",
      estimatedDuration: "2-3 minutos",
      placeholder:
        "Conecta tu experiencia, fortalezas y motivación con el puesto...",
      maxLength: 500,
    },
  ];