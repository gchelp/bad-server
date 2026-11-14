import { Router } from 'express'
import {
    createOrder,
    deleteOrder,
    getOrderByNumber,
    getOrderCurrentUserByNumber,
    getOrders,
    getOrdersCurrentUser,
    updateOrder,
} from '../controllers/order'
import { roleGuardMiddleware } from '../middlewares/auth'
import {
    validateOrderBody,
    validateOrderStatus,
} from '../middlewares/validations'
import { Role } from '../models/user'

const orderRouter = Router()

// Аутентификация (auth) подключена в routes/index.ts
orderRouter.post('/', validateOrderBody, createOrder)
orderRouter.get('/all', roleGuardMiddleware(Role.Admin), getOrders)
orderRouter.get('/all/me', getOrdersCurrentUser)
orderRouter.get('/me/:orderNumber', getOrderCurrentUserByNumber)
orderRouter.get(
    '/:orderNumber',
    roleGuardMiddleware(Role.Admin),
    getOrderByNumber
)
orderRouter.patch(
    '/:orderNumber',
    roleGuardMiddleware(Role.Admin),
    validateOrderStatus,
    updateOrder
)
orderRouter.delete('/:id', roleGuardMiddleware(Role.Admin), deleteOrder)

export default orderRouter
