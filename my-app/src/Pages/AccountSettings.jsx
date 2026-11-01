import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, updateProfile } from "../api/auth";
import { userContext } from "./Context/UserContext";
import "./css/Profile.css";

export default function AccountSettings() {
  const { user, token, refreshUser } = useContext(userContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    default_address: user?.default_address || "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirmation: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Настройки доступны после авторизации</h2>
        <button className="view-orders-button" onClick={() => navigate("/login")}>Войти</button>
      </div>
    );
  }

  function updateField(event) {
    setProfile({ ...profile, [event.target.name]: event.target.value });
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      setSavingProfile(true);
      await updateProfile(token, profile);
      await refreshUser();
      setMessage("Личные данные сохранены.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (passwords.new_password !== passwords.confirmation) {
      setError("Новые пароли не совпадают.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(token, passwords.current_password, passwords.new_password);
      setPasswords({ current_password: "", new_password: "", confirmation: "" });
      setMessage("Пароль успешно изменён.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="profile-container">
      <h1>Настройки аккаунта</h1>
      {error && <p className="profile-message profile-message--error">{error}</p>}
      {message && <p className="profile-message profile-message--success">{message}</p>}

      <form className="profile-form" onSubmit={saveProfile}>
        <h2>Личные данные</h2>
        <label>ФИО<input name="full_name" value={profile.full_name} onChange={updateField} maxLength={150} required /></label>
        <label>Email<input type="email" name="email" value={profile.email} onChange={updateField} required /></label>
        <label>Телефон<input name="phone" value={profile.phone} onChange={updateField} pattern="\+?[0-9 ()-]{7,20}" required /></label>
        <label>Адрес по умолчанию<textarea name="default_address" value={profile.default_address} onChange={updateField} maxLength={1000} /></label>
        <button className="view-orders-button" type="submit" disabled={savingProfile}>{savingProfile ? "Сохранение..." : "Сохранить данные"}</button>
      </form>

      <form className="profile-form" onSubmit={savePassword}>
        <h2>Изменить пароль</h2>
        <label>Текущий пароль<input type="password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} required /></label>
        <label>Новый пароль<input type="password" minLength={8} maxLength={72} value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} required /></label>
        <label>Подтвердите новый пароль<input type="password" minLength={8} maxLength={72} value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} required /></label>
        <button className="view-orders-button" type="submit" disabled={savingPassword}>{savingPassword ? "Изменение..." : "Изменить пароль"}</button>
      </form>

      <button className="view-orders-button" onClick={() => navigate("/profile")}>Вернуться в личный кабинет</button>
    </main>
  );
}
