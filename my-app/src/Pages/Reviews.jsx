import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { userContext } from "./Context/UserContext";
import { getAllServices } from "../api/cars";
import {
  addReview,
  deleteReview,
  getReviews,
  updateReview,
} from "../api/reviews";

export default function Reviews() {
  const { user, token } = useContext(userContext);
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const serviceName = params.get("service") || "";

  const loadReviews = async () => {
    if (!serviceName) return setReviews([]);
    try {
      setLoading(true);
      setReviews(await getReviews(serviceName));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllServices()
      .then(setServices)
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    loadReviews();
  }, [serviceName]);

  const ownReview = reviews.find((review) => review.user_id === user?.id);

  function selectService(event) {
    setParams({ service: event.target.value });
  }

  function startEditing() {
    setRating(ownReview.rating);
    setComment(ownReview.comment);
    setEditing(true);
  }

  async function submitReview(event) {
    event.preventDefault();
    setError("");
    if (!token) return setError("Войдите в аккаунт, чтобы оставить отзыв.");
    if (comment.trim().length < 2 || comment.trim().length > 2000) {
      return setError("Комментарий должен содержать от 2 до 2000 символов.");
    }

    try {
      if (editing) await updateReview(token, serviceName, rating, comment.trim());
      else await addReview(token, serviceName, rating, comment.trim());
      setComment("");
      setEditing(false);
      await loadReviews();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeOwnReview() {
    try {
      await deleteReview(token, serviceName);
      await loadReviews();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <h1>Отзывы об услугах</h1>
      <label>
        Выберите услугу:
        <select
          className="glass-input"
          value={serviceName}
          onChange={selectService}
          style={{ margin: "12px 0 24px" }}
        >
          <option value="">Выберите услугу</option>
          {services.map((service) => (
            <option key={service.id} value={service.name}>{service.name}</option>
          ))}
        </select>
      </label>

      {error && <p style={{ color: "#ff6b9d" }}>{error}</p>}
      {!serviceName ? <p>Выберите услугу, чтобы посмотреть отзывы.</p> : (
        <>
          {user && !ownReview && (
            <form onSubmit={submitReview} className="glass-panel">
              <h2>Оставить отзыв</h2>
              <label>
                Оценка:
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <textarea
                className="glass-input"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minLength={2}
                maxLength={2000}
                placeholder="Ваш комментарий"
                required
              />
              <button type="submit" className="btn-primary">Опубликовать отзыв</button>
            </form>
          )}
          {loading ? <p>Загрузка отзывов...</p> : reviews.length === 0 ? (
            <p>Отзывов пока нет.</p>
          ) : reviews.map((review) => (
            <article key={`${review.author}-${review.created_at}`} className="glass-panel">
              <strong>{review.author}</strong>
              <p>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
              <p>{review.comment}</p>
              {ownReview === review && (
                <div>
                  <button className="btn-edit" onClick={startEditing}>Изменить</button>
                  <button className="btn-delete" onClick={removeOwnReview}>Удалить</button>
                </div>
              )}
            </article>
          ))}
          {editing && (
            <form onSubmit={submitReview} className="glass-panel">
              <h2>Изменить отзыв</h2>
              <textarea className="glass-input" value={comment} onChange={(event) => setComment(event.target.value)} />
              <button type="submit" className="btn-primary">Сохранить</button>
              <button type="button" className="btn-edit" onClick={() => setEditing(false)}>Отмена</button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
