import { Link, useNavigate } from "react-router-dom";
import PageContainer from "./PageContainer";

interface AppHeaderProps {
  backTo?: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function AppHeader({
  backTo,
  backLabel = "Volver",
  onBack,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  };

  return (
    <header className="bg-white">
      <PageContainer>
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link
            to="/"
            className="text-sm font-bold tracking-tight text-[#252525] sm:text-base"
          >
            Entrevist
            <span className="text-[#5547E8]">IA</span>
          </Link>

          <button
            type="button"
            onClick={handleBack}
            className="
              text-sm
              font-medium
              text-[#777777]
              transition-colors
              hover:text-[#252525]
            "
          >
            {backLabel}
          </button>
        </div>
      </PageContainer>
    </header>
  );
}