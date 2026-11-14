import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import { roleGuardMiddleware } from '../middlewares/auth'
import fileMiddleware from '../middlewares/file'
import { Role } from '../models/user'

const uploadRouter = Router()

// Аутентификация (auth) подключена в routes/index.ts; загружать может только админ
uploadRouter.post(
    '/',
    roleGuardMiddleware(Role.Admin),
    fileMiddleware.single('file'),
    uploadFile
)

export default uploadRouter
