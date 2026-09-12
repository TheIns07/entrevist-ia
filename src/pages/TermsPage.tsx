import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-10 sm:py-12 lg:py-16">
      <PageContainer>
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="
              inline-flex
              text-sm
              font-medium
              text-[#00A980]
              transition-colors
              hover:text-[#008F6D]
            "
          >
            Volver
          </Link>

          <header className="mt-8 border-b border-gray-200 pb-8">
            <h1
              className="
                text-3xl
                font-bold
                tracking-[-0.02em]
                text-[#252525]
                sm:text-4xl
              "
            >
              Términos y Condiciones
            </h1>

            <p className="mt-3 text-sm text-[#777777]">
              Última actualización: septiembre de 2026
            </p>
          </header>

          <div
            className="
              mt-10
              space-y-10
              text-sm
              leading-7
              text-[#555555]
              sm:text-base
            "
          >
            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                1. Objeto
              </h2>

              <p className="mt-3">
                Estos Términos y Condiciones regulan el acceso y uso de
                EntrevistIA, una plataforma digital diseñada para apoyar la
                práctica y preparación de entrevistas mediante herramientas de
                inteligencia artificial.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                2. Uso de la plataforma
              </h2>

              <p className="mt-3">
                El usuario se compromete a utilizar la plataforma de forma
                lícita, responsable y únicamente para fines relacionados con
                práctica, preparación y desarrollo de habilidades para
                entrevistas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                3. Registro y cuenta
              </h2>

              <p className="mt-3">
                Algunas funcionalidades pueden requerir la creación de una
                cuenta. El usuario es responsable de proporcionar información
                correcta y de mantener la seguridad de sus credenciales de
                acceso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                4. Uso de inteligencia artificial
              </h2>

              <p className="mt-3">
                EntrevistIA utiliza sistemas de inteligencia artificial para
                generar preguntas, simulaciones, evaluaciones y recomendaciones
                relacionadas con entrevistas.
              </p>

              <p className="mt-3">
                Las respuestas generadas por la plataforma tienen fines de
                orientación y práctica. No constituyen una garantía de
                contratación, aprobación de entrevistas ni obtención de empleo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                5. Evaluaciones y resultados
              </h2>

              <p className="mt-3">
                Los puntajes, recomendaciones y evaluaciones generados durante
                las simulaciones son estimaciones automatizadas diseñadas para
                ayudar al usuario a identificar oportunidades de mejora.
              </p>

              <p className="mt-3">
                Estos resultados no deben interpretarse como evaluaciones
                profesionales definitivas ni como decisiones reales de
                contratación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                6. Disponibilidad del servicio
              </h2>

              <p className="mt-3">
                Buscamos mantener la plataforma disponible de manera continua,
                pero pueden existir interrupciones temporales por mantenimiento,
                actualizaciones, fallas técnicas o servicios de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                7. Conductas no permitidas
              </h2>

              <p className="mt-3">
                El usuario no deberá utilizar la plataforma para realizar
                actividades ilícitas, intentar vulnerar su seguridad, acceder a
                información de otros usuarios, automatizar abusivamente el
                servicio o interferir con su funcionamiento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                8. Propiedad intelectual
              </h2>

              <p className="mt-3">
                El diseño, software, contenido, identidad visual y demás
                elementos propios de EntrevistIA están protegidos por la
                legislación aplicable en materia de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                9. Servicios de terceros
              </h2>

              <p className="mt-3">
                Algunas funciones de la plataforma pueden depender de servicios
                externos relacionados con infraestructura, autenticación,
                inteligencia artificial, analítica u otras tecnologías.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                10. Privacidad
              </h2>

              <p className="mt-3">
                El tratamiento de información personal se regirá por el Aviso
                de Privacidad correspondiente.
              </p>

              <Link
                to="/privacy"
                className="
                  mt-3
                  inline-flex
                  font-medium
                  text-[#00A980]
                  hover:underline
                "
              >
                Consultar Aviso de Privacidad
              </Link>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                11. Modificaciones
              </h2>

              <p className="mt-3">
                Estos términos podrán actualizarse cuando existan cambios en la
                plataforma, nuevas funcionalidades o modificaciones legales
                aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                12. Contacto
              </h2>

              <p className="mt-3">
                Para dudas relacionadas con estos términos, puedes contactar al
                equipo responsable de EntrevistIA.
              </p>

              <a
                href="mailto:contacto@entrevistia.com"
                className="
                  mt-3
                  inline-flex
                  font-medium
                  text-[#00A980]
                  hover:underline
                "
              >
                contacto@entrevistia.com
              </a>
            </section>
          </div>

          <div className="mt-14 border-t border-gray-200 pt-8">
            <Link
              to="/"
              className="
                text-sm
                font-medium
                text-[#00A980]
                hover:underline
              "
            >
              Volver a EntrevistIA
            </Link>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}