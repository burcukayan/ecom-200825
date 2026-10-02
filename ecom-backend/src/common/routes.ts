import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth'
import { syncUser } from '../middlewares/syncUser'
import { getProfile, updateProfile } from '../controllers/user.controller'
import { cancelMyOrder, getMyOrder, getMyOrders } from '../controllers/order.controller'
import { listUsers } from '../controllers/admin-user.controller'
import { getStats } from '../controllers/admin-stats.controller'
import { env } from './env'
import { cancelOrder, listOrders, updateOrderStatus } from '../controllers/admin-order.controller'
import testRouter from '../resources/test/routes'

const router: Router = Router()

if (env.NODE_ENV !== 'production') {
  router.use('/test', testRouter)
}

router.get('/profile', requireAuth, syncUser, getProfile)
router.put('/profile', requireAuth, syncUser, updateProfile)
router.get('/orders', requireAuth, syncUser, getMyOrders)
router.get('/orders/:id', requireAuth, syncUser, getMyOrder)
router.post('/orders/:id/cancel', requireAuth, syncUser, cancelMyOrder)
router.get('/admin/orders', requireAuth, requireRole('admin'), listOrders)
router.patch('/admin/orders/:id/status', requireAuth, requireRole('admin'), updateOrderStatus)
router.post('/admin/orders/:id/cancel', requireAuth, requireRole('admin'), cancelOrder)
router.get('/admin/users', requireAuth, requireRole('admin'), listUsers)
router.get('/admin/stats', requireAuth, requireRole('admin'), getStats)

export default router
