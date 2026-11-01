import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { getAllServices, getAllCategories } from "../api/cars";
import "./css/Home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, catsData] = await Promise.all([
          getAllServices(),
          getAllCategories()
        ]);
        setProducts(servicesData);
        setCategories(catsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCategoryChange = (categoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    const price = Number(p.price);
    const matchMin = minPrice === "" || price >= Number(minPrice);
    const matchMax = maxPrice === "" || price <= Number(maxPrice);
    
    return matchCategory && matchMin && matchMax;
  });

  if (loading) return <h2 style={{ textAlign: "center", marginTop: "50px" }}>Загрузка каталога...</h2>;
  if (error) return <h2 style={{ textAlign: "center", marginTop: "50px", color: "red" }}>{error}</h2>;

  return (
    <div className="catalog-layout">
      <aside className="catalog-aside glass-panel">
        <h3>Фильтры</h3>
        
        <div className="filter-section">
          <h4>Категории</h4>
          <div className="filter-list">
            {categories.map((cat) => (
              <label key={cat.name} className="filter-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.name)}
                  onChange={() => handleCategoryChange(cat.name)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Цена, ₽</h4>
          <div className="price-inputs">
            <input
              type="number"
              placeholder="От"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="price-input"
            />
            <span>—</span>
            <input
              type="number"
              placeholder="До"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="price-input"
            />
          </div>
        </div>
      </aside>

      <main className="catalog-main">
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <p>Услуги не найдены</p>
          ) : (
            filteredProducts.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 0.08}s` }}>
                <ProductCard product={p} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}