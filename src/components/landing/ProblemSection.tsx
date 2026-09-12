import PageContainer from "../PageContainer";

const problems = [
  {
    title: "No sabes cómo responder",
    description:
      "Te bloqueas con preguntas de comportamiento y respondes lo primero que se te ocurre.",
  },
  {
    title: "Quieres ir preparado",
    description:
      "Leer consejos no es lo mismo que haber respondido esas preguntas en voz alta.",
  },
  {
    title: "No sabes si estás listo",
    description:
      "Nadie te dice qué mejorar hasta que ya recibiste el rechazo.",
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-[#EEF3F7] py-16 sm:py-20 lg:py-24">
      <PageContainer>
        <div
          className="
            grid
            gap-10
            lg:grid-cols-[0.9fr_1.1fr]
            lg:gap-20
          "
        >

          <div>
            <h2
              className="
                text-3xl
                font-bold
                tracking-[-0.02em]
                text-[#252525]
                sm:text-4xl
              "
            >
              ¿Ansiedad en entrevistas?
            </h2>
          </div>

          <div>
            {problems.map((problem, index) => (
              <article
                key={problem.title}
                className={`
                  py-5
                  first:pt-0
                  ${
                    index !== problems.length - 1
                      ? "border-b border-[#D9E0E5]"
                      : ""
                  }
                `}
              >
                <h3 className="text-base font-semibold text-[#252525]">
                  {problem.title}
                </h3>

                <p
                  className="
                    mt-1
                    max-w-xl
                    text-sm
                    leading-6
                    text-[#777777]
                  "
                >
                  {problem.description}
                </p>
              </article>
            ))}
          </div>

        </div>
      </PageContainer>
    </section>
  );
}