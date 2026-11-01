import { useContext, useEffect, useState } from "react";
import { userContext } from "../Context/UserContext";
import "./css/AdminOrders.css";

export default function AdminOrders() {
  const { token } = useContext(userContext);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("http://localhost:3001/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ошибка загрузки заказов");
        setOrders(data);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    if (token) loadOrders();
  }, [token]);

  return (
    <div className="admin-orders-page">
      <h1 className="admin-title">Все заказы</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="orders-list">
        {orders.map((order) => (
          <div key={`${order.created_at}-${order.customer_email}`} className="order-card">
            <div className="order-header">
              <span>{order.customer}</span>
              <span>{order.status}</span>
            </div>
            <p>{order.customer_email}</p>
            <p>Адрес: {order.delivery_address}</p>
            <p>Дата доставки: {order.delivery_date}</p>
            <strong>{Number(order.total_amount).toLocaleString("ru-RU")} ₽</strong>
            <ul>
              {order.items.map((item, index) => (
                <li key={`${item.service}-${index}`}>
                  {item.service} × {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
