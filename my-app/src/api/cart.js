import { API_URL } from './auth';

function authHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}

async function request(path, token, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token),
            ...options.headers,
        },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка запроса корзины');
    }

    return data;
}

export function getUserCart(token) {
    return request('/cart', token);
}

export function addToCart(serviceName, token, quantity = 1) {
    if (!serviceName?.trim() || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Укажите услугу и положительное количество');
    }

    return request('/cart/items', token, {
        method: 'POST',
        body: JSON.stringify({ service_name: serviceName.trim(), quantity }),
    });
}

export function removeFromCart(serviceName, token) {
    return request(`/cart/items/${encodeURIComponent(serviceName)}`, token, {
        method: 'DELETE',
    });
}

export function updateCartQuantity(serviceName, quantity, token) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Количество должно быть положительным целым числом');
    }

    return request(`/cart/items/${encodeURIComponent(serviceName)}`, token, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
    });
}

export function clearCart(token) {
    return request('/cart', token, { method: 'DELETE' });
}

export function checkout(token, deliveryAddress, deliveryDate) {
    if (!deliveryAddress?.trim()) {
        throw new Error('Укажите адрес доставки');
    }

    if (!deliveryDate) {
        throw new Error('Укажите дату доставки');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
        throw new Error('Некорректная дата доставки');
    }

    const [year, month, day] = deliveryDate.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const today = new Date();
    const todayValue = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    if (month < 1 || month > 12 || day < 1 || day > daysInMonth ||
        Date.UTC(year, month - 1, day) < todayValue) {
        throw new Error('Дата доставки не может быть в прошлом или некорректна');
    }

    return request('/orders/checkout', token, {
        method: 'POST',
        body: JSON.stringify({
            delivery_address: deliveryAddress.trim(),
            delivery_date: deliveryDate,
        }),
    });
}
