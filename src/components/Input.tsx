import {
    forwardRef,
    type InputHTMLAttributes,
    type ReactNode,
  } from "react";
  
  interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  }
  
  const Input = forwardRef<HTMLInputElement, InputProps>(
    (
      {
        label,
        error,
        helperText,
        leftIcon,
        rightIcon,
        className = "",
        id,
        ...props
      },
      ref
    ) => {
      const inputId =
        id || props.name || `input-${Math.random().toString(36).slice(2)}`;
  
      return (
        <div className="w-full">
          {label && (
            <label
              htmlFor={inputId}
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              {label}
            </label>
          )}
  
          <div className="relative">
            {leftIcon && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {leftIcon}
              </div>
            )}
  
            <input
              ref={ref}
              id={inputId}
              className={`
                h-11
                w-full
                rounded-md
                border
                bg-white
                px-4
                text-sm
                text-gray-900
                outline-none
                transition
                placeholder:text-gray-400
                focus:border-[#5547E8]
                focus:ring-2
                focus:ring-[#5547E8]/15
                disabled:cursor-not-allowed
                disabled:bg-gray-100
                disabled:text-gray-500
                ${
                  error
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                    : "border-gray-300"
                }
                ${leftIcon ? "pl-10" : ""}
                ${rightIcon ? "pr-10" : ""}
                ${className}
              `}
              {...props}
            />
  
            {rightIcon && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
  
          {error ? (
            <p className="mt-1.5 text-sm text-red-600">{error}</p>
          ) : helperText ? (
            <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
          ) : null}
        </div>
      );
    }
  );
  
  Input.displayName = "Input";
  
  export default Input;