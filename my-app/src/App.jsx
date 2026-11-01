import {
  BrowserRouter,
  NavLink,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Pages/Home";
import Cart from "./Pages/Card";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ForgotPassword from "./Pages/ForgotPassword";
import VerifyResetCode from "./Pages/VerifyResetCode";
import ResetPassword from "./Pages/ResetPassword";
import AdminCars from "./Pages/AdminPages/AdminCars";
import Profile from "./Pages/Profile";
import AccountSettings from "./Pages/AccountSettings";
import AdminDashboard from "./Pages/AdminPages/AdminDashboard";
import AdminUsers from "./Pages/AdminPages/AdminUsers";
import AdminCategories from "./Pages/AdminPages/AdminCategories";
import AdminOrders from "./Pages/AdminPages/AdminOrders";
import Orders from "./Pages/Orders";
import Checkout from "./Pages/Checkout";
import Reviews from "./Pages/Reviews";
import GlassFilter from "./components/GlassFilter";
import { cartContext } from "./Pages/Context/CartContext";
import { StyleProvider, styleContext } from "./Pages/Context/StyleContext";
import { userContext } from "./Pages/Context/UserContext";
import "./index.css";
import "./Pages/css/Glass.css";
import "./App.css";

function CartRoute({ user }) {
  if (user?.role === "ADMIN") {
    return <Navigate to="/home" replace />;
  }
  return <Cart />;
}

function Nav() {
  const { cart } = useContext(cartContext);
  const { theme, toggleTheme } = useContext(styleContext);
  const { user, logout } = useContext(userContext);
  const navigate = useNavigate();
  const cartCount = cart.items
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const location = useLocation();

  if (["/login", "/register", "/forgot-password", "/verify-reset-code", "/reset-password"].includes(location.pathname))
    return null;

  return (
    <nav className="app-nav">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          "app-nav__link" + (isActive ? " app-nav__link--active" : "")
        }
      >
        Главная
      </NavLink>

      {user?.role !== "ADMIN" && (
        <NavLink
          to="/cart"
          className={({ isActive }) =>
            "app-nav__link" + (isActive ? " app-nav__link--active" : "")
          }
        >
          Корзина{" "}
          {cartCount > 0 && <span className="app-nav__badge">{cartCount}</span>}
        </NavLink>
      )}

      <NavLink to="/reviews" className={({ isActive }) => "app-nav__link" + (isActive ? " app-nav__link--active" : "")}>
        Отзывы
      </NavLink>

      {user && (
        <NavLink to="/orders" className={({ isActive }) => "app-nav__link" + (isActive ? " app-nav__link--active" : "")}>
          Заказы
        </NavLink>
      )}

      {user ? (
        <div className="app-nav__info">
          <div className="app-nav__info-item">
            <NavLink
              to={user ? "/profile" : "/login"}
              className={({ isActive }) =>
                "app-nav__link" + (isActive ? " app-nav__link--active" : "")
              }
            >
              <span>Пользователь: {user ? user.full_name : "Гость"} </span>
            </NavLink>
          </div>
        </div>
      ) : (
        <NavLink to="/login" className="app-nav__link">
          Войти
        </NavLink>
      )}

      {user && (
        <NavLink to="/settings" className={({ isActive }) => "app-nav__link" + (isActive ? " app-nav__link--active" : "")}>
          Настройки
        </NavLink>
      )}

      {user && <button className="nav-logout" onClick={() => { logout(); navigate("/"); }}>Выйти</button>}

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </nav>
  );
}

export default function App() {
  const { user } = useContext(userContext);

  return (
    <StyleProvider>
      <GlassFilter />
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-code" element={<VerifyResetCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartRoute user={user} />} />
          <Route path="/admin/cars" element={<AdminCars />} />
          <Route path="/admin/" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/reviews" element={<Reviews />} />
        </Routes>
      </BrowserRouter>
    </StyleProvider>
  );
}
