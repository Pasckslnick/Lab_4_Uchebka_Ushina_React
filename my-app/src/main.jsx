import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./Pages/Context/CartContext";
import { UserProvider } from "./Pages/Context/UserContext";

createRoot(document.getElementById("root")).render(
  <UserProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </UserProvider>
);