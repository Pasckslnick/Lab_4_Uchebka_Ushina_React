import { useEffect, useState } from "react";
import {
  addService,
  deleteService,
  getAllCategories,
  getAllServices,
  updateService,
} from "../../api/cars";
import "./css/AdminCars.css";

const emptyService = {
  id: null,
  name: "",
  description: "",
  price: "",
  category_id: "",
  duration_minutes: "",
  is_available: true,
};

export default function AdminCars() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyService);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [serviceData, categoryData] = await Promise.all([
        getAllServices(),
        getAllCategories(),
      ]);
      setServices(serviceData);
      setCategories(categoryData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category_id: Number(formData.category_id),
      duration_minutes: Number(formData.duration_minutes),
      is_available: formData.is_available,
    };

    if (!payload.name || !payload.description || !payload.category_id ||
        !Number.isFinite(payload.price) || payload.price < 0 ||
        !Number.isInteger(payload.duration_minutes) || payload.duration_minutes <= 0) {
      setFormError("Заполните все поля и проверьте цену и длительность услуги.");
      return;
    }

    try {
      if (formData.id) await updateService(formData.id, payload);
      else await addService(payload);
      setFormData(emptyService);
      await loadData();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить услугу?")) return;
    try {
      await deleteService(id);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <div className="admin-page"><h2>Загрузка услуг...</h2></div>;
  if (error) return <div className="admin-page"><h2 style={{ color: "red" }}>Ошибка: {error}</h2></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-title">Управление услугами</h1>
      <div className="glass-panel">
        <h2>{formData.id ? "Редактировать услугу" : "Добавить услугу"}</h2>
        {formError && <p style={{ color: "#ff6b9d" }}>{formError}</p>}
        <form onSubmit={handleSubmit} className="admin-form">
          <input className="glass-input" name="name" placeholder="Название услуги"
            value={formData.name} onChange={handleChange} maxLength={150} required />
          <textarea className="glass-input full-width" name="description"
            placeholder="Описание услуги" value={formData.description}
            onChange={handleChange} maxLength={2000} required />
          <input className="glass-input" type="number" name="price"
            placeholder="Цена, ₽" min="0" step="0.01"
            value={formData.price} onChange={handleChange} required />
          <input className="glass-input" type="number" name="duration_minutes"
            placeholder="Длительность, минут" min="1" step="1"
            value={formData.duration_minutes} onChange={handleChange} required />
          <select className="glass-input" name="category_id"
            value={formData.category_id} onChange={handleChange} required>
            <option value="" style={{ color: "black" }}>Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} style={{ color: "black" }}>
                {category.name}
              </option>
            ))}
          </select>
          <label>
            <input type="checkbox" name="is_available"
              checked={formData.is_available} onChange={handleChange} />
            {" "}Услуга доступна
          </label>
          <button type="submit" className="btn-primary">
            {formData.id ? "Сохранить изменения" : "Добавить услугу"}
          </button>
          {formData.id && (
            <button type="button" className="btn-edit" onClick={() => setFormData(emptyService)}>
              Отмена
            </button>
          )}
        </form>
      </div>
      <div className="glass-panel">
        <h2>Список услуг</h2>
        {services.length === 0 ? <p>Услуг пока нет.</p> : (
          <div className="cars-list">
            {services.map((service) => (
              <div key={service.id} className="car-item">
                <div className="car-item-header">
                  <span className="car-name">{service.name}</span>
                  <span>{service.is_available ? "Доступна" : "Недоступна"}</span>
                </div>
                <p>{service.description}</p>
                <div className="car-info">
                  <p>{Number(service.price).toLocaleString("ru-RU")} ₽</p>
                  <p>{service.duration_minutes} мин.</p>
                  <p>{service.category}</p>
                </div>
                <div className="car-actions">
                  <button className="btn-edit" onClick={() => setFormData(service)}>Изменить</button>
                  <button className="btn-delete" onClick={() => handleDelete(service.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
