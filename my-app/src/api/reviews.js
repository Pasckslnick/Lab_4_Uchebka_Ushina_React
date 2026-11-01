import { API_URL } from "./auth";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка работы с отзывами");
  return data;
}

export function getReviews(serviceName) {
  return request(`/services/${encodeURIComponent(serviceName)}/reviews`);
}

export function addReview(token, serviceName, rating, comment) {
  return request("/reviews", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ service_name: serviceName, rating, comment }),
  });
}

export function updateReview(token, serviceName, rating, comment) {
  return request(`/reviews/${encodeURIComponent(serviceName)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, comment }),
  });
}

export function deleteReview(token, serviceName) {
  return request(`/reviews/${encodeURIComponent(serviceName)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
