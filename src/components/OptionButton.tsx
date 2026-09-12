import type { ButtonHTMLAttributes, ReactNode } from "react";

interface OptionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  selected?: boolean;
  children: ReactNode;
}

export default function OptionButton({
  selected = false,
  children,
  className = "",
  ...props
}: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`
        min-h-11
        rounded-lg
        border
        px-4
        py-3
        text-sm
        font-medium
        transition-all
        focus:outline-none
        focus:ring-2
        focus:ring-[#5547E8]/20
        ${
          selected
            ? `
              border-[#5547E8]
              bg-[#F2F0FF]
              text-[#5547E8]
            `
            : `
              border-[#DADADA]
              bg-white
              text-[#555555]
              hover:border-[#AAA3F5]
              hover:bg-[#FAF9FF]
            `
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}