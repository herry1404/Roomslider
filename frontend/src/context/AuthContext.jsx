import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

import api from "../api/axios";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showPreferences, setShowPreferences] = useState(false);

  const maybePromptPreferences = (userData) => {

    if (!userData || userData.preferredCollege) return;

    const promptKey = `prefsPrompted:${userData.id}`;

    if (localStorage.getItem(promptKey)) return;

    setShowPreferences(true);

  };

  const dismissPreferencesPrompt = () => {

    if (user?.id) {
      localStorage.setItem(`prefsPrompted:${user.id}`, "1");
    }

    setShowPreferences(false);

  };

  useEffect(() => {

    if (user) {
      maybePromptPreferences(user);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = (token, userData) => {
    console.log("TOKEN:", token);
    console.log("USER:", userData);

    if (token) {
      localStorage.setItem("token", token);
    }

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      maybePromptPreferences(userData);
    }
  };

  const login = async (data) => {
    try {
      console.log("Login Data:", data);

      const res = await api.post("/auth/login", data);

      console.log("Login Response:", res.data);

      saveSession(res.data.token, res.data.user);

      return {
        success: true,
        message: res.data.message || "Login successful",
        user: res.data.user,
      };
    } catch (error) {
      console.error("LOGIN API ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    try {
      console.log("Google Login Credential Received");

      const res = await api.post("/auth/google", { credential });

      console.log("Google Login Response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);

        if (!res.data.needsPhone) {
          maybePromptPreferences(res.data.user);
        }
      }

      return {
        success: true,
        message: res.data.message || "Login successful",
        user: res.data.user,
        needsPhone: res.data.needsPhone,
      };
    } catch (error) {
      console.error("GOOGLE LOGIN API ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);
      throw error;
    }
  };

  const ownerLogin = async (data) => {
    try {
      console.log("Owner Login Data:", data);

      const res = await api.post("/owners/login", data);

      console.log("Owner Login Response:", res.data);

      saveSession(res.data.token, res.data.user);

      return {
        success: true,
        message: res.data.message || "Login successful",
        user: res.data.user,
      };
    } catch (error) {
      console.error("OWNER LOGIN API ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);
      throw error;
    }
  };

  const messLogin = async (data) => {
    try {
      const res = await api.post("/mess/login", data);
      saveSession(res.data.token, res.data.user);
      return {
        success: true,
        message: res.data.message || "Login successful",
        user: res.data.user,
      };
    } catch (error) {
      console.error("MESS LOGIN API ERROR:", error);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      console.log("Register Data:", data);

      const res = await api.post("/auth/register", data);

      console.log("Register Response:", res.data);

      saveSession(res.data.token, res.data.user);

      return {
        success: true,
        message: res.data.message || "Registration successful",
        user: res.data.user,
      };
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        googleLogin,
        ownerLogin,
        messLogin,
        register,
        logout,
        showPreferences,
        dismissPreferencesPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
