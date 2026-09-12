import { Link } from "react-router-dom";
import PageContainer from "../PageContainer";

export default function MarketingFooter() {
  return (
    <footer className="bg-white py-7">
      <PageContainer>
        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p className="text-xs text-[#777777]">
            © 2026 Entrevista IA. Todos los derechos reservados.
          </p>

          <nav
            className="
              flex
              flex-wrap
              items-center
              gap-x-6
              gap-y-3
            "
            aria-label="Enlaces legales"
          >
            <Link
              to="/terms"
              className="
                text-xs
                text-[#777777]
                transition-colors
                hover:text-[#252525]
              "
            >
              Términos
            </Link>

            <Link
              to="/privacy"
              className="
                text-xs
                text-[#777777]
                transition-colors
                hover:text-[#252525]
              "
            >
              Privacidad
            </Link>

            <a
              href="mailto:contacto@entrevistia.com"
              className="
                text-xs
                text-[#777777]
                transition-colors
                hover:text-[#252525]
              "
            >
              Contacto
            </a>
          </nav>
        </div>
      </PageContainer>
    </footer>
  );
}