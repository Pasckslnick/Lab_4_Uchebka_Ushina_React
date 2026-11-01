import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth";
import "./css/Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(sessionStorage.getItem("reset_token"), password);
      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_email");
      navigate("/login", { state: { message: "Пароль изменён. Войдите с новым паролем." } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <h1>Новый пароль</h1>
      <p>Придумайте новый пароль для аккаунта.</p>
      {error && <p className="auth-error">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="new-password">Новый пароль</label>
        <input id="new-password" type="password" minLength={8} maxLength={72}
          value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label htmlFor="password-confirmation">Подтвердите пароль</label>
        <input id="password-confirmation" type="password" minLength={8} maxLength={72}
          value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}
