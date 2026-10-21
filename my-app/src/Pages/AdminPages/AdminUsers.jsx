import { useState, useEffect } from 'react';
import './css/AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState({ id: null, value: '' });

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/get_all_users');
      if (!response.ok) throw new Error('Ошибка загрузки пользователей');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Сохранение скидки
  async function handleSaveDiscount(userId) {
    try {
      const response = await fetch(`http://localhost:3001/api/update_user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: editingDiscount.value })
      });
      
      if (!response.ok) throw new Error('Ошибка обновления скидки');
      
      setEditingDiscount({ id: null, value: '' });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  // Сохранение роли
  async function handleRoleChange(userId, newRoleId) {
    if (!window.confirm('Вы уверены, что хотите изменить роль этого пользователя?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/update_user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: Number(newRoleId) }) 
      });
      
      if (!response.ok) throw new Error('Ошибка обновления роли');
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  function startEditDiscount(user) {
    setEditingDiscount({ id: user.id, value: user.personal_discount_percent });
  }

  if (loading) return <div className="admin-users-page"><h2>Загрузка...</h2></div>;
  if (error) return <div className="admin-users-page"><h2 style={{ color: 'red' }}>{error}</h2></div>;

  return (
    <div className="admin-users-page">
      <h1 className="admin-title">Управление клиентами</h1>

      <div className="glass-panel">
        <h2>Список пользователей</h2>
        
        {users.length === 0 ? (
          <p>Пользователей нет</p>
        ) : (
          <div className="users-list">
            {users.map(u => (
              <div key={u.id} className="user-card">
                <div className="user-header">
                  <div>
                    <div className="user-name">{u.full_name || 'Без имени'}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  
                  {u.role_id === 1 ? (
                    <span className="badge-role badge-admin">Админ</span>
                  ) : (
                    <span className="badge-role badge-user">Клиент</span>
                  )}
                </div>

                {/* Блок изменения роли */}
                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="discount-label">Роль:</span>
                  <select 
                    value={u.role_id} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="discount-input"
                    style={{ width: '120px', cursor: 'pointer' }}
                  >
                    <option value={1} style={{ color: 'black' }}>Админ</option>
                    <option value={2} style={{ color: 'black' }}>Клиент</option>
                  </select>
                </div>

                {/* Блок изменения скидки */}
                <div className="user-discount">
                  {editingDiscount.id === u.id ? (
                    <div className="discount-form">
                      <input 
                        type="number" 
                        className="discount-input"
                        min="0"
                        max="100"
                        value={editingDiscount.value}
                        onChange={(e) => setEditingDiscount({ ...editingDiscount, value: e.target.value })}
                      />
                      <button 
                        className="btn-save-discount"
                        onClick={() => handleSaveDiscount(u.id)}
                      >
                        Сохранить
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="discount-label">Скидка:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="discount-value">{u.personal_discount_percent}%</span>
                        <button 
                          onClick={() => startEditDiscount(u)}
                          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Изменить
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}