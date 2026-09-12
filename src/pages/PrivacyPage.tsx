import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

export default function PrivacyPage() {
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
              Aviso de Privacidad
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
                1. Responsable del tratamiento
              </h2>

              <p className="mt-3">
                EntrevistIA es una plataforma digital orientada a la práctica y
                preparación de entrevistas mediante herramientas de inteligencia
                artificial.
              </p>

              <p className="mt-3">
                La información definitiva sobre la persona física o moral
                responsable del tratamiento de los datos personales será
                incorporada antes de la publicación comercial de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                2. Datos que podemos recopilar
              </h2>

              <p className="mt-3">
                Dependiendo de las funcionalidades utilizadas, la plataforma
                podrá recopilar información proporcionada directamente por el
                usuario.
              </p>

              <div className="mt-4 space-y-2">
                <p>Nombre.</p>
                <p>Correo electrónico.</p>
                <p>Puesto profesional de interés.</p>
                <p>Industria.</p>
                <p>Nivel de experiencia.</p>
                <p>Preferencias relacionadas con la entrevista.</p>
                <p>Respuestas proporcionadas durante las simulaciones.</p>
                <p>Transcripciones generadas durante la práctica.</p>
                <p>Resultados y evaluaciones de las entrevistas.</p>
                <p>
                  Información técnica necesaria para el funcionamiento y
                  seguridad de la plataforma.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                3. Uso del micrófono y procesamiento de voz
              </h2>

              <p className="mt-3">
                Algunas simulaciones pueden utilizar el micrófono del dispositivo
                para permitir conversaciones de voz con el entrevistador
                generado mediante inteligencia artificial.
              </p>

              <p className="mt-3">
                El acceso al micrófono requerirá autorización previa del usuario
                mediante los permisos proporcionados por su navegador o
                dispositivo.
              </p>

              <p className="mt-3">
                La versión inicial de la plataforma está diseñada para evitar el
                almacenamiento permanente de las grabaciones de audio siempre
                que no sea necesario para proporcionar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                4. Finalidades del tratamiento
              </h2>

              <p className="mt-3">
                La información recopilada podrá utilizarse para las siguientes
                finalidades:
              </p>

              <div className="mt-4 space-y-2">
                <p>Crear y administrar la cuenta del usuario.</p>
                <p>Personalizar las simulaciones de entrevista.</p>
                <p>Generar preguntas mediante inteligencia artificial.</p>
                <p>Generar evaluaciones y recomendaciones.</p>
                <p>Mostrar el historial de prácticas.</p>
                <p>Medir el progreso del usuario.</p>
                <p>Mejorar el funcionamiento de la plataforma.</p>
                <p>Detectar errores técnicos y prevenir abusos.</p>
                <p>Brindar soporte.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                5. Inteligencia artificial
              </h2>

              <p className="mt-3">
                Para ofrecer determinadas funcionalidades, información
                relacionada con las entrevistas podrá ser procesada mediante
                proveedores de servicios de inteligencia artificial.
              </p>

              <p className="mt-3">
                Estos sistemas podrán utilizar las respuestas del usuario y el
                contexto proporcionado para generar preguntas, retroalimentación,
                evaluaciones y recomendaciones.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                6. Proveedores tecnológicos
              </h2>

              <p className="mt-3">
                EntrevistIA podrá utilizar proveedores externos para funciones
                como alojamiento, base de datos, autenticación, inteligencia
                artificial, correo electrónico, monitoreo y analítica.
              </p>

              <p className="mt-3">
                Estos proveedores únicamente deberán recibir la información
                necesaria para prestar sus respectivos servicios conforme a las
                condiciones aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                7. Conservación de la información
              </h2>

              <p className="mt-3">
                Los datos serán conservados durante el tiempo necesario para
                cumplir con las finalidades descritas en este aviso y conforme a
                las obligaciones legales que resulten aplicables.
              </p>

              <p className="mt-3">
                Las políticas específicas de retención podrán variar según el
                tipo de información y la evolución de las funcionalidades de la
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                8. Seguridad
              </h2>

              <p className="mt-3">
                Se implementarán medidas técnicas y organizativas destinadas a
                reducir riesgos de acceso no autorizado, pérdida, alteración o
                uso indebido de la información.
              </p>

              <p className="mt-3">
                Entre estas medidas podrán incluirse conexiones cifradas,
                controles de acceso, autenticación, restricciones a nivel de
                base de datos y monitoreo técnico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                9. Derechos del usuario
              </h2>

              <p className="mt-3">
                Conforme a la legislación aplicable, el usuario podrá solicitar
                acceso, rectificación, cancelación u oposición respecto de sus
                datos personales cuando corresponda.
              </p>

              <p className="mt-3">
                También podrá solicitar la eliminación de su cuenta y de la
                información asociada, sujeto a las obligaciones legales de
                conservación aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                10. Cookies y analítica
              </h2>

              <p className="mt-3">
                La plataforma podrá utilizar tecnologías necesarias para
                mantener sesiones, recordar preferencias, medir el funcionamiento
                de la aplicación y comprender cómo se utiliza el servicio.
              </p>

              <p className="mt-3">
                Cuando corresponda, el uso de tecnologías adicionales de
                seguimiento será informado al usuario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                11. Menores de edad
              </h2>

              <p className="mt-3">
                Las condiciones específicas relacionadas con el uso de la
                plataforma por menores de edad deberán definirse antes de
                habilitar el servicio para este tipo de usuarios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                12. Cambios al aviso
              </h2>

              <p className="mt-3">
                Este Aviso de Privacidad podrá modificarse conforme evolucionen
                las funcionalidades de EntrevistIA, cambien los proveedores
                utilizados o existan nuevas obligaciones legales.
              </p>

              <p className="mt-3">
                La fecha de última actualización será indicada al inicio de esta
                página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                13. Contacto
              </h2>

              <p className="mt-3">
                Para consultas relacionadas con privacidad y tratamiento de
                información puedes contactar al equipo responsable.
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

            <section>
              <h2 className="text-xl font-semibold text-[#252525]">
                Términos y Condiciones
              </h2>

              <p className="mt-3">
                El uso de la plataforma también está sujeto a nuestros Términos y
                Condiciones.
              </p>

              <Link
                to="/terms"
                className="
                  mt-3
                  inline-flex
                  font-medium
                  text-[#00A980]
                  hover:underline
                "
              >
                Consultar Términos y Condiciones
              </Link>
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