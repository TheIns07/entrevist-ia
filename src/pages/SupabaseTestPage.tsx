import {
    useEffect,
    useState,
  } from "react";
  
  import { supabase } from "../lib/supabase";
  
  export default function SupabaseTestPage() {
    const [status, setStatus] =
      useState("Comprobando conexión...");
  
    useEffect(() => {
      const testConnection = async () => {
        const {
          data,
          error,
        } = await supabase.auth.getSession();
  
        if (error) {
          console.error(error);
  
          setStatus(
            `Error: ${error.message}`
          );
  
          return;
        }
  
        console.log(
          "Supabase conectado:",
          data
        );
  
        setStatus(
          "Supabase conectado correctamente."
        );
      };
  
      testConnection();
    }, []);
  
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#F7F8FA]
          p-6
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-[#E8E8E8]
            bg-white
            p-8
            shadow-sm
          "
        >
          <p className="font-semibold text-[#252525]">
            {status}
          </p>
        </div>
      </main>
    );
  }