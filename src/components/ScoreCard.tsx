interface ScoreCardProps {
    score: number;
    maxScore?: number;
    label: string;
    description?: string;
  }
  
  export default function ScoreCard({
    score,
    maxScore = 10,
    label,
    description,
  }: ScoreCardProps) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-[#E8E8E8]
          bg-white
          p-6
          shadow-sm
          sm:p-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.12em]
                text-[#5547E8]
              "
            >
              Resultado general
            </p>
  
            <div className="mt-3 flex items-end gap-2">
              <span
                className="
                  text-[48px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                  text-[#252525]
                  sm:text-[58px]
                "
              >
                {score}
              </span>
  
              <span
                className="
                  pb-1
                  text-lg
                  font-medium
                  text-[#999999]
                "
              >
                / {maxScore}
              </span>
            </div>
          </div>
  
          <div
            className="
              self-start
              rounded-full
              bg-[#F0EEFF]
              px-4
              py-2
              text-sm
              font-semibold
              text-[#5547E8]
              sm:self-center
            "
          >
            {label}
          </div>
        </div>
  
        {description && (
          <p
            className="
              mt-6
              max-w-xl
              text-sm
              leading-6
              text-[#777777]
            "
          >
            {description}
          </p>
        )}
      </section>
    );
  }