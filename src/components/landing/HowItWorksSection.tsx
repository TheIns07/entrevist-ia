import { Check } from "lucide-react";
import PageContainer from "../PageContainer";

const features = [
  {
    title: "IA que te entrevista como un jefe real",
    description:
      "Preguntas de seguimiento, repreguntas incómodas y el tono del rol al que aplicas.",
  },
  {
    title: "Feedback estructurado en 15 min",
    description:
      "Claridad, estructura y evidencia, evaluadas respuesta por respuesta.",
  },
  {
    title: "Identifica tus debilidades",
    description:
      "Verás exactamente dónde pierdes al entrevistador y por qué.",
  },
  {
    title: "Mejora antes de la entrevista real",
    description:
      "Repite la simulación y compara tu progreso sesión tras sesión.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24">
      <PageContainer>
        <div className="max-w-2xl">
          <h2
            className="
              text-3xl
              font-bold
              tracking-[-0.02em]
              text-[#252525]
              sm:text-4xl
            "
          >
            Cómo funciona
          </h2>

          <p
            className="
              mt-4
              max-w-xl
              text-sm
              leading-6
              text-[#777777]
              sm:text-base
            "
          >
            Una simulación completa y un informe accionable, en menos de lo
            que dura un café.
          </p>
        </div>

        <div
          className="
            mt-12
            grid
            gap-x-16
            gap-y-10
            md:grid-cols-2
            lg:mt-14
          "
        >
          {features.map((feature) => (
            <article
              key={feature.title}
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  mt-0.5
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#E6F7F2]
                "
              >
                <Check
                  size={16}
                  strokeWidth={2.5}
                  className="text-[#00A980]"
                />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-semibold
                    leading-6
                    text-[#252525]
                    sm:text-base
                  "
                >
                  {feature.title}
                </h3>

                <p
                  className="
                    mt-1
                    max-w-lg
                    text-sm
                    leading-6
                    text-[#777777]
                  "
                >
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}