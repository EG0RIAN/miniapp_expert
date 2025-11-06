/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import ApiController from '#controllers/api_controller'
import UserController from '#controllers/user_controller'
import AdminController from '#controllers/admin_controller'
import EventsController from '#controllers/events_controller'
import AuthController from '#controllers/auth_controller'

router.get('/', async () => ({ ok: true }))

router.group(() => {
  router.post('payment/create', [ApiController, 'paymentCreate'])
  router.post('payment/status', [ApiController, 'paymentStatus'])
  router.post('payment/webhook', [ApiController, 'paymentWebhook'])
  router.get('health', [ApiController, 'health'])

  // User data
  router.get('user/profile', [UserController, 'profileGet'])
  router.post('user/profile', [UserController, 'profilePost'])
  router.get('user/:collection', [UserController, 'itemsGet'])
  router.post('user/:collection', [UserController, 'itemsPost'])

  router.post('events', [EventsController, 'create'])
  router.get('admin/events', [AdminController, 'events'])
  router.get('admin/abandoned', [AdminController, 'abandoned'])
  router.post('auth/login', [AuthController, 'login'])
}).prefix('api')

router.get('/auth/magic', [ApiController, 'magic'])
