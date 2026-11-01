import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { userContext } from "./Context/UserContext";
import "./css/Orders.css";

export default function MyOrders() {
  const { user, token } = useContext(userContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ошибка загрузки заказов");
        setOrders(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [token]);

  if (!user) {
    return (
      <div className="my-orders-page">
        <h2>Вы не авторизованы</h2>
        <Link to="/login">Войти</Link>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>Мои заказы</h1>
        <Link to="/profile" className="back-link">← Назад в профиль</Link>
      </div>
      {loading ? <p>Загрузка заказов...</p> : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : orders.length === 0 ? (
        <div className="glass-panel"><p>У вас пока нет оформленных заказов.</p></div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={`${order.created_at}-${order.delivery_date}`} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Заказ от {new Date(order.created_at).toLocaleString("ru-RU")}</span>
                  <span className="order-date">Доставка: {new Date(order.delivery_date).toLocaleDateString("ru-RU")}</span>
                </div>
                <span className="badge-status badge-pending">{order.status}</span>
              </div>
              <div className="order-info">
                <div className="info-item">
                  <span className="info-label">Адрес:</span>
                  <span className="info-value">{order.delivery_address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Сумма:</span>
                  <span className="info-value">{Number(order.total_amount).toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
              <div className="order-items">
                <h4>Состав заказа:</h4>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={`${item.service}-${index}`}>
                      <span className="item-name">{item.service} (x{item.quantity})</span>
                      <span className="item-price">{Number(item.price).toLocaleString("ru-RU")} ₽</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
