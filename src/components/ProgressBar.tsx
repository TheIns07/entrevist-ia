interface ProgressBarProps {
    value: number;
    max?: number;
  }
  
  export default function ProgressBar({
    value,
    max = 100,
  }: ProgressBarProps) {
    const percentage = Math.min(
      100,
      Math.max(0, (value / max) * 100)
    );
  
    return (
      <div
        className="
          h-1.5
          w-full
          overflow-hidden
          rounded-full
          bg-[#E8E8ED]
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-[#5547E8]
            transition-all
            duration-300
            ease-out
          "
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    );
  }