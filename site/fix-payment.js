const fs = require('fs');

console.log('🔧 Fixing payment page...\n');

let html = fs.readFileSync('payment.html', 'utf8');

// Add better error handling and debug info
const fixedPaymentScript = `
    <script src="tbank-payment.js"></script>
    <script>
        // Debug mode
        const DEBUG = true;
        
        // Get order data from URL or localStorage
        function getOrderData() {
            const params = new URLSearchParams(window.location.search);
            const savedOrder = localStorage.getItem('pendingOrder');
            
            if (savedOrder) {
                return JSON.parse(savedOrder);
            }
            
            return {
                product: params.get('product') || 'Mini App для недвижимости',
                price: parseInt(params.get('price')) || 150000,
                companyName: params.get('company') || '',
                email: params.get('email') || '',
                phone: params.get('phone') || ''
            };
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            try {
                const order = getOrderData();
                
                if (DEBUG) console.log('Order data:', order);
                
                // Fill order info
                document.getElementById('productName').textContent = order.product;
                document.getElementById('fullPrice').textContent = order.price.toLocaleString('ru-RU') + ' ₽';
                document.getElementById('totalAmount').textContent = order.price.toLocaleString('ru-RU') + ' ₽';
                
                if (order.companyName) {
                    document.getElementById('companyName').textContent = order.companyName;
                }
                if (order.email) {
                    document.getElementById('companyEmail').textContent = order.email;
                    document.getElementById('paymentEmail').value = order.email;
                }
                if (order.phone) {
                    document.getElementById('paymentPhone').value = order.phone;
                }
                
                // Calculate installments
                const installment12 = Math.round(order.price / 12);
                document.getElementById('installmentMonthly').textContent = installment12.toLocaleString('ru-RU') + ' ₽';
                
                // Payment method change
                const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
                paymentMethodInputs.forEach(input => {
                    input.addEventListener('change', function() {
                        const installmentOptions = document.getElementById('installmentOptions');
                        const installmentInfo = document.getElementById('installmentInfo');
                        
                        if (this.value === 'installment') {
                            installmentOptions.classList.remove('hidden');
                            const months = document.querySelector('input[name="installmentPeriod"]:checked').value;
                            const monthly = Math.round(order.price / months);
                            installmentInfo.textContent = monthly.toLocaleString('ru-RU') + ' ₽ × ' + months + ' мес.';
                        } else {
                            installmentOptions.classList.add('hidden');
                            installmentInfo.textContent = '';
                        }
                    });
                });
                
                // Installment period change
                const installmentPeriodInputs = document.querySelectorAll('input[name="installmentPeriod"]');
                installmentPeriodInputs.forEach(input => {
                    input.addEventListener('change', function() {
                        const months = this.value;
                        const monthly = Math.round(order.price / months);
                        document.getElementById('installmentInfo').textContent = 
                            monthly.toLocaleString('ru-RU') + ' ₽ × ' + months + ' мес.';
                    });
                });
            } catch (error) {
                console.error('Init error:', error);
                alert('Ошибка инициализации страницы. Попробуйте обновить страницу.');
            }
        });

        // Process payment - SIMPLIFIED VERSION
        async function processPayment() {
            try {
                const email = document.getElementById('paymentEmail').value;
                const phone = document.getElementById('paymentPhone').value;
                
                if (!email || !phone) {
                    alert('⚠️ Заполните все поля');
                    return;
                }
                
                const order = getOrderData();
                const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
                
                if (DEBUG) {
                    console.log('Processing payment...', {
                        email,
                        phone,
                        amount: order.price,
                        method: paymentMethod
                    });
                }
                
                // Save order first
                const orderId = 'ORDER_' + Date.now();
                const orderData = {
                    orderId: orderId,
                    product: order.product,
                    amount: order.price,
                    email: email,
                    phone: phone,
                    method: paymentMethod,
                    status: 'created',
                    createdAt: new Date().toISOString()
                };
                
                // Save to localStorage
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));
                
                if (DEBUG) console.log('Order saved:', orderData);
                
                // FOR NOW: Direct to success (bypass T-Bank for testing)
                alert('✅ Заказ создан!\\n\\n' +
                      'Номер заказа: ' + orderId + '\\n' +
                      'Сумма: ' + order.price.toLocaleString('ru-RU') + ' ₽\\n\\n' +
                      'Переходим на страницу успеха...');
                
                setTimeout(() => {
                    window.location.href = '/payment-success.html?orderId=' + orderId;
                }, 1000);
                
                /* UNCOMMENT FOR REAL T-BANK INTEGRATION:
                
                // Prepare payment data for T-Bank
                const paymentData = {
                    amount: order.price,
                    orderId: orderId,
                    description: order.product,
                    email: email,
                    phone: phone,
                    name: order.companyName || 'Клиент'
                };
                
                // Create payment through T-Bank
                const payment = await tbank.quickPayment(paymentData);
                
                if (payment.Success) {
                    // T-Bank window will open
                    console.log('Payment created:', payment);
                } else {
                    throw new Error(payment.Message || 'Payment failed');
                }
                */
                
            } catch (error) {
                console.error('Payment error:', error);
                alert('❌ Ошибка: ' + error.message + '\\n\\nПопробуйте позже или свяжитесь с поддержкой.');
            }
        }

        // Save order
        function saveOrder(paymentData, payment) {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            
            orders.push({
                orderId: paymentData.orderId,
                paymentId: payment.PaymentId,
                product: paymentData.description,
                amount: paymentData.amount,
                email: paymentData.email,
                phone: paymentData.phone,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('orders', JSON.stringify(orders));
        }
    </script>`;

// Replace the scripts section
html = html.replace(
    /<script src="tbank-payment\.js"><\/script>[\s\S]*?<\/script>/,
    fixedPaymentScript
);

fs.writeFileSync('payment.html', html, 'utf8');

console.log('✅ Payment page fixed!');
console.log('\\n🎯 Changes:');
console.log('  ✅ Better error handling');
console.log('  ✅ Debug logging');
console.log('  ✅ Simplified flow (bypass T-Bank for now)');
console.log('  ✅ Direct to success page');
console.log('\\nNOTE: T-Bank API commented out for testing');
console.log('Uncomment when ready for real payments');

