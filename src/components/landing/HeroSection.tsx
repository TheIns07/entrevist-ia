import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import HeroInterviewDemo from "../marketing/HeroInterviewDemo";

export default function HeroSection() {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-[#F7F8FA]
      "
    >
      {/* Background glows */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
      >
        <div
          className="
            absolute
            left-[-120px]
            top-[80px]
            h-[280px]
            w-[280px]
            rounded-full
            bg-[#00A980]/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            right-[-100px]
            top-[100px]
            h-[340px]
            w-[340px]
            rounded-full
            bg-[#5547E8]/10
            blur-3xl
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          min-h-[88vh]
          w-full
          max-w-[1240px]
          grid-cols-1
          gap-14
          px-5
          pb-16
          pt-12

          sm:px-8
          sm:pt-16

          lg:grid-cols-2
          lg:items-center
          lg:gap-20
          lg:px-10
          lg:pb-20
          lg:pt-16
        "
      >
        {/* LEFT */}
        <div className="max-w-[620px]">
          <motion.h1
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
            }}
            className="
              text-[46px]
              font-bold
              leading-[0.98]
              tracking-[-0.055em]
              text-[#1F1F1F]

              sm:text-[58px]

              lg:text-[72px]
            "
          >
            Tu próxima entrevista
            <br />

            <span className="text-[#00A980]">
              no debería ser
            </span>

            <br />

            la primera vez que la das.
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
              delay: 0.08,
            }}
            className="
              mt-7
              max-w-[560px]
              text-[17px]
              leading-8
              text-[#68707D]

              sm:text-[18px]
            "
          >
            Simula entrevistas reales, responde preguntas
            como las que te haría un reclutador y recibe
            feedback claro, accionable y estructurado en
            minutos.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
              delay: 0.15,
            }}
            className="
              mt-9
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
            "
          >
            <Link
              to="/register"
              className="
                inline-flex
                h-14
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#00A980]
                px-7
                text-base
                font-semibold
                text-white
                shadow-[0_14px_30px_rgba(0,169,128,0.22)]
                transition-all
                duration-200

                hover:-translate-y-0.5
                hover:bg-[#019873]
                hover:shadow-[0_18px_38px_rgba(0,169,128,0.27)]
              "
            >
              Comienza ahora

              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="
                inline-flex
                h-14
                items-center
                justify-center
                rounded-2xl
                border
                border-[#D7DCE3]
                bg-white
                px-7
                text-base
                font-semibold
                text-[#2F3640]
                transition-all
                duration-200

                hover:-translate-y-0.5
                hover:border-[#BFC6D2]
                hover:bg-[#FCFCFD]
              "
            >
              Ver demo
            </Link>
          </motion.div>
        </div>

        {/* RIGHT — ANIMATED DEMO */}
        <div
          className="
            relative
            flex
            items-center
            justify-center

            lg:min-h-[600px]
          "
        >
          <HeroInterviewDemo />
        </div>
      </div>
    </section>
  );
}