// Payment integration with Backend API
// This version uses server-side T-Bank integration (secure)

const PaymentAPI = {
    apiUrl: 'https://miniapp.expert/api', // Update to your API URL
    
    // Create payment through backend
    async createPayment(orderData) {
        try {
            const response = await fetch(`${this.apiUrl}/payment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Payment creation failed');
            }
            
            return result;
        } catch (error) {
            console.error('Payment API error:', error);
            throw error;
        }
    },
    
    // Check payment status
    async checkStatus(paymentId) {
        try {
            const response = await fetch(`${this.apiUrl}/payment/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentId })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Status check error:', error);
            throw error;
        }
    },
    
    // Open payment window
    openPaymentWindow(paymentURL) {
        const width = 600;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const paymentWindow = window.open(
            paymentURL,
            'TBankPayment',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        // Monitor payment window
        const checkWindow = setInterval(() => {
            if (paymentWindow.closed) {
                clearInterval(checkWindow);
                console.log('Payment window closed');
                // Check payment status
                this.checkPaymentCompletion();
            }
        }, 1000);
        
        return paymentWindow;
    },
    
    // Check if payment completed
    async checkPaymentCompletion() {
        const orderId = new URLSearchParams(window.location.search).get('orderId');
        if (!orderId) return;
        
        // Add logic to check with backend
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    },
    
    // Quick payment (all in one)
    async quickPayment(orderData) {
        try {
            // Create payment via backend
            const payment = await this.createPayment(orderData);
            
            if (payment.success && payment.paymentURL) {
                // Save payment info
                this.savePaymentToStorage(payment, orderData);
                
                // Open payment window
                this.openPaymentWindow(payment.paymentURL);
                
                return payment;
            } else {
                throw new Error('Failed to create payment');
            }
        } catch (error) {
            console.error('Quick payment error:', error);
            throw error;
        }
    },
    
    // Save payment to localStorage
    savePaymentToStorage(payment, orderData) {
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        
        payments.push({
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            amount: orderData.amount,
            description: orderData.description,
            email: orderData.email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentURL: payment.paymentURL
        });
        
        localStorage.setItem('payments', JSON.stringify(payments));
    }
};

// Export for use in payment.html
if (typeof window !== 'undefined') {
    window.PaymentAPI = PaymentAPI;
}

