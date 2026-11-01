const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

pool.on('connect', () => console.log('Подключение к PostgreSQL установлено'));
pool.on('error', (err) => console.error('Ошибка PostgreSQL:', err));

function isValidId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

function isValidString(value, maxLength = 255) {
    return typeof value === 'string' &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength;
}

function isValidPrice(value) {
    return value !== undefined &&
        value !== null &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Необходима авторизация' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                error: 'Токен недействителен или срок его действия истёк',
            });
        }

        req.user = decoded;
        next();
    });
}

const requireAdmin = async (req, res, next) => {
    const result = await pool.query(
        `SELECT r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [req.user.id]
    );

    if (!result.rows.length) {
        return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
    }

    if (result.rows[0].role !== 'ADMIN') {
        return res.status(403).json({ error: 'Недостаточно прав' });
    }

    next();
};

const adminOnly = [authenticateToken, requireAdmin];

app.get('/api/', (req, res) => {
    res.json({
        message: 'ServiceHub API работает!',
        version: '1.0.0',
    });
});

app.get('/api/test-db', async (req, res) => {
    const result = await pool.query('SELECT NOW() AS time');

    res.json({
        message: 'Подключение к БД работает',
        time: result.rows[0].time,
    });
});

// =====================================================
// РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ
// =====================================================

app.post('/api/auth/register', async (req, res) => {
    const { full_name, email, password, phone, default_address } = req.body;

    if (!isValidString(full_name, 150)) {
        return res.status(400).json({ error: 'Укажите корректное ФИО' });
    }

    if (!isValidString(email, 255) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({
            error: 'Пароль должен содержать от 8 до 72 символов',
        });
    }

    if (!isValidString(phone, 20) ||
        !/^\+?[0-9 ()-]{7,20}$/.test(phone.trim())) {
        return res.status(400).json({ error: 'Укажите корректный телефон' });
    }

    const roleResult = await pool.query(
        `SELECT id FROM roles WHERE name = 'USER'`
    );

    if (!roleResult.rows.length) {
        return res.status(500).json({ error: 'Роль USER не найдена в БД' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
        `INSERT INTO users
            (role_id, full_name, email, password_hash, phone, default_address)
         VALUES ($1, $2, LOWER($3), $4, $5, $6)
         RETURNING id, full_name, email, phone, default_address, created_at`,
        [
            roleResult.rows[0].id,
            full_name.trim(),
            email.trim(),
            passwordHash,
            phone.trim(),
            default_address || null,
        ]
    );

    res.status(201).json({
        message: 'Регистрация прошла успешно',
        user: result.rows[0],
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const result = await pool.query(
        `SELECT
            u.id,
            u.full_name,
            u.email,
            u.password_hash,
            u.phone,
            u.default_address,
            u.is_active,
            r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.email = LOWER($1)`,
        [email.trim()]
    );

    if (!result.rows.length) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
        return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatches) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET не задан в .env');
    }

    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    delete user.password_hash;
    delete user.is_active;

    res.json({
        message: 'Авторизация успешна',
        token,
        user,
    });
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Укажите корректный email' });
    }

    const userResult = await pool.query(
        'SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE',
        [email]
    );

    if (userResult.rows.length) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            return res.status(503).json({
                error: 'Отправка писем не настроена на сервере',
            });
        }

        const code = String(crypto.randomInt(100000, 1000000));
        const codeHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [userResult.rows[0].id, codeHash, expiresAt]
        );

                
        await mailer.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: userResult.rows[0].email,
            subject: 'Восстановление пароля — ServiceHub',

            text: `Ваш код восстановления: ${code}. Код действителен 5 минут. Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.`,

            html: `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Восстановление пароля — ServiceHub</title>
            </head>
            <body style="
                margin: 0;
                padding: 30px 15px;
                background-color: #f4f3f8;
                font-family: Arial, Helvetica, sans-serif;
                color: #29263d;
            ">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center">

                            <table width="100%" cellpadding="0" cellspacing="0"
                                border="0" style="
                                    max-width: 520px;
                                    background: #ffffff;
                                    border-radius: 16px;
                                    overflow: hidden;
                                ">

                                <!-- Шапка -->
                                <tr>
                                    <td align="center" style="
                                        background: #17152b;
                                        padding: 30px 20px;
                                    ">
                                        <h1 style="
                                            margin: 0;
                                            color: #ffffff;
                                            font-size: 30px;
                                            letter-spacing: -1px;
                                        ">
                                            Service<span style="color: #a78bfa;">Hub</span>
                                        </h1>

                                        <p style="
                                            margin: 8px 0 0;
                                            color: #c4b5fd;
                                            font-size: 11px;
                                            letter-spacing: 2px;
                                        ">
                                            ВАШ СЕРВИС. ВАШИ ВОЗМОЖНОСТИ.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Основной контент -->
                                <tr>
                                    <td style="padding: 35px 30px;">

                                        <h2 style="
                                            margin: 0 0 15px;
                                            text-align: center;
                                            font-size: 24px;
                                            color: #29263d;
                                        ">
                                            Восстановление пароля
                                        </h2>

                                        <p style="
                                            margin: 0 0 28px;
                                            text-align: center;
                                            color: #777487;
                                            font-size: 14px;
                                            line-height: 1.6;
                                        ">
                                            Мы получили запрос на восстановление
                                            пароля вашего аккаунта ServiceHub.
                                        </p>

                                        <!-- Блок с кодом -->
                                        <table width="100%" cellpadding="0"
                                            cellspacing="0" border="0"
                                            style="
                                                background: #f3f0ff;
                                                border-radius: 12px;
                                            ">
                                            <tr>
                                                <td align="center" style="padding: 25px 15px;">

                                                    <p style="
                                                        margin: 0 0 12px;
                                                        color: #7866c5;
                                                        font-size: 11px;
                                                        font-weight: bold;
                                                        letter-spacing: 1.5px;
                                                    ">
                                                        ВАШ КОД ПОДТВЕРЖДЕНИЯ
                                                    </p>

                                                    <div style="
                                                        color: #5639b8;
                                                        font-size: 36px;
                                                        font-weight: bold;
                                                        letter-spacing: 8px;
                                                    ">
                                                        ${code}
                                                    </div>

                                                    <p style="
                                                        margin: 12px 0 0;
                                                        color: #77718d;
                                                        font-size: 12px;
                                                    ">
                                                        Код действителен 5 минут
                                                    </p>

                                                </td>
                                            </tr>
                                        </table>

                                        <p style="
                                            margin: 25px 0;
                                            color: #555267;
                                            font-size: 14px;
                                            line-height: 1.7;
                                        ">
                                            Введите этот код на странице
                                            восстановления пароля, чтобы продолжить.
                                        </p>

                                        <hr style="
                                            border: none;
                                            border-top: 1px solid #eeeaf5;
                                            margin: 25px 0;
                                        ">

                                        <p style="
                                            margin: 0;
                                            color: #888598;
                                            font-size: 12px;
                                            line-height: 1.7;
                                        ">
                                            Если вы не запрашивали восстановление
                                            пароля, просто проигнорируйте это письмо.
                                            Никому не сообщайте код подтверждения.
                                        </p>

                                    </td>
                                </tr>

                                <!-- Подвал -->
                                <tr>
                                    <td align="center" style="
                                        background: #faf9fc;
                                        padding: 20px;
                                        color: #aaa6b7;
                                        font-size: 11px;
                                    ">
                                        © 2026 ServiceHub. Все права защищены.
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        });

    }

    res.json({
        message: 'Если аккаунт с таким email существует, код отправлен на почту',
    });
});

