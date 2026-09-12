import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
}

export default function Checkbox({
  label,
  error,
  id,
  className = "",
  ...props
}: CheckboxProps) {
  const checkboxId =
    id || props.name || `checkbox-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="w-full">
      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-3"
      >
        <input
          id={checkboxId}
          type="checkbox"
          className={`
            mt-0.5
            h-4
            w-4
            cursor-pointer
            rounded
            border-gray-300
            accent-[#5547E8]
            focus:ring-2
            focus:ring-[#5547E8]/20
            disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        <span className="text-sm text-gray-700">
          {label}
        </span>
      </label>

      {error && (
        <p className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}