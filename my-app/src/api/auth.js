const API_URL = 'http://localhost:3001/api';

export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        throw new Error('Неверный email или пароль');
    }
    return await response.json();
}