const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Simple admin auth via env (username/password)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';

app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Missing credentials' });
        }
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
            return res.status(503).json({ success: false, message: 'Password login is not configured' });
        }
        if (String(username) === String(ADMIN_USERNAME) && String(password) === String(ADMIN_PASSWORD)) {
            return res.json({ success: true, user: { username } });
        }
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    } catch (e) {
        console.error('Auth login error:', e.message);
        return res.status(500).json({ success: false, message: 'Internal error' });
    }
});

// T-Bank Configuration
const TBANK_CONFIG = {
    terminalKey: process.env.TBANK_TERMINAL_KEY || '1760898345949DEMO',
    password: process.env.TBANK_PASSWORD || 'm$4Hgg1ASpPUVfhj',
    apiUrl: 'https://securepay.tinkoff.ru/v2'
};

// PocketBase client
const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';
const pb = new PocketBase(PB_URL);

// Mailer
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'MiniAppExpert <no-reply@miniapp.expert>';

const mailTransport = (SMTP_HOST && SMTP_USER && SMTP_PASS)
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

async function sendWelcomeEmail({ to, name, product, orderId, magicToken }) {
    if (!mailTransport || !to) return false;
    const magicUrl = `https://miniapp.expert/auth/magic?token=${encodeURIComponent(magicToken)}&email=${encodeURIComponent(to)}&name=${encodeURIComponent(name || 'Клиент')}&product=${encodeURIComponent(product || 'Mini App')}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#f6f9fc;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
          <div style="padding:24px 24px 0">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;background:#10B981;border-radius:12px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:20px;color:#fff">⚡</span>
              </div>
              <div style="font-size:18px;font-weight:800;color:#0b1220">MiniAppExpert</div>
            </div>
            <h1 style="margin:24px 0 8px;font-size:22px;color:#0b1220">Оплата принята — доступ в личный кабинет</h1>
            <p style="margin:0 0 12px;color:#374151">Здравствуйте${name ? `, ${name}` : ''}! Спасибо за оплату заказа <b>${product || 'Продукт'}</b>.</p>
            <p style="margin:0 0 16px;color:#374151">Номер заказа: <b>${orderId}</b></p>
          </div>
          <div style="padding:0 24px 24px">
            <a href="${magicUrl}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700">Войти в личный кабинет</a>
            <p style="margin:12px 0 0;font-size:12px;color:#6b7280">Кнопка содержит одноразовую ссылку авторизации и действует 24 часа.</p>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:0"/>
          <div style="padding:16px 24px;background:#fafafa">
            <div style="font-weight:700;margin-bottom:6px;color:#111827">Что дальше?</div>
            <ul style="margin:0;padding-left:18px;color:#374151">
              <li>Мы добавили продукт в ваш кабинет со статусом «Настройка»</li>
              <li>В течение 1–2 рабочих дней мы свяжемся для уточнения деталей</li>
              <li>Фискальный чек отправлен банком на вашу почту</li>
            </ul>
          </div>
        </div>
        <p style="text-align:center;margin:12px 0 0;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} MiniAppExpert</p>
      </div>`;
    try {
        await mailTransport.sendMail({ from: MAIL_FROM, to, subject: 'Оплата принята — доступ в личный кабинет', html });
        return true;
    } catch (e) {
        console.error('Mail send error:', e.message);
        return false;
    }
}

function createMagicToken(payload) {
    const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24*60*60*1000 })).toString('base64url');
    const sig = crypto.createHash('sha256').update(data + (process.env.MAGIC_SECRET || 'secret')).digest('base64url');
    return `${data}.${sig}`;
}

function verifyMagicToken(token) {
    const [data, sig] = String(token || '').split('.');
    const expected = crypto.createHash('sha256').update(data + (process.env.MAGIC_SECRET || 'secret')).digest('base64url');
    if (sig !== expected) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (Date.now() > payload.exp) return null;
        return payload;
    } catch { return null; }
}

async function ensurePbAuth() {
    try {
        if (!pb.authStore.isValid && PB_ADMIN_EMAIL && PB_ADMIN_PASSWORD) {
            await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        }
        return pb.authStore.isValid;
    } catch (e) {
        console.error('PocketBase auth error:', e.message);
        return false;
    }
}

// Fallback storage helpers (JSONL files)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const EVENTS_FALLBACK = path.join(DATA_DIR, 'events.log');
const CARTS_FALLBACK = path.join(DATA_DIR, 'abandoned_carts.log');

function safeMkdir(dir) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

function appendJsonLine(file, obj) {
    try {
        safeMkdir(DATA_DIR);
        fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
    } catch (e) {
        console.error('Fallback write error:', e.message);
    }
}

