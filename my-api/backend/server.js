const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.on('connect', () => console.log('БД подключена'));
pool.on('error', (err) => console.error('Ошибка БД:', err));

async function hash_password(password) {
    return await bcrypt.hash(password, 10);
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Нет токена, доступ запрещен' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Неверный или просроченный токен' });
        }
        req.user = user;
        next();
    });
}

// БАЗОВЫЕ ТЕСТЫ
app.get('/api/', (req, res) => res.json({ message: 'API работает!' }));

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ message: 'БД работает!', time: result.rows[0].time });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// КАТЕГОРИИ
app.get('/api/get_cars_category', async(req, res) => {
    try{
        const result = await pool.query('select * from categories')
        if (result.rows.length === 0) return res.status(404).json({error: 'Категории не найдены'})
        return res.json(result.rows)
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.get('/api/get_cars_category_by_id/:id', async(req,res) => {
    try{
        const result = await pool.query('select * from categories where id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({error: 'Категория не найдена'})
        return res.json(result.rows[0]);
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.put('/api/update_cars_category/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let { name, description } = req.body;
        const result = await pool.query(
            `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *`,
            [name || null, description || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        return res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/add_cars_category', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !description) return res.status(400).json({ error: 'Имя и описание обязательны' });
        const result = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
        return res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/delete_cars_category/:id', async (req, res) => {
    try{
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({error: 'Категория не найдена'})
        return res.json(result.rows[0])
    } catch(e) { res.status(500).json({error: e.message}) }
});

// РОЛИ
app.get('/api/get_all_roles', async (req, res) => {
    try{
        const result = await pool.query('select * from roles')
        if (result.rows.length === 0) return res.status(404).json({error: 'Роли не найдены'})
        return res.json(result.rows)
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.get('/api/get_role_by_id/:id', async(req,res) => {
    try{
        const result = await pool.query('select * from roles where id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({error: 'Роль не найдена'})
        return res.json(result.rows[0]);
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.put('/api/update_role_by_id/:id', async(req,res) => {
    try{
        const result = await pool.query(`UPDATE roles SET name = COALESCE($1, name) WHERE id = $2 RETURNING *`, [req.body.name || null, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Роль не найдена' });
        return res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/add_role', async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ error: 'Имя роли обязательно' });
        const result = await pool.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [req.body.name]);
        return res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/delete_role/:id', async (req, res) => {
    try{
        const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({error: 'Роль не найдена'})
        return res.json(result.rows[0])
    } catch(e) { res.status(500).json({error: e.message}) }
});

// ПОЛЬЗОВАТЕЛИ И АВТОРИЗАЦИЯ
app.get('/api/get_all_users', async (req, res) => {
    try{
        const result = await pool.query('select id, email, full_name, role_id, personal_discount_percent from users')
        if (result.rows.length === 0) return res.status(404).json({error: 'Пользователи не найдены'})
        return res.json(result.rows)
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.get('/api/get_user_by_id/:id', async(req,res) => {
    try{
        const result = await pool.query('select id, email, full_name, role_id, personal_discount_percent from users where id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({error: 'Пользователь не найден'})
        return res.json(result.rows[0]);
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.put('/api/update_user/:id', async (req, res) => {
    const { email, password, name, role, discount } = req.body;
    try {
        let hashedPassword = null;
        if (password) hashedPassword = await hash_password(password);

        const result = await pool.query(
            `UPDATE users 
             SET email = COALESCE($1, email),
                 password_hash = COALESCE($2, password_hash),
                 full_name = COALESCE($3, full_name),
                 role_id = COALESCE($4, role_id),
                 personal_discount_percent = COALESCE($5, personal_discount_percent)
             WHERE id = $6
             RETURNING id, email, full_name, role_id, personal_discount_percent`,
            [email || null, hashedPassword, name || null, role || null, discount || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        return res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/add_user', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const hashedPassword = await hash_password(password);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role_id',
            [email, hashedPassword, name, role || 2]
        );
        return res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/delete_user/:id', async (req, res) => {
    try{
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({error: 'Пользователь не найден'})
        return res.json({ message: 'Удален', id: result.rows[0].id })
    } catch(e) { res.status(500).json({error: e.message}) }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Неверный email или пароль' });
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Неверный email или пароль' });

        const token = jwt.sign({ id: user.id, role_id: user.role_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token: token,
            user: { id: user.id, email: user.email, full_name: user.full_name, role_id: user.role_id, personal_discount_percent: user.personal_discount_percent }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// МАШИНЫ
app.get('/api/get_all_cars', async (req, res) => {
    try{
        const result = await pool.query('select * from services')
        if (result.rows.length === 0) return res.status(404).json({error: 'Машины не найдены'})
        return res.json(result.rows)
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.get('/api/get_car_by_id/:id', async(req,res) => {
    try{
        const result = await pool.query('select * from services where id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({error: 'Машина не найдена'})
        return res.json(result.rows[0]);
    } catch(e) { res.status(500).json({error: e.message}) }
})

app.put('/api/update_car/:id', async (req, res) => {
    const { name, description, price, category_id, duration_minutes, is_discounted, discount_percent, image_url } = req.body;
    try {
        const result = await pool.query(
            `UPDATE services 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 category_id = COALESCE($4, category_id),
                 duration_minutes = COALESCE($5, duration_minutes),
                 is_discounted = COALESCE($6, is_discounted),
                 discount_percent = COALESCE($7, discount_percent),
                 image_url = COALESCE($8, image_url)
             WHERE id = $9 RETURNING *`,
            [name || null, description || null, price || null, category_id || null, duration_minutes || null, is_discounted !== undefined ? is_discounted : null, discount_percent || null, image_url || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Машина не найдена' });
        return res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/add_car', async (req, res) => {
    const { name, description, price, category_id, duration_minutes, is_discounted, discount_percent, image_url } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO services (name, description, price, category_id, duration_minutes, is_discounted, discount_percent, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, description, price, category_id, duration_minutes, is_discounted || false, discount_percent || 0, image_url]
        );
        return res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/delete_car/:id', async (req, res) => {
    try{
        const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({error: 'Машина не найдена'})
        return res.json(result.rows[0])
    } catch(e) { res.status(500).json({error: e.message}) }
});

// КОРЗИНА
app.get('/api/get_user_cart', authenticateToken , async (req, res) => {
    try {
        const user_id = req.user.id;
        const cartRes = await pool.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
        
        if (cartRes.rows.length === 0) {
            return res.json({ cart_id: null, items: [], total_price: 0 });
        }
        
        const cart_id = cartRes.rows[0].id;

        const itemsRes = await pool.query(
            `SELECT ci.id as cart_item_id, ci.quantity, 
                    s.id as service_id, s.name, s.price, s.image_url, s.is_discounted, s.discount_percent
             FROM cart_items ci
             JOIN services s ON ci.service_id = s.id
             WHERE ci.cart_id = $1`,
            [cart_id]
        );

        let total_price = 0;
        const items = itemsRes.rows.map(item => {
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            let finalPrice = price;

            if (item.is_discounted && Number(item.discount_percent) > 0) {
                finalPrice = price - (price * (Number(item.discount_percent) / 100));
            }

            total_price += finalPrice * quantity;
            
            return {
                cart_item_id: item.cart_item_id,
                quantity: item.quantity,
                service_id: item.service_id,
                price: item.price,
                image_url: item.image_url,
                is_discounted: item.is_discounted,
                discount_percent: item.discount_percent,
                finalPrice: finalPrice
            };
        });

        return res.json({ cart_id, items, total_price });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/add_to_cart', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { service_id, quantity } = req.body;
    const qty = quantity || 1;

    try {
        let cartRes = await pool.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
        let cart_id;

        if (cartRes.rows.length === 0) {
            const newCart = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [user_id]);
            cart_id = newCart.rows[0].id;
        } else {
            cart_id = cartRes.rows[0].id;
        }

        const result = await pool.query(
            `INSERT INTO cart_items (cart_id, service_id, quantity) 
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, service_id) 
             DO UPDATE SET quantity = cart_items.quantity + $3
             RETURNING *`,
            [cart_id, service_id, qty]
        );

        return res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.delete('/api/remove_from_cart/:cart_item_id', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    try {
        const result = await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id IN (SELECT id FROM carts WHERE user_id = $2) RETURNING *', [req.params.cart_item_id, user_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Позиция не найдена' });
        return res.json({ message: 'Удалено', item: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/update_cart_quantity/:cart_item_id', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { quantity } = req.body;
    try {
        if (quantity <= 0) {
            await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id IN (SELECT id FROM carts WHERE user_id = $2)', [req.params.cart_item_id, user_id]);
            return res.json({ message: 'Удалено' });
        }
        const result = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id IN (SELECT id FROM carts WHERE user_id = $3) RETURNING *', [quantity, req.params.cart_item_id, user_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Позиция не найдена' });
        }

        return res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/get_user_payments', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const paymentsRes = await pool.query(
            'SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC',
            [user_id]
        );
        
        const orders = paymentsRes.rows;

        for (let order of orders) {
            const itemsRes = await pool.query(
                `SELECT pi.quantity, pi.price_at_purchase, s.name, s.image_url 
                 FROM payment_items pi
                 JOIN services s ON pi.service_id = s.id
                 WHERE pi.payment_id = $1`,
                [order.id]
            );
            order.items = itemsRes.rows;
        }

        return res.json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/get_all_payments", authenticateToken, async (req, res) => {
    try {
        const paymentsRes = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
        const orders = paymentsRes.rows;

        for (let order of orders) {
            const itemsRes = await pool.query(
                `SELECT pi.quantity, pi.price_at_purchase, s.name, s.image_url 
                 FROM payment_items pi
                 JOIN services s ON pi.service_id = s.id
                 WHERE pi.payment_id = $1`,
                [order.id]
            );
            order.items = itemsRes.rows;
        }

        return res.json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// ОФОРМЛЕНИЕ ЗАКАЗА
app.post('/api/checkout', authenticateToken, async (req, res) => {
    const user_id= req.user.id;

    try {
        const userRes = await pool.query('SELECT personal_discount_percent FROM users WHERE id = $1', [user_id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        
        const userDiscount = Number(userRes.rows[0].personal_discount_percent) || 0;

        const cartRes = await pool.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
        if (cartRes.rows.length === 0) return res.status(400).json({ error: 'Корзина пуста' });
        const cart_id = cartRes.rows[0].id;

        const itemsRes = await pool.query(
            `SELECT ci.quantity, s.id as service_id, s.price, s.is_discounted, s.discount_percent
             FROM cart_items ci JOIN services s ON ci.service_id = s.id WHERE ci.cart_id = $1`,
            [cart_id]
        );
        if (itemsRes.rows.length === 0) return res.status(400).json({ error: 'Корзина пуста' });

        let total_amount = 0;
        let total_discount = 0;

        const items = itemsRes.rows.map(item => {
            const price = Number(item.price);
            const qty = Number(item.quantity);
            let itemDiscountPercent = 0;

            if (item.is_discounted && Number(item.discount_percent) > 0) {
                itemDiscountPercent = Number(item.discount_percent);
            }

            const totalPercent = itemDiscountPercent + userDiscount;

            const discountAmount = price * (totalPercent / 100);
            const finalPrice = price - discountAmount;

            total_discount += discountAmount * qty;
            total_amount += finalPrice * qty;

            return {
                quantity: item.quantity,
                service_id: item.service_id,
                price: item.price,
                finalPrice: finalPrice
            };
        });

        const paymentRes = await pool.query(
            `INSERT INTO payments (user_id, cart_id, total_amount, discount_applied, payment_status) 
             VALUES ($1, $2, $3, $4, 'completed') RETURNING id`,
            [user_id, cart_id, total_amount, total_discount]
        );
        const payment_id = paymentRes.rows[0].id;

        for (let item of items) {
            await pool.query(
                `INSERT INTO payment_items (payment_id, service_id, quantity, price_at_purchase) 
                 VALUES ($1, $2, $3, $4)`,
                [payment_id, item.service_id, item.quantity, item.finalPrice]
            );
        }

        await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);

        res.json({ 
            message: 'Заказ успешно оформлен', 
            payment_id, 
            total_amount: Number(total_amount.toFixed(2)), 
            total_discount: Number(total_discount.toFixed(2)),
            applied_user_discount: userDiscount
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}/api`);
    console.log(`[ КАТЕГОРИИ ]`);
    console.log(`GET  http://localhost:${PORT}/api/get_cars_category`);
    console.log(`GET  http://localhost:${PORT}/api/get_cars_category_by_id/:id`);
    console.log(`POST /api/add_cars_category`);
    console.log(`PUT  /api/update_cars_category/:id`);
    console.log(`GET  http://localhost:${PORT}/api/delete_cars_category/:id\n`);
    
    console.log(`[ РОЛИ ]`);
    console.log(`GET  http://localhost:${PORT}/api/get_all_roles`);
    console.log(`GET  http://localhost:${PORT}/api/get_role_by_id/:id`);
    console.log(`POST /api/add_role`);
    console.log(`PUT  /api/update_role_by_id/:id`);
    console.log(`GET  http://localhost:${PORT}/api/delete_role/:id\n`);
    
    console.log(`[ ПОЛЬЗОВАТЕЛИ ]`);
    console.log(`GET  http://localhost:${PORT}/api/get_all_users`);
    console.log(`GET  http://localhost:${PORT}/api/get_user_by_id/:id`);
    console.log(`POST /api/add_user`);
    console.log(`PUT  /api/update_user/:id`);
    console.log(`GET  http://localhost:${PORT}/api/delete_user/:id\n`);
    
    console.log(`[ АВТОРИЗАЦИЯ ]`);
    console.log(`POST /api/login\n`);
    
    console.log(`[ МАШИНЫ ]`);
    console.log(`GET  http://localhost:${PORT}/api/get_all_cars`);
    console.log(`GET  http://localhost:${PORT}/api/get_car_by_id/:id`);
    console.log(`POST /api/add_car`);
    console.log(`PUT  /api/update_car/:id`);
    console.log(`GET  http://localhost:${PORT}/api/delete_car/:id\n`);
    
    console.log(`[ КОРЗИНА ] (Требуется JWT-токен)`);
    console.log(`GET  http://localhost:${PORT}/api/get_user_cart`);
    console.log(`POST /api/add_to_cart`);
    console.log(`DELETE /api/remove_from_cart/:cart_item_id`);
    console.log(`PUT  /api/update_cart_quantity/:cart_item_id\n`);
    
    console.log(`[ ОФОРМЛЕНИЕ ЗАКАЗА ] (Требуется JWT-токен)`);
    console.log(`POST /api/checkout\n`);
    
    console.log(`[ ТЕСТЫ ]`);
    console.log(`GET  http://localhost:${PORT}/api/`);
    console.log(`GET  http://localhost:${PORT}/api/test-db`);
});