import {
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";

import { Eye, EyeOff } from "lucide-react";
import Input from "./Input";

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;

  onChange?: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onBlur?: (
    event: FocusEvent<HTMLInputElement>
  ) => void;
}

export default function PasswordInput({
  label = "Contraseña",
  placeholder = "Mínimo 8 caracteres",
  value,
  name,
  error,
  helperText,
  disabled,
  required,
  autoComplete,
  onChange,
  onBlur,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      label={label}
      name={name}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      onChange={onChange}
      onBlur={onBlur}
      rightIcon={
        <button
          type="button"
          onClick={() =>
            setShowPassword((current) => !current)
          }
          className="
            flex
            items-center
            justify-center
            text-gray-500
            transition
            hover:text-gray-800
            focus:outline-none
          "
          aria-label={
            showPassword
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      }
    />
  );
}