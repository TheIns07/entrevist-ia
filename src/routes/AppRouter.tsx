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
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPasswordPage />
          }
        />

        <Route
          path="/terms"
          element={<TermsPage />}
        />

        <Route
          path="/privacy"
          element={<PrivacyPage />}
        />

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            path="/onboarding"
            element={<OnboardingPage />}
          />

          <Route
            path="/interview/setup/:sessionId"
            element={
              <InterviewSetupPage />
            }
          />

          <Route
            path="/interview/:sessionId"
            element={<InterviewPage />}
          />
          
          <Route
            path="/interview/:sessionId/processing"
            element={<ProcessingPage />}
          />

          <Route
            path="/interview/:sessionId/results"
            element={<ResultsPage />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
        </Route>

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