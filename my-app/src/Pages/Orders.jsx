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
      if (!token) return;
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/api/get_user_payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        setError("Не удалось загрузить историю заказов");
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

      {loading ? (
        <p>Загрузка заказов...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "50px" }}>
          <p>У вас пока нет оформленных заказов.</p>
          <Link to="/home" className="btn-primary" style={{ display: "inline-block", marginTop: "20px", textDecoration: "none" }}>
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Заказ #{order.id}</span>
                  <span className="order-date">
                    {new Date(order.payment_date).toLocaleString("ru-RU")}
                  </span>
                </div>
                <span className={`badge-status ${order.payment_status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                  {order.payment_status === 'completed' ? 'Оплачен' : order.payment_status}
                </span>
              </div>

              <div className="order-info">
                <div className="info-item">
                  <span className="info-label">Сумма:</span>
                  <span className="info-value">{Number(order.total_amount).toLocaleString()} ₽</span>
                </div>
                {Number(order.discount_applied) > 0 && (
                  <div className="info-item">
                    <span className="info-label">Скидка:</span>
                    <span className="info-value discount">
                      -{Number(order.discount_applied).toLocaleString()} ₽
                    </span>
                  </div>
                )}
              </div>

              {order.items && order.items.length > 0 && (
                <div className="order-items">
                  <h4>Состав заказа:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="item-name">
                          {item.name} <span className="item-qty">(x{item.quantity})</span>
                        </span>
                        <span className="item-price">
                          {Number(item.price_at_purchase).toLocaleString()} ₽
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}