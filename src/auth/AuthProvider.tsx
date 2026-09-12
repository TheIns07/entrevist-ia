import {
    useEffect,
    useMemo,
    useState,
    type ReactNode,
  } from "react";
  
  import type {
    Session,
    User,
  } from "@supabase/supabase-js";
  
  import { supabase } from "../lib/supabase";
  import { AuthContext } from "./AuthContext";
  
  interface AuthProviderProps {
    children: ReactNode;
  }
  
  export default function AuthProvider({
    children,
  }: AuthProviderProps) {
    const [session, setSession] =
      useState<Session | null>(null);
  
    const [user, setUser] =
      useState<User | null>(null);
  
    const [loading, setLoading] =
      useState(true);
  
    useEffect(() => {
      let mounted = true;
  
      const initializeAuth = async () => {
        const {
          data,
          error,
        } = await supabase.auth.getSession();
  
        if (!mounted) {
          return;
        }
  
        if (error) {
          console.error(
            "Error obteniendo sesión:",
            error
          );
        }
  
        const currentSession =
          data.session ?? null;
  
        setSession(currentSession);
  
        setUser(
          currentSession?.user ?? null
        );
  
        setLoading(false);
      };
  
      initializeAuth();
  
      const {
        data: {
          subscription,
        },
      } =
        supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            if (!mounted) {
              return;
            }
  
            setSession(newSession);
  
            setUser(
              newSession?.user ?? null
            );
  
            setLoading(false);
          }
        );
  
      return () => {
        mounted = false;
  
        subscription.unsubscribe();
      };
    }, []);
  
    const signOut = async () => {
      const {
        error,
      } = await supabase.auth.signOut();
  
      if (error) {
        throw error;
      }
    };
  
    const value = useMemo(
      () => ({
        session,
        user,
        loading,
        signOut,
      }),
      [
        session,
        user,
        loading,
      ]
    );
  
    return (
      <AuthContext.Provider
        value={value}
      >
        {children}
      </AuthContext.Provider>
    );
  }