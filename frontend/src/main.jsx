import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleOneTap from "./components/auth/GoogleOneTap";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import ConfirmModalHost from "./components/ui/ConfirmModal";

import "./index.css";
import "./styles/leaflet-theme.css";

import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/categories.css";
import "./styles/latest-rooms.css";
import "./styles/footer.css";
import "./styles/about.css";
import "./styles/login.css";   // ✅ IMPORTANT
import "./styles/login-modal.css";
import "./styles/register.css";
import "./styles/preferences-modal.css";

import App from "./App";
import { SpeedInsights } from "@vercel/speed-insights/react";
import * as Sentry from "@sentry/react";
import { initializeSentry } from "./utils/sentry";

const sentryEnabled = initializeSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <HelmetProvider>
          <AuthProvider>
            <WishlistProvider>
              <ThemeProvider>
                <NotificationProvider>
                  <GoogleOneTap />
                  {sentryEnabled ? (
                    <Sentry.ErrorBoundary fallback={<p role="alert">Something went wrong. Please reload the page.</p>}>
                      <App />
                    </Sentry.ErrorBoundary>
                  ) : (
                    <App />
                  )}
                  <ConfirmModalHost />
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      duration: 3500,
                      style: {
                        background: "var(--color-surface)",
                        color: "var(--color-text)",
                        border: "1px solid var(--color-border)",
                      },
                      success: { iconTheme: { primary: "var(--color-success)", secondary: "var(--color-surface)" } },
                      error: { iconTheme: { primary: "var(--color-error)", secondary: "var(--color-surface)" } },
                    }}
                  />
                  <SpeedInsights />
                </NotificationProvider>
              </ThemeProvider>
            </WishlistProvider>
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
