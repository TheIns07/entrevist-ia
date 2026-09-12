import { Link } from "react-router-dom";
import PageContainer from "./PageContainer";

export default function MarketingHeader() {
  return (
    <header className="bg-white">
      <PageContainer>
        <div
          className="
            flex
            h-14
            items-center
            sm:h-16
          "
        >
          <Link
            to="/"
            className="
              text-sm
              font-bold
              tracking-tight
              text-[#202020]
              sm:text-base
            "
          >
            Entrevist
            <span className="text-[#00A980]">
              IA
            </span>
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}