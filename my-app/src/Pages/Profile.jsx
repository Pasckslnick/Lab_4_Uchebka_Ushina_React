import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { userContext } from "./Context/UserContext";
import "./css/Profile.css";

export default function Profile() {
  const { user, logout } = useContext(userContext);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Личный кабинет доступен после авторизации</h2>
        <button className="view-orders-button" onClick={() => navigate("/login")}>Войти</button>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <main className="profile-container">
      <h1>Личный кабинет</h1>

      <section className="profile-info">
        <h2>Информация об аккаунте</h2>
        <div className="info-row"><span className="info-label">ФИО</span><span className="info-value">{user.full_name}</span></div>
        <div className="info-row"><span className="info-label">Роль</span><span className="info-value">{user.role === "ADMIN" ? "Администратор" : "Пользователь"}</span></div>
        <div className="info-row"><span className="info-label">Email</span><span className="info-value">{user.email}</span></div>
        <div className="info-row"><span className="info-label">Телефон</span><span className="info-value">{user.phone}</span></div>
        <div className="info-row"><span className="info-label">Адрес</span><span className="info-value">{user.default_address || "Не указан"}</span></div>
      </section>

      <div className="profile-actions">
        <button className="view-orders-button" onClick={() => navigate("/settings")}>Изменить данные и пароль</button>
        <button className="view-orders-button" onClick={() => navigate("/orders")}>Мои заказы</button>
        <button className="view-orders-button" onClick={() => navigate("/reviews")}>Отзывы</button>
        {user.role === "ADMIN" && <button className="admin-button" onClick={() => navigate("/admin/")}>Панель администратора</button>}
        <button className="btn-logout" onClick={handleLogout}>Выйти</button>
      </div>
    </main>
  );
}
