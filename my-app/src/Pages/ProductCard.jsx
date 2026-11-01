import { userContext } from "./Context/UserContext";
import { cartContext } from "./Context/CartContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, removeFromCart } from "../api/cart";
import "./css/ProductCard.css";

export default function ProductCard({ product }) {
  const { cart, fetchCart } = useContext(cartContext);
  const { user, token } = useContext(userContext);
  const navigate = useNavigate();

  const cartItem = cart.items?.find((item) => item.service === product.name);
  const count = cartItem ? cartItem.quantity : 0;

  const originalPrice = Number(product.price);

  async function handleAdd() {
    if (!user) {
      alert("Войдите в систему, чтобы добавить услугу.");
      return;
    }
    try {
      await addToCart(product.name, token);
      await fetchCart();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemove() {
    if (!cartItem) return;
    try {
      await removeFromCart(cartItem.service, token);
      await fetchCart();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <article className="pc-card">
      <div className="pc-card__body">
        <h2 className="pc-card__title">{product.name}</h2>
        <p>{product.description}</p>
        <p>{product.duration_minutes} мин.</p>
        <button className="btn-edit" onClick={() => navigate(`/reviews?service=${encodeURIComponent(product.name)}`)}>
          Отзывы
        </button>

        <div className="pc-card__price-row">
          <span className="pc-card__price">
            {originalPrice.toLocaleString("ru-RU")}
          </span>
          <span className="pc-card__currency">₽</span>
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