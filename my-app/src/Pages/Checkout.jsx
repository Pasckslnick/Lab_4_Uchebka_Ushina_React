import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cartContext } from "./Context/CartContext";
import { userContext } from "./Context/UserContext";
import { checkout } from "../api/cart";
import "./css/Checkout.css";

export default function Checkout() {
  const { cart, fetchCart } = useContext(cartContext);
  const { token } = useContext(userContext);
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const result = await checkout(token, deliveryAddress, deliveryDate);
      setOrder(result.order);
      await fetchCart();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <div className="receipt">
        <h2>Заказ успешно оформлен</h2>
        <p>Дата доставки: {order.delivery_date}</p>
        <p>Сумма: {Number(order.total_amount).toLocaleString("ru-RU")} ₽</p>
        <button onClick={() => navigate("/orders")}>Перейти к заказам</button>
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="receipt">
        <h2>Корзина пуста</h2>
        <button onClick={() => navigate("/home")}>В каталог</button>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="checkout-page">
      <div className="checkout-form-panel">
        <h2 className="checkout-title">Оформление заказа</h2>
        {error && <p style={{ color: "#ff6b9d" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="delivery-address">Адрес доставки</label>
            <input
              id="delivery-address"
              className="glass-input"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery-date">Дата доставки</label>
            <input
              id="delivery-date"
              type="date"
              className="glass-input"
              value={deliveryDate}
              min={today}
              onChange={(event) => setDeliveryDate(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-pay" disabled={loading}>
            {loading ? "Оформление..." : "Оформить заказ"}
          </button>
        </form>
      </div>
      <div className="checkout-summary-panel">
        <h2>Ваш заказ</h2>
        {cart.items.map((item) => (
          <p key={item.service}>
            {item.service}: {item.quantity} × {Number(item.price).toLocaleString("ru-RU")} ₽
          </p>
        ))}
        <strong>Итого: {Number(cart.total).toLocaleString("ru-RU")} ₽</strong>
      </div>
    </div>
  );
}
