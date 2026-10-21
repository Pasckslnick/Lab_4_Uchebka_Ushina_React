import { useState, useEffect } from "react";
import {
  getAllCars,
  getAllCategories,
  addCar,
  updateCar,
  deleteCar,
} from "../../api/cars";
import "./css/AdminCars.css";

export default function AdminCars() {
  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    category_id: "",
    duration_minutes: "",
    is_discounted: false,
    discount_percent: 0,
    image_url: "",
  });

  const [formError, setFormError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [carsData, catData] = await Promise.all([
        getAllCars(),
        getAllCategories(),
      ]);
      setCars(carsData);
      setCategories(catData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateCar(formData.id, formData);
      } else {
        await addCar(formData);
      }
      setFormData({
        id: null,
        name: "",
        description: "",
        price: "",
        category_id: "",
        duration_minutes: "",
        is_discounted: false,
        discount_percent: 0,
        image_url: "",
      });
      setFormError(null);
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleEdit(car) {
    setFormData(car);
  }

  async function handleDelete(id) {
    if (!window.confirm("Вы уверены, что хотите удалить эту машину?")) return;
    try {
      await deleteCar(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading)
    return (
      <div className="admin-page">
        <h2>Загрузка данных...</h2>
      </div>
    );
  if (error)
    return (
      <div className="admin-page">
        <h2 style={{ color: "red" }}>Ошибка: {error}</h2>
      </div>
    );

  return (
    <div className="admin-page">
      <h1 className="admin-title">Управление автопарком</h1>

      <div className="glass-panel">
        <h2>
          {formData.id ? "Редактировать машину" : "Добавить новую машину"}
        </h2>

        {formError && (
          <p style={{ color: "#ff6b9d", marginBottom: "15px" }}>
            Ошибка: {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <input
            className="glass-input"
            type="text"
            name="name"
            placeholder="Название (Zeekr 001)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            className="glass-input"
            type="number"
            name="price"
            placeholder="Цена (в рублях)"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <select
            className="glass-input"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
          >
            <option value="" style={{ color: "black" }}>
              Выберите категорию
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} style={{ color: "black" }}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            className="glass-input"
            type="number"
            name="duration_minutes"
            placeholder="Запас хода (км)"
            value={formData.duration_minutes}
            onChange={handleChange}
            required
          />

          <input
            className="glass-input full-width"
            type="text"
            name="description"
            placeholder="Описание"
            value={formData.description}
            onChange={handleChange}
          />

          <input
            className="glass-input full-width"
            type="text"
            name="image_url"
            placeholder="Ссылка на картинку (URL)"
            value={formData.image_url}
            onChange={handleChange}
          />

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="is_discounted"
                checked={formData.is_discounted}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              Есть скидка?
            </label>
            {formData.is_discounted && (
              <input
                className="glass-input"
                type="number"
                name="discount_percent"
                placeholder="Скидка %"
                value={formData.discount_percent}
                onChange={handleChange}
                style={{ width: "100px" }}
              />
            )}
          </div>

          <button type="submit" className="btn-primary">
            {formData.id ? "Обновить" : "Добавить"}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h2>Список автомобилей</h2>
        {cars.length === 0 ? (
          <p>Машин нет</p>
        ) : (
          <div className="cars-list">
            {cars.map((car) => (
              <div key={car.id} className="car-item">
                <img className="car-image" src={car.image_url} alt={car.name} />
                <div className="car-item-header">
                  <span className="car-name">{car.name}</span>
                  {car.is_discounted && (
                    <span className="badge-discount">
                      -{car.discount_percent}%
                    </span>
                  )}
                </div>
                <div className="car-info">
                  <p>💰 {Number(car.price).toLocaleString()} ₽</p>
                  <p>🔋 Запас хода: {car.duration_minutes} км</p>
                </div>
                <div className="car-actions">
                  <button className="btn-edit" onClick={() => handleEdit(car)}>
                    Редактировать
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(car.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
