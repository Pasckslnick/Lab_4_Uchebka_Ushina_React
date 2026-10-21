import { useState, useEffect } from 'react';
import './css/AdminCategories.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ id: null, name: '', description: '' });
  const [formError, setFormError] = useState(null);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/get_cars_category');
      if (!response.ok) {
        if (response.status === 404) {
           setCategories([]);
           return;
        }
        throw new Error('Ошибка загрузки категорий');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const isEditing = !!formData.id;
    const url = isEditing 
      ? `http://localhost:3001/api/update_cars_category/${formData.id}` 
      : 'http://localhost:3001/api/add_cars_category';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка сохранения');

      setFormData({ id: null, name: '', description: '' });
      loadCategories();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(category) {
    setFormData(category);
  }

  async function handleDelete(id) {
    if (!window.confirm('Вы уверены? Машины из этой категории станут "Без категории".')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/delete_cars_category/${id}`, {
        method: 'GET'
      });
      if (!response.ok) throw new Error('Ошибка удаления');
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="admin-cat-page"><h2>Загрузка...</h2></div>;
  if (error) return <div className="admin-cat-page"><h2 style={{ color: 'red' }}>{error}</h2></div>;

  return (
    <div className="admin-cat-page">
      <h1 className="admin-title">Управление категориями</h1>

      <div className="glass-panel">
        <h2>{formData.id ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
        
        {formError && <p style={{ color: '#ff6b9d', marginBottom: '15px' }}>{formError}</p>}

        <form onSubmit={handleSubmit} className="cat-form">
          <input
            className="glass-input"
            type="text"
            name="name"
            placeholder="Название (например: Кроссоверы)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            className="glass-input"
            type="text"
            name="description"
            placeholder="Описание категории"
            value={formData.description}
            onChange={handleChange}
          />
          <button type="submit" className="btn-primary">
            {formData.id ? 'Обновить' : 'Добавить'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>Список категорий</h2>
        {categories.length === 0 ? (
          <p>Категорий нет</p>
        ) : (
          <div className="cats-list">
            {categories.map(c => (
              <div key={c.id} className="cat-item">
                <div className="cat-info">
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-desc">{c.description || 'Без описания'}</div>
                </div>
                <div className="cat-actions">
                  <button className="btn-edit" onClick={() => handleEdit(c)}>Изменить</button>
                  <button className="btn-delete" onClick={() => handleDelete(c.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}