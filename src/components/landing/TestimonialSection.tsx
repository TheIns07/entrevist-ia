import PageContainer from "../PageContainer";

export default function TestimonialSection() {
  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24">
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <blockquote
            className="
              text-2xl
              font-semibold
              leading-tight
              tracking-[-0.02em]
              text-[#252525]
              sm:text-3xl
              lg:text-[34px]
            "
          >
            “Practiqué 3 veces y pasé la entrevista.”
          </blockquote>

          <div
            className="
              mt-8
              flex
              items-center
              justify-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#E9EEF2]
                text-xs
                font-semibold
                text-[#6B7280]
              "
            >
              DR
            </div>

            <div className="text-left">
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#252525]
                "
              >
                Daniela R.
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  leading-5
                  text-[#777777]
                "
              >
                Analista de datos · contratada en 2 semanas
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}