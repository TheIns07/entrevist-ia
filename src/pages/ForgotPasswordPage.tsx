import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import {
  AppHeader,
  Button,
  Input,
} from "../components";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailIsValid = useMemo(() => {
    const normalizedEmail = email
      .trim()
      .toLowerCase();
  
    return /^[^\s\\@]+@[^\s\\@]+\.[^\s\\@]+$/.test(
      normalizedEmail
    );
  }, [email]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEmailTouched(true);

    if (!emailIsValid) {
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader backTo="/login" />

      <main
        className="
          px-5
          pb-16
          pt-8
          sm:px-8
          sm:pt-12
          lg:pb-24
        "
      >
        <div className="mx-auto w-full max-w-[420px]">
          {!submitted ? (
            <>
              <header className="text-center">
                <h1
                  className="
                    text-[28px]
                    font-bold
                    leading-tight
                    tracking-[-0.025em]
                    text-[#252525]
                    sm:text-[32px]
                  "
                >
                  Recupera tu contraseña
                </h1>

                <p
                  className="
                    mx-auto
                    mt-3
                    max-w-sm
                    text-sm
                    leading-6
                    text-[#777777]
                  "
                >
                  Ingresa el correo asociado a tu cuenta y te enviaremos
                  instrucciones para recuperar tu acceso.
                </p>
              </header>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-6"
              >
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  error={
                    emailTouched && !emailIsValid
                      ? "Ingresa un correo electrónico válido."
                      : undefined
                  }
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={!emailIsValid}
                >
                  Enviar enlace
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="
                    text-sm
                    font-semibold
                    text-[#5547E8]
                    transition-colors
                    hover:text-[#493BD4]
                    hover:underline
                  "
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F0EEFF]
                  text-xl
                  font-bold
                  text-[#5547E8]
                "
              >
                ✓
              </div>

              <h1
                className="
                  mt-6
                  text-[28px]
                  font-bold
                  leading-tight
                  tracking-[-0.025em]
                  text-[#252525]
                  sm:text-[32px]
                "
              >
                Revisa tu correo
              </h1>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-sm
                  text-sm
                  leading-6
                  text-[#777777]
                "
              >
                Enviamos las instrucciones de recuperación a:
              </p>

              <p className="mt-2 text-sm font-semibold text-[#252525]">
                {email}
              </p>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="
                    text-sm
                    font-semibold
                    text-[#5547E8]
                    transition-colors
                    hover:text-[#493BD4]
                    hover:underline
                  "
                >
                  Volver a iniciar sesión
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="
                  mt-4
                  text-xs
                  text-[#777777]
                  transition-colors
                  hover:text-[#252525]
                  hover:underline
                "
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}