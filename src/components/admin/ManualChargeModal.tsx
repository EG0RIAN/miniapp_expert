import React, { useState } from 'react'
import { api } from '../../services/api'

interface ManualChargeModalProps {
  isOpen: boolean
  onClose: () => void
  customerEmail: string
  paymentMethods?: any[]
  mandates?: any[]
  onSuccess?: () => void
}

export default function ManualChargeModal({
  isOpen,
  onClose,
  customerEmail,
  paymentMethods = [],
  mandates = [],
  onSuccess,
}: ManualChargeModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'RUB',
    reason: '',
    channel: 'tinkoff_mit' as 'tinkoff_mit' | 'tinkoff_rko',
    paymentMethodId: '',
    mandateId: '',
    twoFactorCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.createManualCharge({
        customerEmail,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        reason: formData.reason,
        channel: formData.channel,
        paymentMethodId: formData.channel === 'tinkoff_mit' ? formData.paymentMethodId : undefined,
        mandateId: formData.channel === 'tinkoff_rko' ? formData.mandateId : undefined,
        twoFactorCode: formData.twoFactorCode,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании списания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Ручное списание</h2>
          <p className="text-sm text-gray-600 mt-1">Клиент: {customerEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Канал списания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Канал списания
            </label>
            <select
              value={formData.channel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  channel: e.target.value as 'tinkoff_mit' | 'tinkoff_rko',
                })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            >
              <option value="tinkoff_mit">MIT (Сохранённая карта)</option>
              <option value="tinkoff_rko">РКО (Мандат)</option>
            </select>
          </div>

          {/* Выбор метода оплаты или мандата */}
          {formData.channel === 'tinkoff_mit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Платёжный метод
              </label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                <option value="">Выберите карту</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.panMask} (exp: {method.expDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.channel === 'tinkoff_rko' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Мандат</label>
              <select
                value={formData.mandateId}
                onChange={(e) => setFormData({ ...formData, mandateId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                <option value="">Выберите мандат</option>
                {mandates.map((mandate) => (
                  <option key={mandate.id} value={mandate.id}>
                    {mandate.mandateNumber} ({mandate.bank})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Сумма */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                placeholder="0.00"
                required
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="RUB">₽</option>
                <option value="USD">$</option>
                <option value="EUR">€</option>
              </select>
            </div>
          </div>

          {/* Назначение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Назначение платежа
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={3}
              placeholder="Укажите причину списания"
              required
            />
          </div>

          {/* 2FA код */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код подтверждения (2FA)
            </label>
            <input
              type="text"
              value={formData.twoFactorCode}
              onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="000000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Введите код из приложения-аутентификатора
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Обработка...' : 'Списать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

