import { useEffect, useState } from "react";
import {
  addCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../../api/cars";
import "./css/AdminCategories.css";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ id: null, name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setCategories(await getAllCategories());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };
      if (!payload.name) throw new Error("Название категории обязательно");
      if (formData.id) await updateCategory(formData.id, payload);
      else await addCategory(payload);
      setFormData({ id: null, name: "", description: "" });
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить категорию?")) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <div className="admin-cat-page"><h2>Загрузка...</h2></div>;

  return (
    <div className="admin-cat-page">
      <h1 className="admin-title">Управление категориями</h1>
      {error && <p style={{ color: "#ff6b9d" }}>{error}</p>}
      <div className="glass-panel">
        <h2>{formData.id ? "Редактировать категорию" : "Добавить категорию"}</h2>
        <form onSubmit={handleSubmit} className="cat-form">
          <input
            className="glass-input"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            maxLength={100}
            placeholder="Название"
            required
          />
          <input
            className="glass-input"
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            placeholder="Описание"
          />
          <button type="submit" className="btn-primary">
            {formData.id ? "Обновить" : "Добавить"}
          </button>
        </form>
      </div>
      <div className="glass-panel">
        {categories.map((category) => (
          <div key={category.id} className="cat-item">
            <div className="cat-info">
              <div className="cat-name">{category.name}</div>
              <div className="cat-desc">{category.description || "Без описания"}</div>
            </div>
            <div className="cat-actions">
              <button className="btn-edit" onClick={() => setFormData(category)}>Изменить</button>
              <button className="btn-delete" onClick={() => handleDelete(category.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
