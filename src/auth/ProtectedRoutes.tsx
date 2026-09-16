import {
    Navigate,
    Outlet,
    useLocation,
  } from "react-router-dom";
  
  import {
    useAuth,
  } from "./useAuth";
  
  export default function ProtectedRoute() {
    const location =
      useLocation();
  
    const {
      user,
      loading,
    } =
      useAuth();
  
    /*
     * =========================================================
     * ESPERAR A QUE SUPABASE RESUELVA LA SESIÓN
     * =========================================================
     *
     * Esto evita que al refrescar una ruta privada
     * el usuario sea enviado momentáneamente a /login.
     */
  
    if (
      loading
    ) {
      return (
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-[#F7F8FA]
          "
        >
          <div
            className="
              h-6
              w-6
              animate-spin
              rounded-full
              border-2
              border-[#E3E1FB]
              border-t-[#5547E8]
            "
          />
        </div>
      );
    }
  
    /*
     * =========================================================
     * USUARIO NO AUTENTICADO
     * =========================================================
     *
     * Guardamos la ruta original para poder regresar
     * al usuario después de iniciar sesión.
     */
  
    if (
      !user
    ) {
      const from =
        `${location.pathname}${location.search}`;
  
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from,
          }}
        />
      );
    }
  
    /*
     * =========================================================
     * USUARIO AUTENTICADO
     * =========================================================
     *
     * Outlet renderiza la ruta hija:
     *
     * /dashboard
     * /onboarding
     * /interview/...
     */
  
    return (
      <Outlet />
    );
  }