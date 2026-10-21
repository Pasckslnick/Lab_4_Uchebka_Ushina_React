import { userContext } from "./Context/UserContext";
import { cartContext } from "./Context/CartContext";
import { useContext } from "react";
import { addToCart, removeFromCart } from "../api/cart";
import "./css/ProductCard.css";

export default function ProductCard({ product }) {
  const { cart, fetchCart } = useContext(cartContext);
  const { user, token } = useContext(userContext);

  const cartItem = cart.items?.find((item) => item.service_id === product.id);
  const count = cartItem ? cartItem.quantity : 0;

  const originalPrice = Number(product.price);
  const hasDiscount = product.is_discounted && Number(product.discount_percent) > 0;
  const discountAmount = hasDiscount ? originalPrice * (Number(product.discount_percent) / 100) : 0;
  const finalPrice = originalPrice - discountAmount;

  async function handleAdd() {
    if (!user) {
      alert("Войдите в систему, чтобы добавить товар.");
      return;
    }
    try {
      await addToCart(product.id, token);
      await fetchCart();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemove() {
    if (!cartItem) return;
    try {
      await removeFromCart(cartItem.cart_item_id, token);
      await fetchCart();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <article className="pc-card">
      <div className="pc-card__media">
        <img className="pc-card__image" src={product.image_url} alt={product.name} />
        <div className="pc-card__overlay" />
        {/* Бейдж со скидкой поверх картинки */}
        {hasDiscount && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#e52e71',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: '0 2px 10px rgba(229, 46, 113, 0.5)'
          }}>
            -{product.discount_percent}%
          </div>
        )}
      </div>

      <div className="pc-card__body">
        <h2 className="pc-card__title">{product.name}</h2>

        <div className="pc-card__price-row">
          {hasDiscount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Зачеркнутая старая цена */}
              <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9rem' }}>
                {originalPrice.toLocaleString("ru-RU")} ₽
              </span>
              {/* Новая цена */}
              <span className="pc-card__price" style={{ color: '#4ade80' }}>
                {finalPrice.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          ) : (
            <>
              <span className="pc-card__price">
                {originalPrice.toLocaleString("ru-RU")}
              </span>
              <span className="pc-card__currency">₽</span>
            </>
          )}
        </div>

        <div className="pc-card__stepper">
          <button className="pc-card__step" onClick={handleRemove}>−</button>
          <span className="pc-card__step-count">{count > 0 ? `${count} в корзине` : "Добавить"}</span>
          <button className="pc-card__step" onClick={handleAdd}>+</button>
        </div>
      </div>
    </article>
  );
}