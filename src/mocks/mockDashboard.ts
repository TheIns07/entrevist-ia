export interface DashboardInterview {
    id: string;
    position: string;
    type: string;
    score: number;
    date: string;
  }
  
  export interface ProgressPoint {
    label: string;
    score: number;
  }
  
  export const mockDashboardData = {
    user: {
      name: "Arturo",
    },
  
    stats: {
      interviews: 3,
      averageScore: 7.8,
      minutesPracticed: 45,
    },
  
    progress: [
      {
        label: "Entrevista 1",
        score: 6.4,
      },
      {
        label: "Entrevista 2",
        score: 7.2,
      },
      {
        label: "Entrevista 3",
        score: 7.8,
      },
    ] as ProgressPoint[],
  
    recentInterviews: [
      {
        id: "interview-1",
        position: "Software Engineer",
        type: "Behavioral",
        score: 8.1,
        date: "Hoy",
      },
      {
        id: "interview-2",
        position: "Product Analyst",
        type: "General",
        score: 7.2,
        date: "7 sep",
      },
      {
        id: "interview-3",
        position: "Software Engineer",
        type: "Recursos Humanos",
        score: 6.4,
        date: "4 sep",
      },
    ] as DashboardInterview[],
  };