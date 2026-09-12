interface InfoRowProps {
    label: string;
    value: string;
  }
  
  export default function InfoRow({
    label,
    value,
  }: InfoRowProps) {
    return (
      <div
        className="
          flex
          items-center
          justify-between
          gap-6
          border-b
          border-[#ECECEC]
          py-4
          last:border-b-0
        "
      >
        <span className="text-sm text-[#777777]">
          {label}
        </span>
  
        <span
          className="
            text-right
            text-sm
            font-semibold
            text-[#252525]
          "
        >
          {value}
        </span>
      </div>
    );
  }