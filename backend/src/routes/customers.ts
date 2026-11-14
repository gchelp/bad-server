import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'

const customerRouter = Router()

// Аутентификация (auth) подключена в routes/index.ts; все маршруты только для админа
customerRouter.use(roleGuardMiddleware(Role.Admin))
customerRouter.get('/', getCustomers)
customerRouter.get('/:id', getCustomerById)
customerRouter.patch('/:id', updateCustomer)
customerRouter.delete('/:id', deleteCustomer)

export default customerRouter
