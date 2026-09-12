interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
  }
  
  export default function StatCard({
    label,
    value,
    description,
  }: StatCardProps) {
    return (
      <article
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
        <p
          className="
            text-sm
            font-medium
            text-[#777777]
          "
        >
          {label}
        </p>
  
        <p
          className="
            mt-3
            text-[32px]
            font-bold
            leading-none
            tracking-[-0.03em]
            text-[#252525]
          "
        >
          {value}
        </p>
  
        {description && (
          <p
            className="
              mt-3
              text-xs
              leading-5
              text-[#999999]
            "
          >
            {description}
          </p>
        )}
      </article>
    );
  }