app.post('/api/auth/verify-reset-code', async (req, res) => {
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Введите email и шестизначный код' });
    }

    const result = await pool.query(
        `SELECT prt.id, prt.token_hash, u.id AS user_id
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE u.email = $1
           AND u.is_active = TRUE
           AND prt.used_at IS NULL
           AND prt.expires_at > NOW()
         ORDER BY prt.created_at DESC
         LIMIT 1`,
        [email]
    );

    if (!result.rows.length ||
        !(await bcrypt.compare(code, result.rows[0].token_hash))) {
        return res.status(400).json({ error: 'Неверный или просроченный код' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 12);

    await pool.query(
        `UPDATE password_reset_tokens
         SET token_hash = $1, expires_at = NOW() + INTERVAL '10 minutes'
         WHERE id = $2`,
        [resetTokenHash, result.rows[0].id]
    );

    res.json({ reset_token: resetToken });
});

app.post('/api/auth/reset-password', async (req, res) => {
    const resetToken = typeof req.body?.reset_token === 'string'
        ? req.body.reset_token
        : '';
    const newPassword = req.body?.new_password;

    if (resetToken.length < 32 ||
        typeof newPassword !== 'string' ||
        newPassword.length < 8 ||
        newPassword.length > 72) {
        return res.status(400).json({
            error: 'Некорректный токен или пароль должен содержать от 8 до 72 символов',
        });
    }

    const result = await pool.query(
        `SELECT id, user_id, token_hash
         FROM password_reset_tokens
         WHERE used_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC`
    );

    const resetRecord = (await Promise.all(
        result.rows.map(async row => ({
            ...row,
            matches: await bcrypt.compare(resetToken, row.token_hash),
        }))
    )).find(row => row.matches);

    if (!resetRecord) {
        return res.status(400).json({ error: 'Токен восстановления недействителен' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const client = await pool.connect();

    try {
        await client.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, resetRecord.user_id]
        );
        await client.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
            [resetRecord.id]
        );
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }

    res.json({ message: 'Пароль успешно изменён' });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    const result = await pool.query(
        `SELECT
            u.id,
            u.full_name,
            u.email,
            u.phone,
            u.default_address,
            u.created_at,
            r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [req.user.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
});

app.put('/api/auth/me', authenticateToken, async (req, res) => {
    const { full_name, email, phone, default_address } = req.body || {};

    if (full_name !== undefined && !isValidString(full_name, 150)) {
        return res.status(400).json({ error: 'Некорректное ФИО' });
    }

    if (email !== undefined &&
        (!isValidString(email, 255) ||
         !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return res.status(400).json({ error: 'Некорректный email' });
    }

    if (phone !== undefined &&
        (!isValidString(phone, 20) ||
         !/^\+?[0-9 ()-]{7,20}$/.test(phone.trim()))) {
        return res.status(400).json({ error: 'Некорректный телефон' });
    }

    if (default_address !== undefined &&
        (typeof default_address !== 'string' || default_address.length > 1000)) {
        return res.status(400).json({ error: 'Некорректный адрес' });
    }

    const result = await pool.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE(LOWER($2), email),
             phone = COALESCE($3, phone),
             default_address = COALESCE($4, default_address),
             updated_at = NOW()
         WHERE id = $5 AND is_active = TRUE
         RETURNING full_name, email, phone, default_address`,
        [
            full_name?.trim() || null,
            email?.trim() || null,
            phone === undefined ? null : phone.trim(),
            default_address === undefined ? null : default_address.trim(),
            req.user.id,
        ]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
});

app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;

    if (typeof new_password !== 'string' ||
        new_password.length < 8 ||
        new_password.length > 72) {
        return res.status(400).json({ error: 'Новый пароль должен содержать от 8 до 72 символов' });
    }

    const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const matches = await bcrypt.compare(
        current_password || '',
        result.rows[0].password_hash
    );

    if (!matches) {
        return res.status(400).json({ error: 'Текущий пароль указан неверно' });
    }

    const hash = await bcrypt.hash(new_password, 12);

    await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hash, req.user.id]
    );

    res.json({ message: 'Пароль успешно изменён' });
});



