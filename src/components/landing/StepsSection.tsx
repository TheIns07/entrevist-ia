import PageContainer from "../PageContainer";

const steps = [
  {
    number: 1,
    title: "Regístrate",
    duration: "10 segundos",
    description: "Solo tu correo. Nada más.",
  },
  {
    number: 2,
    title: "Completa tu información",
    duration: "2 minutos",
    description:
      "Puesto, industria y experiencia para calibrar la entrevista.",
  },
  {
    number: 3,
    title: "Practica la entrevista",
    duration: "15 minutos",
    description:
      "Respondes en voz alta a un entrevistador con IA.",
  },
  {
    number: 4,
    title: "Obtén feedback",
    duration: "automático",
    description:
      "Informe con fortalezas, brechas y respuestas modelo.",
  },
  {
    number: 5,
    title: "Consigue el trabajo",
    duration: "tu turno",
    description:
      "Llegas a la entrevista real habiéndola vivido ya.",
  },
];

export default function StepsSection() {
  return (
    <section className="bg-[#EEF3F7] py-16 sm:py-20 lg:py-24">
      <PageContainer>
        <div className="max-w-4xl">
          <h2
            className="
              text-3xl
              font-bold
              tracking-[-0.02em]
              text-[#252525]
              sm:text-4xl
            "
          >
            De registrarte a tu oferta, en cinco pasos
          </h2>
        </div>

        <div className="mt-10 max-w-4xl sm:mt-12">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.number}
                className="relative flex gap-5 pb-10 sm:gap-6 sm:pb-12"
              >
                <div
                  className="
                    relative
                    flex
                    w-8
                    shrink-0
                    justify-center
                  "
                >
                  <div
                    className="
                      z-10
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-[#00A980]
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    {step.number}
                  </div>

                  {!isLast && (
                    <div
                      className="
                        absolute
                        top-8
                        h-[calc(100%+8px)]
                        w-px
                        bg-[#CAD4DA]
                      "
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div
                    className="
                      flex
                      flex-col
                      gap-1
                      sm:flex-row
                      sm:items-baseline
                      sm:gap-3
                    "
                  >
                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-[#252525]
                        sm:text-base
                      "
                    >
                      {step.title}
                    </h3>

                    <span
                      className="
                        text-xs
                        font-medium
                        text-[#00A980]
                      "
                    >
                      {step.duration}
                    </span>
                  </div>

                  <p
                    className="
                      mt-2
                      max-w-xl
                      text-sm
                      leading-6
                      text-[#777777]
                    "
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}