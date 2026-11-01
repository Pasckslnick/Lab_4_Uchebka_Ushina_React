import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import "./css/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);
      await requestPasswordReset(email);
      sessionStorage.setItem("reset_email", email.trim());
      setMessage("Если аккаунт существует, код отправлен на указанную почту.");
      navigate(`/verify-reset-code?email=${encodeURIComponent(email.trim())}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <h1>Восстановление пароля</h1>
      <p>Введите email, указанный при регистрации.</p>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="reset-email">Email</label>
        <input id="reset-email" type="email" value={email}
          onChange={(event) => setEmail(event.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? "Отправка..." : "Отправить код"}
        </button>
        <button type="button" onClick={() => navigate("/login")}>Вернуться ко входу</button>
      </form>
    </div>
  );
}
