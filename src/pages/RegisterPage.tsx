import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  AppHeader,
  Button,
  Checkbox,
  Input,
  PasswordInput,
} from "../components";

import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [
    receiveTips,
    setReceiveTips,
  ] = useState(false);

  const [
    emailTouched,
    setEmailTouched,
  ] = useState(false);

  const [
    passwordTouched,
    setPasswordTouched,
  ] = useState(false);

  const [
    nameTouched,
    setNameTouched,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [
    confirmationEmail,
    setConfirmationEmail,
  ] = useState<string | null>(null);

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

  const nameIsValid =
    name.trim().length >= 2;

  const formIsValid =
    emailIsValid &&
    passwordIsValid &&
    nameIsValid;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setEmailTouched(true);
    setPasswordTouched(true);
    setNameTouched(true);
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
      } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,

        options: {
          data: {
            name: name.trim(),
            receive_tips: receiveTips,
          },
        },
      });

      if (error) {
        throw error;
      }

      /*
       * Si Supabase devuelve una sesión,
       * el usuario ya quedó autenticado.
       */
      if (data.session) {
        navigate("/onboarding");
        return;
      }

      /*
       * Si no devuelve sesión normalmente
       * significa que está habilitada la
       * confirmación por correo.
       */
      setConfirmationEmail(email.trim());
    } catch (error) {
      console.error(
        "Error registrando usuario:",
        error
      );

      if (
        error instanceof Error
      ) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          "No pudimos crear tu cuenta. Intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (confirmationEmail) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader backTo="/" />

        <main
          className="
            px-5
            pb-16
            pt-16
            sm:px-8
            sm:pt-24
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[420px]
              text-center
            "
          >
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
                text-[30px]
                font-bold
                tracking-[-0.03em]
                text-[#252525]
              "
            >
              Revisa tu correo
            </h1>

            <p
              className="
                mt-4
                text-sm
                leading-6
                text-[#777777]
              "
            >
              Te enviamos un enlace de
              confirmación a:
            </p>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-[#252525]
              "
            >
              {confirmationEmail}
            </p>

            <p
              className="
                mt-5
                text-sm
                leading-6
                text-[#777777]
              "
            >
              Confirma tu correo para activar
              tu cuenta y continuar con tu
              entrevista.
            </p>

            <div className="mt-8">
              <Link
                to="/login"
                className="
                  text-sm
                  font-semibold
                  text-[#5547E8]
                  hover:underline
                "
              >
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              Crea tu cuenta para practicar
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
              Practica entrevistas reales y
              recibe feedback en minutos.
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

              Regístrate con Google
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
            <div
              className="
                h-px
                flex-1
                bg-[#E4E4E4]
              "
            />

            <span
              className="
                text-xs
                text-[#999999]
              "
            >
              o
            </span>

            <div
              className="
                h-px
                flex-1
                bg-[#E4E4E4]
              "
            />
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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              onBlur={() =>
                setPasswordTouched(true)
              }
              helperText={
                !passwordTouched ||
                passwordIsValid
                  ? "Usa al menos 8 caracteres."
                  : undefined
              }
              error={
                passwordTouched &&
                !passwordIsValid
                  ? "La contraseña debe tener al menos 8 caracteres."
                  : undefined
              }
            />

            <Input
              label="Nombre"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              onBlur={() =>
                setNameTouched(true)
              }
              error={
                nameTouched &&
                !nameIsValid
                  ? "Ingresa tu nombre."
                  : undefined
              }
            />

            <Checkbox
              name="receiveTips"
              checked={receiveTips}
              onChange={(event) =>
                setReceiveTips(
                  event.target.checked
                )
              }
              label="Recibir tips y resultados"
            />

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
              Crear cuenta
            </Button>
          </form>

          <div
            className="
              mt-8
              text-center
            "
          >
            <p
              className="
                text-sm
                text-[#777777]
              "
            >
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="
                  font-semibold
                  text-[#5547E8]
                  hover:underline
                "
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}