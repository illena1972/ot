import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import api from "../../api/api";

export default function LoginPage({ onAuthenticated }) {
  const [organization, setOrganization] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("organization/current/")
      .then((response) => setOrganization(response.data))
      .catch(() => setError("Не удалось определить организацию по этому адресу."));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("auth/login/", { username, password });
      onAuthenticated(response.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Не удалось выполнить вход.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-xl font-semibold text-gray-800">Система учета спецодежды</h1>
        <label className="mt-6 block text-sm font-medium text-gray-700" htmlFor="username">
          Логин
        </label>
        <input
          id="username"
          className="form-control mt-1"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          className="form-control mt-1"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={submitting || !organization}
        >
          <LogIn size={18} />
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
