import { API_URL } from './auth';

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка запроса каталога');
    }

    return data;
}

function adminHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
}

export function getAllServices(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();
    return request(`/services${query ? `?${query}` : ''}`);
}

export function getAllCategories() {
    return request('/categories');
}

export function addCategory(categoryData) {
    return request('/categories', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(categoryData),
    });
}

export function updateCategory(id, categoryData) {
    return request(`/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(categoryData),
    });
}

export function deleteCategory(id) {
    return request(`/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: adminHeaders(),
    });
}

export function addService(serviceData) {
    return request('/services', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(serviceData),
    });
}

export function updateService(id, serviceData) {
    return request(`/services/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(serviceData),
    });
}

export function deleteService(id) {
    return request(`/services/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: adminHeaders(),
    });
}
