import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import "./index.css";

import "./styles/navbar.css";
import "./styles/hero.css";
import "./styles/categories.css";
import "./styles/latest-rooms.css";
import "./styles/footer.css";
import "./styles/about.css";
import "./styles/login.css";   // ✅ IMPORTANT
import "./styles/register.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <HelmetProvider>
          <AuthProvider>
            <ThemeProvider>
              <App />
              <Toaster position="top-center" />
            </ThemeProvider>
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
