import type { ReactNode } from "react";

interface FeedbackCardProps {
  title: string;
  children: ReactNode;
}

export default function FeedbackCard({
  title,
  children,
}: FeedbackCardProps) {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[#E8E8E8]
        bg-white
        p-5
        shadow-sm
        sm:p-6
      "
    >
      <h2
        className="
          text-base
          font-semibold
          text-[#252525]
        "
      >
        {title}
      </h2>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}