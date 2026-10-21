import { useContext, useEffect, useState } from "react";
import { userContext } from "./Context/UserContext";
import "./css/Profile.css";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, token } = useContext(userContext);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { logout } = useContext(userContext);

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Вы не авторизованы</h2>
        <p>Пожалуйста, войдите в систему, чтобы просмотреть профиль.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>Личный кабинет</h1>

      <div className="profile-info">
        <h2>Ваши данные</h2>
        <div className="info-row">
          <span className="info-label">Статус:</span>
          {user.role_id === 1 ? (
            <button
              onClick={() => navigate("/admin/")}
              className="admin-button"
            >
              <span>Администратор</span>
            </button>
          ) : (
            <span className="info-value">Клиент</span>
          )}
        </div>
        <div className="info-row">
          <span className="info-label">Имя:</span>
          <span className="info-value">{user.full_name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Email:</span>
          <span className="info-value">{user.email}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Персональная скидка:</span>
          <span className="info-value discount-value">
            {user.personal_discount_percent}%
          </span>
        </div>
      </div>

      <div className="profile-orders">

        <ul className="orders-list">
          <button
            onClick={() => navigate("/orders/")}
            className="view-orders-button"
          >
            <span>Посмотреть все заказы</span>
          </button>
        </ul>
      </div>
      <button
        className="btn-logout"
        onClick={() => {
          logout();
          navigate("/");
        }}
      >
        Выйти
      </button>
    </div>
  );
}
