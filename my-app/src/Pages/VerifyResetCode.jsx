import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyResetCode } from "../api/auth";
import "./css/Auth.css";

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") || sessionStorage.getItem("reset_email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      setLoading(true);
      const data = await verifyResetCode(email, code);
      sessionStorage.setItem("reset_token", data.reset_token);
      navigate("/reset-password");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <h1>Подтверждение email</h1>
      <p>Введите шестизначный код из письма.</p>
      {error && <p className="auth-error">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="reset-code">Код из письма</label>
        <input
          id="reset-code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder="583921"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Проверка..." : "Подтвердить"}
        </button>
        <button type="button" onClick={() => navigate("/forgot-password")}>
          Изменить email
        </button>
      </form>
    </div>
  );
}
