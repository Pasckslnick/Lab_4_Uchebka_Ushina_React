import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { cartContext } from "./Context/CartContext";
import { userContext } from "./Context/UserContext";
import "./css/Card.css";

export default function Cart() {
  const { cart, removeFromCart, decreaseQuantity, increaseQuantity } = useContext(cartContext);
  const navigate = useNavigate();

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Корзина пуста</h2>
        <p>Добавьте услуги из каталога</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <h1>Корзина</h1>
      
      <ul className="cart__list">
        {cart.items.map((item) => (
          <li key={item.service} className="cart__item">
            
            <div className="cart__info">
              <h3>{item.service}</h3>
              <span>{Number(item.price).toLocaleString()} ₽</span>
            </div>

            <div className="quantity-control">
              <button 
                className="qty-btn"
                onClick={() => decreaseQuantity(item.service, item.quantity)}
              >
                −
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button 
                className="qty-btn"
                onClick={() => increaseQuantity(item.service, item.quantity)}
              >
                +
              </button>
            </div>

            <button 
              className="btn-remove-all" 
              onClick={() => removeFromCart(item.service)}
            >
              Удалить всё
            </button>
          </li>
        ))}
      </ul>

      <div className="cart__footer">
        <div style={{ marginBottom: '15px' }}>
          <h2>Итого: {Number(cart.total).toLocaleString()} ₽</h2>
        </div>

        <button 
            className="cart__clear"
            onClick={() => navigate('/checkout')}
            style={{ width: '100%', padding: '15px', background: '#007bff', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          Оформить заказ
        </button>
      </div>
    </div>
  );
}