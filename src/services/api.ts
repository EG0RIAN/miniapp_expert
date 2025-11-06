const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://miniapp.expert/api'

class ApiService {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      this.clearToken()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || error.message || 'Request failed')
    }

    return response.json()
  }

  // ========== CLIENT API ==========
  
  async getClientDashboard() {
    return this.request('/client/dashboard')
  }

  async getClientProducts() {
    return this.request('/client/products')
  }

  async renewProduct(productId: string, paymentMethodId?: string) {
    return this.request(`/client/products/${productId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    })
  }

  async getClientPayments(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/client/payments${query ? `?${query}` : ''}`)
  }

  async getPaymentReceipt(paymentId: string) {
    return this.request(`/client/payments/${paymentId}/receipt`)
  }

  async getPaymentMethods() {
    return this.request('/client/payment-methods')
  }

  async addPaymentMethod(returnUrl: string) {
    return this.request('/client/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    })
  }

  async deletePaymentMethod(methodId: string) {
    return this.request(`/client/payment-methods/${methodId}`, {
      method: 'DELETE',
    })
  }

  async getReferrals() {
    return this.request('/client/referrals')
  }

  async requestReferralPayout(amount: number, method: string) {
    return this.request('/client/referrals/request-payout', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    })
  }

  async getClientProfile() {
    return this.request('/client/profile')
  }

  async updateClientProfile(data: any) {
    return this.request('/client/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async acceptOffer(offerVersion: string) {
    return this.request('/client/profile/accept-offer', {
      method: 'POST',
      body: JSON.stringify({ offerVersion }),
    })
  }

  // ========== ADMIN API ==========

  async getCustomers(params?: { search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/admin/customers${query ? `?${query}` : ''}`)
  }

  async getCustomer(customerId: string) {
    return this.request(`/admin/customers/${customerId}`)
  }

  async updateCustomer(customerId: string, data: any) {
    return this.request(`/admin/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getManualCharges(params?: { customerEmail?: string; status?: string; page?: number }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/admin/manual-charges${query ? `?${query}` : ''}`)
  }

  async createManualCharge(data: {
    customerEmail: string
    amount: number
    currency: string
    reason: string
    channel: 'tinkoff_mit' | 'tinkoff_rko'
    paymentMethodId?: string
    mandateId?: string
    twoFactorCode: string
  }) {
    return this.request('/admin/manual-charges', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getManualCharge(chargeId: string) {
    return this.request(`/admin/manual-charges/${chargeId}`)
  }

  async cancelManualCharge(chargeId: string) {
    return this.request(`/admin/manual-charges/${chargeId}/cancel`, {
      method: 'POST',
    })
  }

  async getMandates(params?: { customerEmail?: string; status?: string; page?: number }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/admin/mandates${query ? `?${query}` : ''}`)
  }

  async createMandate(data: {
    customerEmail: string
    mandateNumber: string
    fileUrl?: string
    notes?: string
  }) {
    return this.request('/admin/mandates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMandate(mandateId: string) {
    return this.request(`/admin/mandates/${mandateId}`)
  }

  async updateMandate(mandateId: string, data: any) {
    return this.request(`/admin/mandates/${mandateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async revokeMandate(mandateId: string) {
    return this.request(`/admin/mandates/${mandateId}/revoke`, {
      method: 'POST',
    })
  }

  async getAuditLogs(params?: {
    entity?: string
    entityId?: string
    actor?: string
    startDate?: string
    endDate?: string
    action?: string
    page?: number
  }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/admin/audit-log${query ? `?${query}` : ''}`)
  }

  async getAuditLog(logId: string) {
    return this.request(`/admin/audit-log/${logId}`)
  }

  async getAuditStats(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/admin/audit-log/stats${query ? `?${query}` : ''}`)
  }

  // ========== AUTH ==========

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }
}

export const api = new ApiService()

