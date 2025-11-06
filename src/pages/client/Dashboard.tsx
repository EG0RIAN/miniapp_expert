import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

export default function ClientDashboard() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.getClientDashboard()
      setDashboard(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Личный кабинет</h1>

        {/* Баланс и статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Баланс</div>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard?.balance || 0} ₽
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Активные продукты</div>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard?.activeProducts?.length || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Реферальный доход</div>
            <div className="text-3xl font-bold text-gray-900">
              {dashboard?.referralStats?.earned || 0} ₽
            </div>
          </div>
        </div>

        {/* Навигация */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/client/products"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">📦 Мои продукты</div>
            <div className="text-gray-600">Управление подписками</div>
          </Link>

          <Link
            to="/client/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">💳 Платежи</div>
            <div className="text-gray-600">История оплат</div>
          </Link>

          <Link
            to="/client/payment-methods"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">💰 Способы оплаты</div>
            <div className="text-gray-600">Управление картами</div>
          </Link>

          <Link
            to="/client/referrals"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">🎁 Реферальная программа</div>
            <div className="text-gray-600">Приглашайте друзей</div>
          </Link>

          <Link
            to="/client/profile"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">👤 Профиль</div>
            <div className="text-gray-600">Настройки аккаунта</div>
          </Link>
        </div>

        {/* Последние транзакции */}
        {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Последние операции</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboard.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="p-6 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{tx.description}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{tx.amount} ₽</div>
                    <div
                      className={`text-sm ${
                        tx.status === 'success'
                          ? 'text-green-600'
                          : tx.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.status === 'success'
                        ? 'Успешно'
                        : tx.status === 'pending'
                        ? 'В обработке'
                        : 'Ошибка'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

