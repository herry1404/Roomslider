import axios from "axios";

const api = axios.create({

  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5000/api"
      : "https://roomslider-api.onrender.com/api"),

  headers: {
    "Content-Type": "application/json",
  },

});


// ==========================
// Request Interceptor
// ==========================

api.interceptors.request.use(

  (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    const token = localStorage.getItem("token");

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);



// ==========================
// Response Interceptor
// ==========================

api.interceptors.response.use(

  (response) => response,

  (error) => {

    return Promise.reject(error);

  }

);


export default api;