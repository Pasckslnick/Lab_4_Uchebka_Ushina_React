import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartContext } from "./Context/CartContext";
import { userContext } from "./Context/UserContext";
import { checkout } from "../api/cart";
import "./css/Checkout.css";

export default function Checkout() {
  const { cart, fetchCart } = useContext(cartContext);
  const { token, user } = useContext(userContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  useEffect(() => {
    if (user && user.personal_discount_percent > 0 && cart.items?.length > 0) {
      // Скидка есть, можно применять
    }
  }, [cart, user]);

  if (!cart.items || cart.items.length === 0) {
    if (successData) {
      return (
        <div className="receipt">
          <h2>✅ Оплата прошла успешно!</h2>
          <p>Номер заказа: <strong>#{successData.payment_id}</strong></p>
          <p>Итого оплачено: <strong>{Number(successData.total_amount).toLocaleString()} ₽</strong></p>
          <p>Ваша скидка: <strong style={{ color: '#4ade80' }}>{Number(successData.total_discount).toLocaleString()} ₽</strong></p>
          <button 
            onClick={() => navigate("/home")} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Вернуться в каталог
          </button>
        </div>
      );
    }
    
    return (
      <div style={{ textAlign: "center", marginTop: "100px", color: "#fff" }}>
        <h2>Корзина пуста. Нечего оплачивать.</h2>
        <button onClick={() => navigate("/home")} style={{ marginTop: '20px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          В каталог
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError(null);

    if (cardData.number.replace(/\s/g, '').length < 16) {
      return setError("Введите корректный номер карты (16 цифр)");
    }

    try {
      setLoading(true);
      
      const data = await checkout(token);
      
      setSuccessData(data);
      await fetchCart();
      setCardData({ number: "", name: "", expiry: "", cvv: "" });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = Number(cart.total_price);

  return (
    <div className="checkout-page">
      <div className="checkout-form-panel">
        <h2 className="checkout-title">Оплата заказа</h2>
        
        {error && <p style={{ color: '#ff6b9d', marginBottom: '15px' }}>{error}</p>}

        <form onSubmit={handlePay}>
          <div className="form-group">
            <label>Номер карты</label>
            <input
              type="text"
              name="number"
              className="glass-input"
              placeholder="0000 0000 0000 0000"
              value={cardData.number}
              onChange={handleChange}
              maxLength="19"
              required
            />
          </div>

          <div className="form-group">
            <label>Имя владельца</label>
            <input
              type="text"
              name="name"
              className="glass-input"
              placeholder="IVAN IVANOV"
              value={cardData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Срок действия</label>
              <input
                type="text"
                name="expiry"
                className="glass-input"
                placeholder="ММ/ГГ"
                value={cardData.expiry}
                onChange={handleChange}
                maxLength="5"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>CVV</label>
              <input
                type="password"
                name="cvv"
                className="glass-input"
                placeholder="***"
                value={cardData.cvv}
                onChange={handleChange}
                maxLength="3"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-pay" disabled={loading}>
            {loading ? "Обработка платежа..." : `Оплатить ${totalPrice.toLocaleString()} ₽`}
          </button>
        </form>
      </div>

      <div className="checkout-summary-panel">
        <h2 style={{ marginTop: 0, fontSize: '1.3rem', marginBottom: '20px' }}>Ваш заказ</h2>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          {cart.items.map(item => (
            <div key={item.cart_item_id} style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7, marginTop: '3px' }}>
                <span>{item.quantity} шт. × {Number(item.finalPrice).toLocaleString()} ₽</span>
                <span>{(item.quantity * Number(item.finalPrice)).toLocaleString()} ₽</span>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-item">
          <span>Скидка на товары:</span>
          <span style={{ color: '#4ade80' }}>
            -{(cart.items.reduce((acc, item) => acc + (Number(item.price) - Number(item.finalPrice)) * item.quantity, 0)).toLocaleString()} ₽
          </span>
        </div>
        
        {user && user.personal_discount_percent > 0 && (
          <div className="summary-item">
            <span>Ваша персональная скидка:</span>
            <span style={{ color: '#4ade80' }}>{user.personal_discount_percent}%</span>
          </div>
        )}

        <div className="summary-total">
          <span>Итого:</span>
          <span>{totalPrice.toLocaleString()} ₽</span>
        </div>
      </div>
    </div>
  );
}