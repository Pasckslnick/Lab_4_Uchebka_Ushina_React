import { useState, useEffect, useContext } from 'react';
import './css/AdminOrders.css';
import { userContext } from "../Context/UserContext";

export default function AdminOrders() {
  const { token } = useContext(userContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!token) return;
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/api/get_all_payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          throw new Error("Ошибка загрузки заказов");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [token]);

  if (loading) return <div className="admin-orders-page"><h2>Загрузка...</h2></div>;
  if (error) return <div className="admin-orders-page"><h2 style={{ color: 'red' }}>{error}</h2></div>;

  return (
    <div className="admin-orders-page">
      <h1 className="admin-title">Все заказы</h1>

      <div className="glass-panel">
        <h2>История оформленных заказов</h2>
        
        {orders.length === 0 ? (
          <p>Заказов пока нет</p>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Заказ #{order.id}</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span className="order-date">
                      {new Date(order.payment_date).toLocaleString("ru-RU")}
                    </span>
                    <span className={`badge-status ${order.payment_status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                      {order.payment_status === 'completed' ? 'Оплачен' : order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="order-info">
                  <div className="info-item">
                    <span className="info-label">ID Пользователя:</span>
                    <span className="info-value">{order.user_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Скидка:</span>
                    <span className="info-value discount">
                      -{Number(order.discount_applied).toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Итого оплачено:</span>
                    <span className="info-value total">
                      {Number(order.total_amount).toLocaleString()} ₽
                    </span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="order-items">
                    <div className="order-items-title">Состав заказа:</div>
                    <div className="order-items-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span className="item-name">
                            {item.name} (x{item.quantity})
                          </span>
                          <span className="item-price">
                            {Number(item.price_at_purchase).toLocaleString()} ₽
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}