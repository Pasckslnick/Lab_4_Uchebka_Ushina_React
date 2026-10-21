import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { userContext } from "./Context/UserContext";
import "./css/Auth.css";

export default function Login() {
  const { login } = useContext(userContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <h1>Добро пожаловать!</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>Электронная почта:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Пароль:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Войти</button>
        <button type="button" onClick={() => navigate("/register")}>Зарегистрироваться</button>
      </form>
    </div>
  );
}