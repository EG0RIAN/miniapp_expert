import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Админ-панель</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Статистика */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Клиенты</div>
            <div className="text-3xl font-bold text-gray-900">--</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Активные продукты</div>
            <div className="text-3xl font-bold text-gray-900">--</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Платежи сегодня</div>
            <div className="text-3xl font-bold text-gray-900">--</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Выручка</div>
            <div className="text-3xl font-bold text-gray-900">-- ₽</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Навигация */}
          <Link
            to="/admin/customers"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">👥 Клиенты</div>
            <div className="text-gray-600">Управление клиентами и их данными</div>
          </Link>

          <Link
            to="/admin/manual-charges"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">💳 Ручные списания</div>
            <div className="text-gray-600">MIT и РКО списания</div>
          </Link>

          <Link
            to="/admin/mandates"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">📄 Мандаты</div>
            <div className="text-gray-600">Управление мандатами РКО</div>
          </Link>

          <Link
            to="/admin/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">💰 Платежи</div>
            <div className="text-gray-600">История всех платежей</div>
          </Link>

          <Link
            to="/admin/audit-log"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">📊 Журнал аудита</div>
            <div className="text-gray-600">Логи всех действий</div>
          </Link>

          <Link
            to="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-xl font-bold text-gray-900 mb-2">⚙️ Настройки</div>
            <div className="text-gray-600">Конфигурация системы</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

