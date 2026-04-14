import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://127.0.0.1:8000/api/"
    : "/api/",
});

export default api;