function readJsonLines(file, limit = 200) {
    try {
        if (!fs.existsSync(file)) return [];
        const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
        const recent = lines.slice(-limit);
        return recent.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse();
    } catch (e) {
        console.error('Fallback read error:', e.message);
        return [];
    }
}

// ===== User Data API (profiles, products, subscriptions, referrals) =====
async function pbUpsertSingle(collection, email, payload) {
    const authed = await ensurePbAuth();
    if (!authed) return null;
    const list = await pb.collection(collection).getList(1, 1, { filter: `email = "${email}"` });
    if (list.items?.[0]) {
        return await pb.collection(collection).update(list.items[0].id, payload);
    }
    return await pb.collection(collection).create({ email, ...payload });
}

// Profile
app.get('/api/user/profile', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const authed = await ensurePbAuth();
        if (authed) {
            try {
                const list = await pb.collection('profiles').getList(1, 1, { filter: `email = "${email}"` });
                const rec = list.items?.[0] || null;
                return res.json({ success: true, profile: rec ? { email: rec.email, name: rec.name, phone: rec.phone, data: rec.data || {} } : null });
            } catch (e) { console.error('PB profile get error:', e.message); }
        }
        // Fallback: return null (frontend uses localStorage)
        res.json({ success: true, profile: null });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/user/profile', async (req, res) => {
    try {
        const { email, name, phone, data } = req.body || {};
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        try {
            const rec = await pbUpsertSingle('profiles', String(email).toLowerCase(), { name, phone, data: data || {} });
            return res.json({ success: true, profile: { email: rec.email, name: rec.name, phone: rec.phone, data: rec.data || {} } });
        } catch (e) {
            console.error('PB profile upsert error:', e.message);
            return res.status(503).json({ success: false, message: 'storage unavailable' });
        }
    } catch (e) { res.status(500).json({ success: false }); }
});

// Generic helpers for array-collections
async function getArrayByEmail(collection, email) {
    const authed = await ensurePbAuth();
    if (!authed) return [];
    const list = await pb.collection(collection).getList(1, 1, { filter: `email = "${email}"` });
    const rec = list.items?.[0] || null;
    return (rec && Array.isArray(rec.items)) ? rec.items : [];
}

async function setArrayByEmail(collection, email, items) {
    const payload = { items: Array.isArray(items) ? items : [] };
    const rec = await pbUpsertSingle(collection, email, payload);
    return Array.isArray(rec.items) ? rec.items : [];
}

