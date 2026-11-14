import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, ORIGIN_ALLOW, UPLOAD_PATH } from './config'
import errorHandler from './middlewares/error-handler'
import { apiLimiter } from './middlewares/rate-limit'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }))
app.use(cookieParser())

app.use(
    `/${UPLOAD_PATH}`,
    serveStatic(path.join(__dirname, 'public', UPLOAD_PATH))
)

app.use(apiLimiter)
app.use(urlencoded({ extended: false, limit: '100kb', parameterLimit: 50 }))
app.use(json({ limit: '100kb' }))

app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
