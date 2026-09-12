import { Check } from "lucide-react";

interface ChoiceCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
}

export default function ChoiceCard({
  title,
  description,
  selected = false,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        w-full
        rounded-2xl
        border
        p-5
        text-left
        transition-all
        duration-200
        focus:outline-none
        focus:ring-2
        focus:ring-[#5547E8]/20
        ${
          selected
            ? `
              border-[#5547E8]
              bg-[#F7F5FF]
              shadow-[0_4px_18px_rgba(85,71,232,0.08)]
            `
            : `
              border-[#E7E7E7]
              bg-white
              hover:border-[#C9C4FA]
              hover:shadow-[0_4px_18px_rgba(0,0,0,0.04)]
            `
        }
      `}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p
            className={`
              text-sm
              font-semibold
              transition-colors
              ${
                selected
                  ? "text-[#5547E8]"
                  : "text-[#252525]"
              }
            `}
          >
            {title}
          </p>

          {description && (
            <p
              className="
                mt-1.5
                max-w-md
                text-sm
                leading-6
                text-[#888888]
              "
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={`
            flex
            h-6
            w-6
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            transition-all
            ${
              selected
                ? `
                  border-[#5547E8]
                  bg-[#5547E8]
                  text-white
                `
                : `
                  border-[#D8D8D8]
                  bg-white
                  text-transparent
                `
            }
          `}
        >
          <Check size={14} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}