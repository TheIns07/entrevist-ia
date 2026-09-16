import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import InterviewPage from "../pages/InterviewPage";
import InterviewSetupPage from "../pages/InterviewSetupPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import OnboardingPage from "../pages/OnboardingPage";
import PrivacyPage from "../pages/PrivacyPage";
import ProcessingPage from "../pages/ProcessingPage";
import RegisterPage from "../pages/RegisterPage";
import ResultsPage from "../pages/ResultsPage";
import TermsPage from "../pages/TermsPage";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===============================================
            RUTAS PÚBLICAS
        =============================================== */}

        <Route
          path="/"
          element={
            <LandingPage />
          }
        />

        <Route
          path="/register"
          element={
            <RegisterPage />
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPasswordPage />
          }
        />

        <Route
          path="/terms"
          element={
            <TermsPage />
          }
        />

        <Route
          path="/privacy"
          element={
            <PrivacyPage />
          }
        />

        {/* ===============================================
            RUTAS PROTEGIDAS
        =============================================== */}

        <Route
          element={
            <ProtectedRoute />
          }
        >
          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          {/* ONBOARDING */}

          <Route
            path="/onboarding"
            element={
              <OnboardingPage />
            }
          />

          {/* SETUP DE ENTREVISTA */}

          <Route
            path="/interview/setup/:sessionId"
            element={
              <InterviewSetupPage />
            }
          />

          {/* ENTREVISTA */}

          <Route
            path="/interview/:sessionId"
            element={
              <InterviewPage />
            }
          />

          {/* PROCESAMIENTO */}

          <Route
            path="/interview/:sessionId/processing"
            element={
              <ProcessingPage />
            }
          />

          {/* RESULTADOS */}

          <Route
            path="/interview/:sessionId/results"
            element={
              <ResultsPage />
            }
          />
        </Route>

        {/* ===============================================
            FALLBACK
        =============================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}