import { useContext } from "react";
import { cartContext } from "./Context/CartContext";
import { userContext } from "./Context/UserContext";
import "./css/Card.css";

export default function Cart() {
  const { cart, removeFromCart, decreaseQuantity, increaseQuantity } = useContext(cartContext);
  const { user } = useContext(userContext);

  let totalSavings = 0;
  if (cart.items) {
    cart.items.forEach((item) => {
      const oldPrice = Number(item.price);
      const newPrice = Number(item.finalPrice);
      let itemDiscount = (oldPrice - newPrice) * item.quantity;
      const personalDiscountPercent = user?.personal_discount_percent || 0;
      let personalDiscount = newPrice * (personalDiscountPercent / 100) * item.quantity;
      totalSavings += itemDiscount + personalDiscount;
    });
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Корзина пуста</h2>
        <p>Добавьте товары из каталога</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <h1>Корзина</h1>
      
      {user && user.personal_discount_percent > 0 && (
        <div style={{ background: 'rgba(74, 222, 128, 0.2)', border: '1px solid #4ade80', padding: '10px 15px', borderRadius: '10px', marginBottom: '20px', color: '#4ade80' }}>
          У вас активна персональная скидка: <strong>{user.personal_discount_percent}%</strong>
        </div>
      )}

      <ul className="cart__list">
        {cart.items.map((item) => (
          <li key={item.cart_item_id} className="cart__item">
            <img src={item.image_url} alt={item.name} className="cart__img" />
            
            <div className="cart__info">
              <h3>{item.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.finalPrice < Number(item.price) ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#888' }}>
                      {Number(item.price).toLocaleString()} ₽
                    </span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                      {Number(item.finalPrice).toLocaleString()} ₽
                    </span>
                  </>
                ) : (
                  <span>{Number(item.price).toLocaleString()} ₽</span>
                )}
              </div>
            </div>

            <div className="quantity-control">
              <button 
                className="qty-btn"
                onClick={() => decreaseQuantity(item.cart_item_id, item.quantity)}
              >
                −
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button 
                className="qty-btn"
                onClick={() => increaseQuantity(item.cart_item_id, item.quantity)}
              >
                +
              </button>
            </div>

            <button 
              className="btn-remove-all" 
              onClick={() => removeFromCart(item.cart_item_id)}
            >
              Удалить всё
            </button>
          </li>
        ))}
      </ul>

      <div className="cart__footer">
        <div style={{ marginBottom: '15px' }}>
          {totalSavings > 0 && (
            <p style={{ color: '#4ade80', fontSize: '1.2rem', margin: '5px 0' }}>
              Ваша экономия: <strong>{totalSavings.toLocaleString("ru-RU")} ₽</strong>
            </p>
          )}
          <h2>Итого к оплате: {Number(cart.total_price).toLocaleString()} ₽</h2>
        </div>

        <button 
            className="cart__clear"
            onClick={() => { navigation.navigate('/checkout'); }}
            style={{ width: '100%', padding: '15px', background: '#007bff', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          Оформить заказ
        </button>
      </div>
    </div>
  );
}