// Products
app.get('/api/user/products', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const items = await getArrayByEmail('user_products', email);
        res.json({ success: true, items });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/user/products', async (req, res) => {
    try {
        const email = String(req.body?.email || '').toLowerCase();
        const items = req.body?.items || [];
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const saved = await setArrayByEmail('user_products', email, items);
        res.json({ success: true, items: saved });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Subscriptions
app.get('/api/user/subscriptions', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const items = await getArrayByEmail('user_subscriptions', email);
        res.json({ success: true, items });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/user/subscriptions', async (req, res) => {
    try {
        const email = String(req.body?.email || '').toLowerCase();
        const items = req.body?.items || [];
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const saved = await setArrayByEmail('user_subscriptions', email, items);
        res.json({ success: true, items: saved });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Referrals
app.get('/api/user/referrals', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const items = await getArrayByEmail('user_referrals', email);
        res.json({ success: true, items });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/user/referrals', async (req, res) => {
    try {
        const email = String(req.body?.email || '').toLowerCase();
        const items = req.body?.items || [];
        if (!email) return res.status(400).json({ success: false, message: 'email required' });
        const saved = await setArrayByEmail('user_referrals', email, items);
        res.json({ success: true, items: saved });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Generate Token for T-Bank API
function generateToken(params, password) {
    // Remove fields that should not be included in token calculation
    const tokenParams = { ...params };
    delete tokenParams.Token;
    delete tokenParams.Receipt;
    delete tokenParams.DATA;
    delete tokenParams.Shops;
    
    // Add password
    tokenParams.Password = password;
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(tokenParams).sort();
    
    // Create concatenated string from values
    const tokenString = sortedKeys.map(key => tokenParams[key]).join('');
    
    console.log('Token calculation:', { keys: sortedKeys, string: tokenString });
    
    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(tokenString).digest('hex');
}

// Create payment endpoint
app.post('/api/payment/create', async (req, res) => {
    try {
        const { amount, orderId, description, email, phone, name } = req.body;
        
        console.log('Creating payment:', { amount, orderId, email });
        
        // Prepare payment data for T-Bank
        const paymentData = {
            TerminalKey: TBANK_CONFIG.terminalKey,
            Amount: Math.round(amount * 100), // В копейках
            OrderId: orderId,
            Description: description,
            Receipt: {
                Email: email,
                Phone: phone,
                Taxation: 'usn_income',
                Items: [{
                    Name: description,
                    Price: Math.round(amount * 100),
                    Quantity: 1,
                    Amount: Math.round(amount * 100),
                    Tax: 'none'
                }]
            },
            DATA: {
                Name: name || 'Клиент',
                Email: email,
                Phone: phone
            },
            SuccessURL: `https://miniapp.expert/payment-success.html?orderId=${orderId}`,
            FailURL: `https://miniapp.expert/payment-failed.html?orderId=${orderId}&error=declined`,
            NotificationURL: `https://miniapp.expert/api/payment/webhook`
        };
        
        // Generate Token (include all simple fields)
        paymentData.Token = generateToken(paymentData, TBANK_CONFIG.password);
        
        // Call T-Bank API
        const response = await axios.post(`${TBANK_CONFIG.apiUrl}/Init`, paymentData);
        
        console.log('T-Bank response:', response.data);
        
        if (response.data.Success) {
            // Best-effort: create order record in PocketBase
            const authed = await ensurePbAuth();
            if (authed) {
                try {
                    await pb.collection('orders').create({
                        orderId,
                        amount,
                        status: 'NEW',
                        product: { description },
                        customer: { email, phone, name },
                        payment: { paymentId: response.data.PaymentId, paymentUrl: response.data.PaymentURL }
                    });
                } catch (e) {
                    console.error('PB create order error:', e.message);
                }
            }
            res.json({
                success: true,
                paymentId: response.data.PaymentId,
                paymentUrl: response.data.PaymentURL, // camelCase for frontend
                orderId: orderId
            });
        } else {
            throw new Error(response.data.Message || 'Payment creation failed');
        }
        
    } catch (error) {
        console.error('Payment creation error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || {}
        });
    }
});

// Check payment status endpoint
app.post('/api/payment/status', async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        const statusData = {
            TerminalKey: TBANK_CONFIG.terminalKey,
            PaymentId: paymentId
        };
        
        // Generate Token
        statusData.Token = generateToken(statusData, TBANK_CONFIG.password);
        
        // Call T-Bank API
        const response = await axios.post(`${TBANK_CONFIG.apiUrl}/GetState`, statusData);
        
        res.json({
            success: response.data.Success,
            status: response.data.Status,
            paymentId: response.data.PaymentId,
            amount: response.data.Amount
        });
        
    } catch (error) {
        console.error('Status check error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint for T-Bank notifications
app.post('/api/payment/webhook', async (req, res) => {
    try {
        console.log('Webhook received:', req.body);
        
        const { Status, PaymentId, OrderId, Success, Amount } = req.body;
        
        // Update order in PocketBase (best-effort)
        const authed = await ensurePbAuth();
        if (authed && OrderId) {
            try {
                const list = await pb.collection('orders').getList(1, 1, { filter: `orderId = "${OrderId}"` });
                const rec = list.items?.[0];
                if (rec) {
                    await pb.collection('orders').update(rec.id, {
                        status: Status,
                        payment: { ...(rec.payment || {}), paymentId: PaymentId, status: Status }
                    });
                }
            } catch (e) {
                console.error('PB update order error:', e.message);
            }
        }
        
        if (Status === 'CONFIRMED') {
            console.log(`Payment confirmed: ${OrderId}, Amount: ${Amount / 100}₽`);

            // Fetch order for email details
            try {
                const list = await pb.collection('orders').getList(1, 1, { filter: `orderId = "${OrderId}"` });
                const order = list.items?.[0];
                const email = order?.customer?.email;
                const name = order?.customer?.name || order?.customer?.Name || 'Клиент';
                const product = order?.product?.description || 'Продукт';
                if (email) {
                    const magicToken = createMagicToken({ email, name, orderId: OrderId, product });
                    await sendWelcomeEmail({ to: email, name, product, orderId: OrderId, magicToken });
                }
            } catch (e) {
                console.error('Webhook email error:', e.message);
            }
        }
        
        // Always respond with OK to T-Bank
        res.send('OK');
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.send('OK'); // Still send OK to prevent retries
    }
});

// Events logging endpoint
app.post('/api/events', async (req, res) => {
    try {
        const authed = await ensurePbAuth();
        if (authed) {
            try { await pb.collection('events').create(req.body); }
            catch (e) { console.error('PB events create error:', e.message); appendJsonLine(EVENTS_FALLBACK, { ...req.body, created: new Date().toISOString() }); }
        } else {
            appendJsonLine(EVENTS_FALLBACK, { ...req.body, created: new Date().toISOString() });
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Event log error:', e.message);
        res.status(500).json({ success: false });
    }
});

// Track/update cart (abandoned carts)
app.post('/api/cart/track', async (req, res) => {
    try {
        const { cartId, userId, sessionId, status, product, totalPrice, userData, stepsCompleted, stepsRemaining, dropOffPoint } = req.body;
        const authed = await ensurePbAuth();
        if (authed && cartId) {
            // Upsert by cartId
            try {
                const list = await pb.collection('abandoned_carts').getList(1, 1, { filter: `cartId = "${cartId}"` });
                const now = new Date().toISOString();
                if (list.items?.[0]) {
                    await pb.collection('abandoned_carts').update(list.items[0].id, {
                        userId, sessionId, status, product, totalPrice, userData, stepsCompleted, stepsRemaining, dropOffPoint,
                        lastActivity: now
                    });
                } else {
                    await pb.collection('abandoned_carts').create({
                        cartId, userId, sessionId, status: status || 'active', product, totalPrice, userData,
                        stepsCompleted, stepsRemaining, dropOffPoint,
                        created: now, lastActivity: now
                    });
                }
            } catch (e) {
                console.error('PB cart track error:', e.message);
                appendJsonLine(CARTS_FALLBACK, { ...req.body, lastActivity: new Date().toISOString() });
            }
        } else {
            appendJsonLine(CARTS_FALLBACK, { ...req.body, lastActivity: new Date().toISOString() });
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Cart track error:', e.message);
        res.status(500).json({ success: false });
    }
});

// List payments for a user (by email or phone)
app.get('/api/payments', async (req, res) => {
	try {
		const { email, phone } = req.query;
		const authed = await ensurePbAuth();
		if (!authed) return res.json({ success: true, items: [] });

		// Fetch recent orders and filter on server side by customer email/phone
		// (PocketBase JSON field filtering support may vary; server-side filter is safer here)
		const result = await pb.collection('orders').getList(1, 200, { sort: '-created' });
		const items = (result.items || []).filter((rec) => {
			const recEmail = rec.customer?.email || rec.customer?.Email || '';
			const recPhone = rec.customer?.phone || rec.customer?.Phone || '';
			const byEmail = email ? String(recEmail).toLowerCase() === String(email).toLowerCase() : true;
			const byPhone = phone ? String(recPhone) === String(phone) : true;
			return byEmail && byPhone;
		}).map((rec) => ({
			orderId: rec.orderId,
			paymentId: rec.payment?.paymentId || rec.payment?.PaymentId || null,
			description: rec.product?.description || rec.product?.Description || 'Оплата заказа',
			amount: rec.amount,
			status: rec.status || rec.payment?.status || 'UNKNOWN',
			createdAt: rec.created,
		}));

		res.json({ success: true, items });
	} catch (e) {
		console.error('Payments list error:', e.message);
		res.status(500).json({ success: false, items: [], error: e.message });
	}
});

// Generate a simple receipt (HTML) for a payment
app.get('/api/payment/receipt', async (req, res) => {
	try {
		const { paymentId } = req.query;
		if (!paymentId) return res.status(400).json({ success: false, error: 'paymentId is required' });

		const authed = await ensurePbAuth();
		if (!authed) return res.status(403).json({ success: false, error: 'unauthorized' });

		// Find order by paymentId
		let order = null;
		try {
			const list = await pb.collection('orders').getList(1, 1, { filter: `payment.paymentId = "${paymentId}"` });
			order = list.items?.[0] || null;
		} catch (e) {
			console.error('PB receipt lookup error:', e.message);
		}

		if (!order) {
			return res.status(404).json({ success: false, error: 'Order not found for this paymentId' });
		}

		const amountRub = (Number(order.amount) || 0).toLocaleString('ru-RU');
		const created = new Date(order.created).toLocaleString('ru-RU');
		const description = order.product?.description || 'Оплата заказа';
		const email = order.customer?.email || '';
		const phone = order.customer?.phone || '';
		const status = order.status || order.payment?.status || 'UNKNOWN';

		const receiptHtml = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Чек по платежу ${paymentId}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#111}h1{font-size:20px;margin:0 0 12px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}.total{font-weight:700}.muted{color:#666;font-size:12px}.badge{display:inline-block;padding:4px 8px;border-radius:8px;background:#eef7ee;color:#137333;font-size:12px;font-weight:700}.badge.gray{background:#f2f2f2;color:#444}</style></head><body><h1>Кассовый чек (нефискальный)</h1><div class="muted">Этот чек сформирован системой MiniAppExpert на основании данных банка. Официальный фискальный чек отправлен на вашу почту банком/ОФД.</div><table><tr><th>Платеж</th><td>${paymentId}</td></tr><tr><th>Заказ</th><td>${order.orderId}</td></tr><tr><th>Дата</th><td>${created}</td></tr><tr><th>Описание</th><td>${description}</td></tr><tr><th>Покупатель</th><td>${email || phone || '—'}</td></tr><tr><th>Статус</th><td><span class="badge ${status === 'CONFIRMED' || status === 'AUTHORIZED' ? '' : 'gray'}">${status}</span></td></tr><tr><th class="total">Сумма</th><td class="total">${amountRub} ₽</td></tr></table><p class="muted">Для получения фискального чека проверьте электронную почту, указанную при оплате${email ? ` (${email})` : ''}. Чек формируется и отправляется банком согласно 54‑ФЗ.</p></body></html>`;

		res.json({ success: true, orderId: order.orderId, paymentId, html: receiptHtml });
	} catch (e) {
		console.error('Receipt error:', e.message);
		res.status(500).json({ success: false, error: e.message });
	}
});

// Admin: list events (last 200)
app.get('/api/admin/events', async (req, res) => {
    try {
        const authed = await ensurePbAuth();
        if (authed) {
            try {
                const result = await pb.collection('events').getList(1, 200, { sort: '-created' });
                return res.json({ success: true, items: result.items });
            } catch (e) {
                console.error('PB events list error:', e.message);
            }
        }
        // Fallback
        const fallback = readJsonLines(EVENTS_FALLBACK, 200);
        res.json({ success: true, items: fallback });
    } catch (e) {
        console.error('Admin events error:', e.message);
        res.status(500).json({ success: false, items: [] });
    }
});

// Admin: list abandoned carts (last 200)
app.get('/api/admin/abandoned', async (req, res) => {
    try {
        const authed = await ensurePbAuth();
        if (authed) {
            try {
                const result = await pb.collection('abandoned_carts').getList(1, 200, { sort: '-updated' });
                return res.json({ success: true, items: result.items });
            } catch (e) {
                console.error('PB abandoned list error:', e.message);
            }
        }
        // Fallback
        const fallback = readJsonLines(CARTS_FALLBACK, 200);
        res.json({ success: true, items: fallback });
    } catch (e) {
        console.error('Admin abandoned error:', e.message);
        res.status(500).json({ success: false, items: [] });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'miniapp-expert-api',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📍 Endpoints:`);
    console.log(`   POST /api/payment/create - Create payment`);
    console.log(`   POST /api/payment/status - Check payment status`);
    console.log(`   POST /api/payment/webhook - T-Bank webhook`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`\n💳 T-Bank Terminal: ${TBANK_CONFIG.terminalKey}`);
});

// Magic auth landing (served as minimal HTML to set localStorage and redirect)
app.get('/auth/magic', (req, res) => {
    try {
        const token = req.query.token;
        const payload = verifyMagicToken(token);
        if (!payload) {
            return res.status(400).send('<meta charset="utf-8"><div style="font-family:Arial;padding:24px">Ссылка недействительна или истекла.</div>');
        }
        const { email, name, product } = payload;
        const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход...</title></head><body><script>(function(){try{localStorage.setItem('userAuth','true');localStorage.setItem('userEmail', ${JSON.stringify(email)});localStorage.setItem('userName', ${JSON.stringify(name)});localStorage.setItem('userRegistrationDate', new Date().toISOString());var products=JSON.parse(localStorage.getItem('userProducts')||'[]');var has=products.some(function(p){return p && p.slug==='paid-product'});if(!has){products.push({slug:'paid-product',name:${JSON.stringify(product || 'Оплаченный продукт')},status:'Настройка',date:new Date().toLocaleDateString('ru-RU'),icon:'📱',appLink:'#',adminLink:'#'});localStorage.setItem('userProducts', JSON.stringify(products));}window.location.replace('/cabinet.html');}catch(e){document.write('<meta charset=\'utf-8\'><div style=\'font-family:Arial;padding:24px\'>Ошибка авторизации. Откройте личный кабинет вручную.</div>');}})();</script></body></html>`;
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (e) {
        res.status(500).send('<meta charset="utf-8"><div style="font-family:Arial;padding:24px">Ошибка. Попробуйте позднее.</div>');
    }
});

