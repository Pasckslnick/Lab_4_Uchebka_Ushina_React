const API_URL = 'http://localhost:3001/api';

export async function getUserCart(token) {
    const response = await fetch(`${API_URL}/get_user_cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Ошибка загрузки корзины');
    return await response.json();
}

export async function addToCart(service_id, token) {
    const response = await fetch(`${API_URL}/add_to_cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ service_id, quantity: 1 })
    });
    if (!response.ok) throw new Error('Ошибка добавления в корзину');
    return await response.json();
}

export async function removeFromCart(cart_item_id, token) {
    const response = await fetch(`${API_URL}/remove_from_cart/${cart_item_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Ошибка удаления');
    return await response.json();
}

export async function checkout(token) {
    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка оформления');
    return data;
}

export async function updateCartQuantity(cart_item_id, quantity, token) {
    const response = await fetch(`http://localhost:3001/api/update_cart_quantity/${cart_item_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
    });
    if (!response.ok) throw new Error('Ошибка изменения количества');
    return await response.json();
}