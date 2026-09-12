import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  Input,
  PasswordInput,
} from "../components";

import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    emailTouched,
    setEmailTouched,
  ] = useState(false);

  const [
    passwordTouched,
    setPasswordTouched,
  ] = useState(false);
  const location = useLocation();

  const from =
    (
      location.state as {
        from?: string;
      } | null
    )?.from ?? "/dashboard";

  const [loading, setLoading] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const emailIsValid = useMemo(() => {
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    return /^[^\s\\@]+@[^\s\\@]+\.[^\s\\@]+$/.test(
      normalizedEmail
    );
  }, [email]);

  const passwordIsValid =
    password.length >= 8;

  const formIsValid =
    emailIsValid &&
    passwordIsValid;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setEmailTouched(true);
    setPasswordTouched(true);
    setSubmitError(null);

    if (!formIsValid || loading) {
      return;
    }

    try {
      setLoading(true);

      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error(
          "No se pudo iniciar la sesión."
        );
      }

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error iniciando sesión:",
        error
      );

      if (error instanceof Error) {
        const message =
          error.message.toLowerCase();

        if (
          message.includes(
            "invalid login credentials"
          )
        ) {
          setSubmitError(
            "El correo o la contraseña son incorrectos."
          );

          return;
        }

        if (
          message.includes(
            "email not confirmed"
          )
        ) {
          setSubmitError(
            "Debes confirmar tu correo antes de iniciar sesión."
          );

          return;
        }

        if (
          message.includes(
            "rate limit"
          )
        ) {
          setSubmitError(
            "Has realizado demasiados intentos. Espera un momento e intenta nuevamente."
          );

          return;
        }

        setSubmitError(
          "No pudimos iniciar sesión. Intenta nuevamente."
        );

        return;
      }

      setSubmitError(
        "No pudimos iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader backTo="/" />

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
        <div
          className="
            mx-auto
            w-full
            max-w-[420px]
          "
        >
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
              Bienvenido de vuelta
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
              Continúa practicando y mejora
              para tu próxima entrevista.
            </p>
          </header>

          <div className="mt-8">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled
              className="
                relative
                border-[#DADADA]
                text-[#333333]
              "
            >
              <span
                className="
                  absolute
                  left-4
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  text-sm
                  font-bold
                "
              >
                G
              </span>

              Continuar con Google
            </Button>
          </div>

          <div
            className="
              my-7
              flex
              items-center
              gap-4
            "
          >
            <div className="h-px flex-1 bg-[#E4E4E4]" />

            <span className="text-xs text-[#999999]">
              o
            </span>

            <div className="h-px flex-1 bg-[#E4E4E4]" />
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              onBlur={() =>
                setEmailTouched(true)
              }
              error={
                emailTouched &&
                  !emailIsValid
                  ? "Ingresa un correo electrónico válido."
                  : undefined
              }
            />

            <PasswordInput
              label="Contraseña"
              name="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              onBlur={() =>
                setPasswordTouched(true)
              }
              error={
                passwordTouched &&
                  !passwordIsValid
                  ? "La contraseña debe tener al menos 8 caracteres."
                  : undefined
              }
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="
                  text-sm
                  font-medium
                  text-[#5547E8]
                  hover:underline
                "
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {submitError && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-sm
                    leading-5
                    text-red-700
                  "
                >
                  {submitError}
                </p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={
                !formIsValid ||
                loading
              }
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#777777]">
              ¿Todavía no tienes cuenta?{" "}
              <Link
                to="/register"
                className="
                  font-semibold
                  text-[#5547E8]
                  hover:underline
                "
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}