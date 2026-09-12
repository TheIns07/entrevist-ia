import {
    Navigate,
    Outlet,
    useLocation,
  } from "react-router-dom";
  
  import {
    useAuth,
  } from "../auth/useAuth";
  
  export default function ProtectedRoute() {
    const {
      user,
      loading,
    } = useAuth();
  
    const location =
      useLocation();
  
    if (loading) {
      return (
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-white
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
  
    if (!user) {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from: location.pathname,
          }}
        />
      );
    }
  
    return <Outlet />;
  }