import { useEffect, useState, useContext } from "react";
import { userContext } from "../Context/UserContext";
import "./css/AdminUsers.css";

const API_URL = "http://localhost:3001/api";

export default function AdminUsers() {
  const { token } = useContext(userContext);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка загрузки пользователей");
      setUsers(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  async function updateUser(email, changes) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка обновления пользователя");
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="admin-users-page">
      <h1 className="admin-title">Управление пользователями</h1>
      {error && <p style={{ color: "#ff6b9d" }}>{error}</p>}
      <div className="glass-panel">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-header">
              <div>
                <div className="user-name">{user.full_name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <span className="badge-role">
                {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
              </span>
            </div>
            <p>{user.phone}</p>
            <p>{user.is_active ? "Аккаунт активен" : "Аккаунт заблокирован"}</p>
            <button
              className="btn-primary"
              onClick={() => updateUser(user.email, { is_active: !user.is_active })}
            >
              {user.is_active ? "Заблокировать" : "Разблокировать"}
            </button>
            <button
              className="btn-edit"
              onClick={() => updateUser(user.email, {
                role: user.role === "ADMIN" ? "USER" : "ADMIN",
              })}
            >
              Сделать {user.role === "ADMIN" ? "пользователем" : "администратором"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
