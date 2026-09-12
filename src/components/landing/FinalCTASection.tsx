import { useNavigate } from "react-router-dom";
import Button from "../Button";
import PageContainer from "../PageContainer";

export default function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="bg-[#1F1F1F] py-16 sm:py-20 lg:py-24">
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="
              text-3xl
              font-bold
              leading-tight
              tracking-[-0.02em]
              text-white
              sm:text-4xl
              lg:text-[44px]
            "
          >
            Tu próxima entrevista puede ser la
            <br className="hidden sm:block" />
            segunda vez que la das.
          </h2>

          <div className="mt-8">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/register")}
              className="
                shadow-[0_10px_30px_rgba(0,169,128,0.25)]
              "
            >
              Comienza ahora
            </Button>
          </div>

          <p
            className="
              mt-4
              text-xs
              text-white/50
            "
          >
            Gratis. Sin tarjeta requerida.
          </p>
        </div>
      </PageContainer>
    </section>
  );
}