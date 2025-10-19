const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
            await pb.collection('events').create(req.body);
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Event log error:', e.message);
        res.status(500).json({ success: false });
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