app.get('/api/categories', async (req, res) => {
    const result = await pool.query(
        `SELECT
            c.id,
            c.name,
            c.description,
            c.created_at,
            COUNT(s.id)::INTEGER AS services_count
         FROM categories c
         LEFT JOIN services s ON s.category_id = c.id
         GROUP BY c.id
         ORDER BY c.name`
    );

    res.json(result.rows);
});

app.get('/api/categories/:id', async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    const result = await pool.query(
        `SELECT
            c.id,
            c.name,
            c.description,
            c.created_at,
            COUNT(s.id)::INTEGER AS services_count
         FROM categories c
         LEFT JOIN services s ON s.category_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`,
        [req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
});

app.post('/api/categories', ...adminOnly, async (req, res) => {
    const { name, description } = req.body;

    if (!isValidString(name, 150)) {
        return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const result = await pool.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
        RETURNING id, name, description, created_at`,
        [name.trim(), description || null]
    );

    res.status(201).json(result.rows[0]);
});

app.put('/api/categories/:id', ...adminOnly, async (req, res) => {
    const { name, description } = req.body;

    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    if (name !== undefined && !isValidString(name, 150)) {
        return res.status(400).json({ error: 'Некорректное название' });
    }

    const result = await pool.query(
        `UPDATE categories
         SET name = COALESCE($1, name),
             description = COALESCE($2, description)
         WHERE id = $3
         RETURNING id, name, description, created_at`,
        [name?.trim() || null, description === undefined ? null : description, req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
});

app.delete('/api/categories/:id', ...adminOnly, async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 RETURNING name',
        [req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json({ message: 'Категория удалена', category: result.rows[0].name });
});

app.get('/api/services', async (req, res) => {
    const { category, search } = req.query;

    const result = await pool.query(
        `SELECT
            s.id,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.is_available,
            c.id AS category_id,
            c.name AS category
         FROM services s
         JOIN categories c ON c.id = s.category_id
         WHERE
            ($1::TEXT IS NULL OR c.name = $1)
            AND ($2::TEXT IS NULL OR
                 s.name ILIKE '%' || $2 || '%' OR
                 s.description ILIKE '%' || $2 || '%')
         ORDER BY c.name, s.name`,
        [category || null, search || null]
    );

    res.json(result.rows);
});

app.get('/api/services/:id', async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    const result = await pool.query(
        `SELECT
            s.id,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.is_available,
            c.id AS category_id,
            c.name AS category
         FROM services s
         JOIN categories c ON c.id = s.category_id
         WHERE s.id = $1`,
        [req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json(result.rows[0]);
});

app.post('/api/services', ...adminOnly, async (req, res) => {
    const {
        name,
        description,
        duration_minutes,
        price,
        category_id,
        is_available,
    } = req.body;

    if (!isValidString(name, 200) ||
        !isValidPrice(price) ||
        !Number.isInteger(Number(duration_minutes)) ||
        Number(duration_minutes) <= 0 ||
        !isValidId(category_id)) {
        return res.status(400).json({ error: 'Проверьте название, цену, категорию и продолжительность услуги' });
    }

    const result = await pool.query(
        `INSERT INTO services
            (name, description, duration_minutes, price, category_id, is_available)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, description, duration_minutes, price, category_id, is_available`,
        [
            name.trim(),
            description || null,
            Number(duration_minutes),
            Number(price),
            category_id,
            is_available !== undefined ? Boolean(is_available) : true,
        ]
    );

    res.status(201).json(result.rows[0]);
});

app.put('/api/services/:id', ...adminOnly, async (req, res) => {
    const {
        name,
        description,
        duration_minutes,
        price,
        category_id,
        is_available,
    } = req.body;

    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    if (name !== undefined && !isValidString(name, 200)) {
        return res.status(400).json({ error: 'Некорректное название услуги' });
    }

    if (price !== undefined && !isValidPrice(price)) {
        return res.status(400).json({ error: 'Некорректная цена' });
    }

    if (duration_minutes !== undefined &&
        (!Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0)) {
        return res.status(400).json({ error: 'Некорректная продолжительность' });
    }

    if (category_id !== undefined && !isValidId(category_id)) {
        return res.status(400).json({ error: 'Некорректная категория' });
    }

    const result = await pool.query(
        `UPDATE services
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             duration_minutes = COALESCE($3, duration_minutes),
             price = COALESCE($4, price),
             category_id = COALESCE($5, category_id),
             is_available = COALESCE($6, is_available),
             updated_at = NOW()
         WHERE id = $7
         RETURNING id, name, description, duration_minutes, price, category_id, is_available`,
        [
            name?.trim() || null,
            description === undefined ? null : description,
            duration_minutes === undefined ? null : Number(duration_minutes),
            price === undefined ? null : Number(price),
            category_id || null,
            is_available === undefined ? null : Boolean(is_available),
            req.params.id,
        ]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json(result.rows[0]);
});

app.delete('/api/services/:id', ...adminOnly, async (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Некорректный ID' });
    }

    const result = await pool.query(
        'DELETE FROM services WHERE id = $1 RETURNING name',
        [req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json({ message: 'Услуга удалена', service: result.rows[0].name });
});


app.get('/api/cart', authenticateToken, async (req, res) => {
    const result = await pool.query(
        `SELECT
            ci.quantity,
            s.name AS service,
            s.description,
            s.price,
            s.duration_minutes,
            c.name AS category,
            (s.price * ci.quantity) AS subtotal
         FROM carts cart
         JOIN cart_items ci ON ci.cart_id = cart.id
         JOIN services s ON s.id = ci.service_id
         JOIN categories c ON c.id = s.category_id
         WHERE cart.user_id = $1
         ORDER BY ci.added_at DESC`,
        [req.user.id]
    );

    const total = result.rows.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
    );

    res.json({
        items: result.rows,
        total: Number(total.toFixed(2)),
    });
});

app.post('/api/cart/items', authenticateToken, async (req, res) => {
    const { service_name, quantity = 1 } = req.body;

    if (!isValidString(service_name, 200) ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) <= 0) {
        return res.status(400).json({ error: 'Укажите услугу и корректное количество' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const service = await client.query(
            `SELECT id FROM services
             WHERE name = $1 AND is_available = TRUE`,
            [service_name]
        );

        if (!service.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Доступная услуга не найдена' });
        }

        const cart = await client.query(
            `INSERT INTO carts (user_id)
             VALUES ($1)
             ON CONFLICT (user_id)
             DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [req.user.id]
        );

        const result = await client.query(
            `INSERT INTO cart_items (cart_id, service_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, service_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
             RETURNING quantity`,
            [cart.rows[0].id, service.rows[0].id, Number(quantity)]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Услуга добавлена в корзину',
            service: service_name,
            quantity: result.rows[0].quantity,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
});

app.put('/api/cart/items/:service_name', authenticateToken, async (req, res) => {
    const { quantity } = req.body;
    const serviceName = req.params.service_name;

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ error: 'Количество должно быть положительным целым числом' });
    }

    const result = await pool.query(
        `UPDATE cart_items ci
         SET quantity = $1
         FROM carts c, services s
         WHERE ci.cart_id = c.id
           AND ci.service_id = s.id
           AND c.user_id = $2
           AND s.name = $3
         RETURNING ci.quantity`,
        [Number(quantity), req.user.id, serviceName]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Позиция не найдена' });
    }

    res.json({
        message: 'Количество изменено',
        quantity: result.rows[0].quantity,
    });
});

