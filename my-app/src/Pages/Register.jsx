import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { userContext } from "./Context/UserContext";
import "./css/Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useContext(userContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password || !confirmPassword) {
      return setError("Пожалуйста, заполните все поля.");
    }

    if (password !== confirmPassword) {
      return setError("Пароли не совпадают.");
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/add_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          name: username,
          role: 2
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      await login(email, password);
      
      navigate("/home");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Регистрация</h1>
      <p>Пожалуйста, заполните форму ниже, чтобы создать учетную запись.</p>
      
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Имя пользователя:</label>
        <input 
          type="text" 
          id="username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />

        <label htmlFor="email">Электронная почта:</label>
        <input 
          type="email" 
          id="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />

        <label htmlFor="password">Пароль:</label>
        <input 
          type="password" 
          id="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />

        <label htmlFor="confirm-password">Подтвердите пароль:</label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>

        <p1>Уже есть учетная запись?</p1>
        <button type="button" onClick={() => navigate("/login")}>
          Войти
        </button>
      </form>
    </div>
  );
}