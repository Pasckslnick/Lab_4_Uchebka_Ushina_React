const API_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка запроса');
    }

    return data;
}

export function login(email, password) {
    if (!email?.trim() || !password) {
        throw new Error('Введите email и пароль');
    }

    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
    });
}

export function register({ full_name, email, password, phone, default_address }) {
    if (!full_name?.trim() || !email?.trim() || !password || !phone?.trim()) {
        throw new Error('Заполните ФИО, email, пароль и телефон');
    }

    if (password.length < 8 || password.length > 72) {
        throw new Error('Пароль должен содержать от 8 до 72 символов');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Некорректный email');
    }

    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone.trim())) {
        throw new Error('Укажите корректный телефон');
    }

    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            full_name: full_name.trim(),
            email: email.trim(),
            password,
            phone: phone.trim(),
            default_address: default_address?.trim() || undefined,
        }),
    });
}

export function getCurrentUser(token) {
    return request('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export function updateProfile(token, profile) {
    return request('/auth/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
    });
}

export function changePassword(token, currentPassword, newPassword) {
    if (!currentPassword || newPassword?.length < 8 || newPassword.length > 72) {
        throw new Error('Проверьте текущий и новый пароль');
    }

    return request('/auth/change-password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
        }),
    });
}

export function requestPasswordReset(email) {
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Укажите корректный email');
    }

    return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
    });
}

export function verifyResetCode(email, code) {
    if (!email?.trim() || !/^\d{6}$/.test(code?.trim() || '')) {
        throw new Error('Введите шестизначный код из письма');
    }

    return request('/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
    });
}

export function resetPassword(resetToken, newPassword) {
    if (!resetToken || newPassword?.length < 8 || newPassword.length > 72) {
        throw new Error('Пароль должен содержать от 8 до 72 символов');
    }

    return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
            reset_token: resetToken,
            new_password: newPassword,
        }),
    });
}

export { API_URL };
