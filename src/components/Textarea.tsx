import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";

type TextareaSize =
  | "sm"
  | "md"
  | "lg";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;

  size?: TextareaSize;

  resizable?: boolean;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: "min-h-[120px]",
  md: "min-h-[180px]",
  lg: "min-h-[260px]",
};

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      value,
      maxLength,
      size = "md",
      resizable = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();

    const textareaId =
      id ||
      props.name ||
      generatedId;

    const characterCount =
      typeof value === "string"
        ? value.length
        : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="
              mb-2
              block
              text-sm
              font-semibold
              text-[#252525]
            "
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={`
            w-full
            rounded-xl
            border
            bg-white
            px-4
            py-4
            text-[15px]
            leading-6
            text-[#252525]
            outline-none
            transition-all
            duration-200

            placeholder:text-[#AAAAAA]

            focus:border-[#5547E8]
            focus:ring-4
            focus:ring-[#5547E8]/10

            disabled:cursor-not-allowed
            disabled:bg-[#F5F5F5]
            disabled:text-[#999999]

            ${
              error
                ? `
                  border-red-500
                  focus:border-red-500
                  focus:ring-red-500/10
                `
                : "border-[#DADDE3]"
            }

            ${sizeClasses[size]}

            ${
              resizable
                ? "resize-y"
                : "resize-none"
            }

            ${className}
          `}
          {...props}
        />

        {(error ||
          helperText ||
          (showCount && maxLength)) && (
          <div
            className="
              mt-2
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div>
              {error ? (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              ) : helperText ? (
                <p className="text-xs text-[#888888]">
                  {helperText}
                </p>
              ) : null}
            </div>

            {showCount && maxLength && (
              <p
                className="
                  shrink-0
                  text-xs
                  tabular-nums
                  text-[#999999]
                "
              >
                {characterCount}/{maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;