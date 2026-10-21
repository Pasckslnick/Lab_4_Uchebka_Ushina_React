import { Link } from "react-router-dom";
import { useContext } from "react";
import { userContext } from "../Context/UserContext";
import "./css/AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useContext(userContext);

  if (!user || user.role_id !== 1) {
    return (
      <div className="admin-denied">
        <h2>Доступ запрещен</h2>
        <p>У вас нет прав для просмотра этой страницы.</p>
        <Link to="/home" className="admin-back-btn">Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Панель управления</h1>
      </div>

      <div className="admin-grid">
        <Link to="/admin/cars" className="admin-card">
          <h3>Автомобили</h3>
        </Link>

        <Link to="/admin/users" className="admin-card">
          <h3>Пользователи</h3>
        </Link>

        <Link to="/admin/categories" className="admin-card">
          <h3>Категории</h3>
        </Link>

        <Link to="/admin/orders" className="admin-card">
          <h3>Заказы</h3>
        </Link>
      </div>
    </div>
  );
}