app.delete('/api/cart/items/:service_name', authenticateToken, async (req, res) => {
    const result = await pool.query(
        `DELETE FROM cart_items ci
         USING carts c, services s
         WHERE ci.cart_id = c.id
           AND ci.service_id = s.id
           AND c.user_id = $1
           AND s.name = $2
         RETURNING s.name`,
        [req.user.id, req.params.service_name]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Позиция не найдена' });
    }

    res.json({
        message: 'Услуга удалена из корзины',
        service: result.rows[0].name,
    });
});

app.delete('/api/cart', authenticateToken, async (req, res) => {
    await pool.query(
        `DELETE FROM cart_items
         WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)`,
        [req.user.id]
    );

    res.json({ message: 'Корзина очищена' });
});


app.post('/api/orders/checkout', authenticateToken, async (req, res) => {
    const { delivery_address, delivery_date } = req.body;

    if (!isValidString(delivery_address, 500)) {
        return res.status(400).json({ error: 'Укажите адрес доставки' });
    }

    if (!delivery_date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(delivery_date)) {
        return res.status(400).json({ error: 'Укажите дату в формате ГГГГ-ММ-ДД' });
    }

    const [year, month, day] = delivery_date.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
        return res.status(400).json({ error: 'Некорректная дата доставки' });
    }

    const today = new Date();
    const todayValue = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
    const deliveryValue = Date.UTC(year, month - 1, day);

    if (deliveryValue < todayValue) {
        return res.status(400).json({ error: 'Дата доставки не может быть в прошлом' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const cartResult = await client.query(
            `SELECT id FROM carts WHERE user_id = $1 FOR UPDATE`,
            [req.user.id]
        );

        if (!cartResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        const cartId = cartResult.rows[0].id;

        const itemsResult = await client.query(
            `SELECT
                ci.quantity,
                s.id AS service_id,
                s.name,
                s.price,
                s.duration_minutes,
                s.is_available
             FROM cart_items ci
             JOIN services s ON s.id = ci.service_id
             WHERE ci.cart_id = $1
             FOR UPDATE OF s`,
            [cartId]
        );

        if (!itemsResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        if (itemsResult.rows.some(item => !item.is_available)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Одна или несколько услуг больше недоступны' });
        }

        const totalAmount = itemsResult.rows.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        const statusResult = await client.query(
            `SELECT id FROM order_statuses WHERE name = 'NEW'`
        );

        if (!statusResult.rows.length) {
            throw new Error('Статус NEW не найден в order_statuses');
        }

        const orderResult = await client.query(
            `INSERT INTO orders
                (user_id, status_id, delivery_address, delivery_date, total_amount)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, total_amount, delivery_date, created_at`,
            [
                req.user.id,
                statusResult.rows[0].id,
                delivery_address.trim(),
                delivery_date,
                totalAmount,
            ]
        );

        const order = orderResult.rows[0];

        for (const item of itemsResult.rows) {
            await client.query(
                `INSERT INTO order_items
                    (order_id, service_id, service_name, price_at_order, quantity, duration_minutes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    order.id,
                    item.service_id,
                    item.name,
                    item.price,
                    item.quantity,
                    item.duration_minutes,
                ]
            );
        }

        await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Заказ успешно оформлен',
            order: {
                total_amount: Number(order.total_amount),
                delivery_date: order.delivery_date,
                created_at: order.created_at,
                items: itemsResult.rows.map(item => ({
                    service: item.name,
                    quantity: item.quantity,
                    price: Number(item.price),
                })),
            },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
});

app.get('/api/orders/my', authenticateToken, async (req, res) => {
    const result = await pool.query(
        `SELECT
            o.total_amount,
            o.delivery_address,
            o.delivery_date,
            o.created_at,
            os.name AS status,
            COALESCE(
                json_agg(
                    json_build_object(
                        'service', oi.service_name,
                        'price', oi.price_at_order,
                        'quantity', oi.quantity,
                        'duration_minutes', oi.duration_minutes
                    )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
         FROM orders o
         JOIN order_statuses os ON os.id = o.status_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = $1
         GROUP BY o.id, os.name
         ORDER BY o.created_at DESC`,
        [req.user.id]
    );

    res.json(result.rows);
});

app.get('/api/orders', ...adminOnly, async (req, res) => {
    const result = await pool.query(
        `SELECT
            o.total_amount,
            o.delivery_address,
            o.delivery_date,
            o.created_at,
            os.name AS status,
            u.full_name AS customer,
            u.email AS customer_email,
            COALESCE(
                json_agg(
                    json_build_object(
                        'service', oi.service_name,
                        'price', oi.price_at_order,
                        'quantity', oi.quantity
                    )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
         FROM orders o
         JOIN users u ON u.id = o.user_id
         JOIN order_statuses os ON os.id = o.status_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         GROUP BY o.id, os.name, u.full_name, u.email
         ORDER BY o.created_at DESC`
    );

    res.json(result.rows);
});

app.put('/api/orders/:order_id/status', ...adminOnly, async (req, res) => {
    const { status } = req.body;

    if (!isValidId(req.params.order_id) || !isValidString(status, 50)) {
        return res.status(400).json({ error: 'Некорректный заказ или статус' });
    }

    const result = await pool.query(
        `UPDATE orders
         SET status_id = (
             SELECT id FROM order_statuses WHERE name = $1
         ),
         updated_at = NOW()
         WHERE id = $2
           AND EXISTS (SELECT 1 FROM order_statuses WHERE name = $1)
         RETURNING total_amount, delivery_date`,
        [status.toUpperCase(), req.params.order_id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Заказ или статус не найдены' });
    }

    res.json({
        message: 'Статус заказа изменён',
        status: status.toUpperCase(),
        order: result.rows[0],
    });
});


app.get('/api/services/:service_name/reviews', async (req, res) => {
    const result = await pool.query(
        `SELECT
            r.user_id,
            r.rating,
            r.comment,
            r.created_at,
            u.full_name AS author
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN services s ON s.id = r.service_id
         WHERE s.name = $1
         ORDER BY r.created_at DESC`,
        [req.params.service_name]
    );

    res.json(result.rows);
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { service_name, rating, comment } = req.body || {};

    if (!isValidString(service_name, 200) ||
        !Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5 ||
        !isValidString(comment, 2000)) {
        return res.status(400).json({ error: 'Укажите услугу, оценку от 1 до 5 и комментарий' });
    }

    const result = await pool.query(
        `INSERT INTO reviews (user_id, service_id, rating, comment)
         SELECT $1, s.id, $3, $4
         FROM services s
         WHERE s.name = $2
         RETURNING rating, comment, created_at`,
        [
            req.user.id,
            service_name,
            Number(rating),
            comment.trim(),
        ]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.status(201).json({
        message: 'Отзыв добавлен',
        review: result.rows[0],
    });
});

app.put('/api/reviews/:service_name', authenticateToken, async (req, res) => {
    const { rating, comment } = req.body || {};

    if (rating !== undefined &&
        (!Number.isInteger(Number(rating)) ||
         Number(rating) < 1 ||
         Number(rating) > 5)) {
        return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }

    if (comment !== undefined && !isValidString(comment, 2000)) {
        return res.status(400).json({ error: 'Комментарий должен содержать от 2 до 2000 символов' });
    }

    const result = await pool.query(
        `UPDATE reviews r
         SET rating = COALESCE($1, r.rating),
             comment = COALESCE($2, r.comment),
             updated_at = NOW()
         FROM services s
         WHERE r.service_id = s.id
           AND s.name = $3
           AND r.user_id = $4
         RETURNING r.rating, r.comment, r.updated_at`,
        [
            rating === undefined ? null : Number(rating),
            comment === undefined ? null : comment.trim(),
            req.params.service_name,
            req.user.id,
        ]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Ваш отзыв не найден' });
    }

    res.json(result.rows[0]);
});

app.delete('/api/reviews/:service_name', authenticateToken, async (req, res) => {
    const result = await pool.query(
        `DELETE FROM reviews r
         USING services s
         WHERE r.service_id = s.id
           AND s.name = $1
           AND r.user_id = $2
         RETURNING r.rating`,
        [req.params.service_name, req.user.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Ваш отзыв не найден' });
    }

    res.json({ message: 'Отзыв удалён' });
});


app.get('/api/admin/users', ...adminOnly, async (req, res) => {
    const result = await pool.query(
        `SELECT
            u.full_name,
            u.email,
            u.phone,
            u.default_address,
            u.is_active,
            u.created_at,
            r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         ORDER BY u.created_at DESC`
    );

    res.json(result.rows);
});

app.put('/api/admin/users/:email', ...adminOnly, async (req, res) => {
    const { full_name, phone, default_address, role, is_active } = req.body;

    const result = await pool.query(
        `UPDATE users u
         SET full_name = COALESCE($1, u.full_name),
             phone = COALESCE($2, u.phone),
             default_address = COALESCE($3, u.default_address),
             role_id = COALESCE(
                 (SELECT id FROM roles WHERE name = $4),
                 u.role_id
             ),
             is_active = COALESCE($5, u.is_active),
             updated_at = NOW()
         WHERE u.email = LOWER($6)
         RETURNING
            u.full_name,
            u.email,
            u.phone,
            u.default_address,
            u.is_active`,
        [
            full_name || null,
            phone === undefined ? null : phone,
            default_address === undefined ? null : default_address,
            role ? role.toUpperCase() : null,
            is_active === undefined ? null : Boolean(is_active),
            req.params.email,
        ]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
});

app.delete('/api/admin/users/:email', ...adminOnly, async (req, res) => {
    const result = await pool.query(
        `DELETE FROM users
         WHERE email = LOWER($1)
         RETURNING email`,
        [req.params.email]
    );

    if (!result.rows.length) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь удалён' });
});

app.get('/api/admin/roles', ...adminOnly, async (req, res) => {
    const result = await pool.query(
        `SELECT
            r.name,
            r.description,
            COUNT(u.id)::INTEGER AS users_count
         FROM roles r
         LEFT JOIN users u ON u.role_id = r.id
         GROUP BY r.id
         ORDER BY r.name`
    );

    res.json(result.rows);
});


app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);

    if (err.code === '23505') {
        return res.status(409).json({ error: 'Такая запись уже существует' });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            error: 'Нельзя выполнить операцию: запись связана с другими данными',
        });
    }

    if (err.code === '23514' || err.code === '22P02') {
        return res.status(400).json({ error: 'Некорректные данные' });
    }

    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

async function startServer() {
    try {
        await pool.query('SELECT 1');

        app.listen(PORT, () => {
            console.log(`Сервер: http://localhost:${PORT}/api`);
            console.log('База данных: подключена');
        });
    } catch (err) {
        console.error('Не удалось подключиться к БД:', err.message);
        process.exit(1);
    }
}
startServer();
