import { createContext, useState, useEffect, useContext } from "react";
import { userContext } from "./UserContext";
import { getUserCart, removeFromCart as apiRemove, updateCartQuantity } from "../../api/cart";

export const cartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const { token } = useContext(userContext);

  const fetchCart = async () => {
    if (!token) return setCart({ items: [], total: 0 });
    try {
      const data = await getUserCart(token);
      setCart(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchCart(); }, [token]);

  const removeFromCart = async (serviceName) => {
    try {
      await apiRemove(serviceName, token);
      await fetchCart();
    } catch (err) { alert(err.message); }
  };

  const decreaseQuantity = async (serviceName, currentQuantity) => {
    try {
      if (currentQuantity <= 1) return;
      await updateCartQuantity(serviceName, currentQuantity - 1, token);
      await fetchCart();
    } catch (err) { alert(err.message); }
  };

  const increaseQuantity = async (serviceName, currentQuantity) => {
    try {
      await updateCartQuantity(serviceName, currentQuantity + 1, token);
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