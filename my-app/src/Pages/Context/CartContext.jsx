import { createContext, useState, useEffect, useContext } from "react";
import { userContext } from "./UserContext";
import { getUserCart, removeFromCart as apiRemove, updateCartQuantity } from "../../api/cart";

export const cartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const { token } = useContext(userContext);

  const fetchCart = async () => {
    if (!token) return setCart({ items: [], total_price: 0 });
    try {
      const data = await getUserCart(token);
      setCart(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchCart(); }, [token]);

  const removeFromCart = async (cart_item_id) => {
    try {
      await apiRemove(cart_item_id, token);
      await fetchCart();
    } catch (err) { alert(err.message); }
  };

  const decreaseQuantity = async (cart_item_id, currentQuantity) => {
    try {
      await updateCartQuantity(cart_item_id, currentQuantity - 1, token);
      await fetchCart();
    } catch (err) { alert(err.message); }
  };

  const increaseQuantity = async (cart_item_id, currentQuantity) => {
    try {
      await updateCartQuantity(cart_item_id, currentQuantity + 1, token);
      await fetchCart();
    } catch (err) { alert(err.message); }
  };

  return (
    <cartContext.Provider value={{ 
        cart, 
        fetchCart, 
        removeFromCart, 
        decreaseQuantity, 
        increaseQuantity 
    }}>
      {children}
    </cartContext.Provider>
  );
}