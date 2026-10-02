import { Router } from 'express'
import testController from './controller'

const router = Router()
router.post('/orders', testController.testOrder)

export default router
