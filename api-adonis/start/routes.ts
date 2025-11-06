/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Legacy controllers
import ApiController from '#controllers/api_controller'
import UserController from '#controllers/user_controller'
import AdminController from '#controllers/admin_controller'
import EventsController from '#controllers/events_controller'
import AuthController from '#controllers/auth_controller'

// Admin controllers
import CustomersController from '#controllers/admin/customers_controller'
import ManualChargesController from '#controllers/admin/manual_charges_controller'
import MandatesController from '#controllers/admin/mandates_controller'
import AuditLogsController from '#controllers/admin/audit_logs_controller'

// Client controllers
import DashboardController from '#controllers/client/dashboard_controller'
import ProductsController from '#controllers/client/products_controller'
import PaymentsController from '#controllers/client/payments_controller'
import PaymentMethodsController from '#controllers/client/payment_methods_controller'
import ReferralsController from '#controllers/client/referrals_controller'
import ProfilesController from '#controllers/client/profiles_controller'

router.get('/', async () => ({ ok: true }))

router.group(() => {
  // Legacy payment endpoints
  router.post('payment/create', [ApiController, 'paymentCreate'])
  router.post('payment/status', [ApiController, 'paymentStatus'])
  router.post('payment/webhook', [ApiController, 'paymentWebhook'])
  router.get('health', [ApiController, 'health'])

  // T-Bank webhook
  router.post('tbank/webhook', [ApiController, 'paymentWebhook'])

  // Legacy user data
  router.get('user/profile', [UserController, 'profileGet'])
  router.post('user/profile', [UserController, 'profilePost'])
  router.get('user/:collection', [UserController, 'itemsGet'])
  router.post('user/:collection', [UserController, 'itemsPost'])

  // Events
  router.post('events', [EventsController, 'create'])

  // Auth
  router.post('auth/login', [AuthController, 'login'])

  // ========== CLIENT PORTAL ==========
  router
    .group(() => {
      router.get('dashboard', [DashboardController, 'index'])
      
      // Products
      router.get('products', [ProductsController, 'index'])
      router.post('products/:id/renew', [ProductsController, 'renew'])
      
      // Payments
      router.get('payments', [PaymentsController, 'index'])
      router.get('payments/:id/receipt', [PaymentsController, 'receipt'])
      
      // Payment Methods
      router.get('payment-methods', [PaymentMethodsController, 'index'])
      router.post('payment-methods', [PaymentMethodsController, 'store'])
      router.delete('payment-methods/:id', [PaymentMethodsController, 'destroy'])
      
      // Referrals
      router.get('referrals', [ReferralsController, 'index'])
      router.post('referrals/request-payout', [ReferralsController, 'requestPayout'])
      
      // Profile
      router.get('profile', [ProfilesController, 'show'])
      router.patch('profile', [ProfilesController, 'update'])
      router.post('profile/accept-offer', [ProfilesController, 'acceptOffer'])
    })
    .prefix('client')
    .use(middleware.auth())

  // ========== ADMIN PANEL ==========
  router
    .group(() => {
      // Customers
      router.get('customers', [CustomersController, 'index'])
      router.get('customers/:id', [CustomersController, 'show'])
      router.patch('customers/:id', [CustomersController, 'update'])
      
      // Manual Charges
      router.get('manual-charges', [ManualChargesController, 'index'])
      router.post('manual-charges', [ManualChargesController, 'store'])
      router.get('manual-charges/:id', [ManualChargesController, 'show'])
      router.post('manual-charges/:id/cancel', [ManualChargesController, 'cancel'])
      
      // Mandates
      router.get('mandates', [MandatesController, 'index'])
      router.post('mandates', [MandatesController, 'store'])
      router.get('mandates/:id', [MandatesController, 'show'])
      router.patch('mandates/:id', [MandatesController, 'update'])
      router.post('mandates/:id/revoke', [MandatesController, 'revoke'])
      
      // Audit Logs
      router.get('audit-log', [AuditLogsController, 'index'])
      router.get('audit-log/:id', [AuditLogsController, 'show'])
      router.get('audit-log/stats', [AuditLogsController, 'stats'])

      // Legacy admin endpoints
      router.get('events', [AdminController, 'events'])
      router.get('abandoned', [AdminController, 'abandoned'])
    })
    .prefix('admin')
    .use([middleware.auth(), middleware.admin()])
}).prefix('api')

router.get('/auth/magic', [ApiController, 'magic'])
