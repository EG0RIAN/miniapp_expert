// T-Bank (Tinkoff) Payment Integration
// Documentation: https://www.tbank.ru/kassa/dev/payments/

class TBankPayment {
    constructor(terminalKey) {
        this.terminalKey = terminalKey || 'DEMO_TERMINAL'; // Замените на реальный ключ
        this.apiUrl = 'https://securepay.tinkoff.ru/v2';
    }

    // Create payment
    async createPayment(orderData) {
        const { amount, orderId, description, email, phone, name } = orderData;
        
        const paymentData = {
            TerminalKey: this.terminalKey,
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
                Name: name,
                Email: email,
                Phone: phone
            }
        };

        try {
            // В production используйте серверную интеграцию!
            // Это демо-версия для тестирования UI
            console.log('Creating T-Bank payment:', paymentData);
            
            // Симуляция ответа от T-Bank
            return {
                Success: true,
                PaymentId: 'DEMO_' + Date.now(),
                PaymentURL: this.getDemoPaymentURL(orderId, amount),
                OrderId: orderId,
                Amount: amount
            };
            
            // В production раскомментируйте:
            /*
            const response = await fetch(`${this.apiUrl}/Init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });
            
            return await response.json();
            */
        } catch (error) {
            console.error('T-Bank payment error:', error);
            throw error;
        }
    }

    // Get demo payment URL (for testing)
    getDemoPaymentURL(orderId, amount) {
        // Создаем демо URL для тестирования
        const params = new URLSearchParams({
            orderId: orderId,
            amount: amount,
            terminal: this.terminalKey
        });
        return `https://demo.tbank.ru/payment?${params.toString()}`;
    }

    // Check payment status
    async checkPaymentStatus(paymentId) {
        try {
            console.log('Checking payment status:', paymentId);
            
            // Симуляция для демо
            return {
                Success: true,
                Status: 'CONFIRMED',
                PaymentId: paymentId
            };
            
            // В production:
            /*
            const response = await fetch(`${this.apiUrl}/GetState`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    TerminalKey: this.terminalKey,
                    PaymentId: paymentId
                })
            });
            
            return await response.json();
            */
        } catch (error) {
            console.error('Check status error:', error);
            throw error;
        }
    }

    // Open payment window
    openPaymentWindow(paymentURL) {
        // Открываем окно оплаты
        const width = 600;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const paymentWindow = window.open(
            paymentURL,
            'TBankPayment',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        return paymentWindow;
    }

    // Quick payment (one-step)
    async quickPayment(orderData) {
        try {
            // Create payment
            const payment = await this.createPayment(orderData);
            
            if (!payment.Success) {
                throw new Error('Failed to create payment');
            }
            
            // Save payment info
            this.savePaymentToStorage(payment, orderData);
            
            // Open payment window
            this.openPaymentWindow(payment.PaymentURL);
            
            return payment;
        } catch (error) {
            console.error('Quick payment error:', error);
            alert('❌ Ошибка создания платежа. Попробуйте позже или свяжитесь с поддержкой.');
            throw error;
        }
    }

    // Save payment to localStorage
    savePaymentToStorage(payment, orderData) {
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        
        payments.push({
            paymentId: payment.PaymentId,
            orderId: payment.OrderId,
            amount: payment.Amount,
            description: orderData.description,
            email: orderData.email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentURL: payment.PaymentURL
        });
        
        localStorage.setItem('payments', JSON.stringify(payments));
    }

    // Get installment options
    getInstallmentOptions(amount) {
        // T-Bank рассрочка (0-0-3, 0-0-6, 0-0-12, 0-0-24)
        return [
            { months: 3, monthlyPayment: Math.round(amount / 3) },
            { months: 6, monthlyPayment: Math.round(amount / 6) },
            { months: 12, monthlyPayment: Math.round(amount / 12) },
            { months: 24, monthlyPayment: Math.round(amount / 24) }
        ];
    }
}

// Initialize T-Bank payment handler
const tbank = new TBankPayment('DEMO_TERMINAL');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TBankPayment;
}

