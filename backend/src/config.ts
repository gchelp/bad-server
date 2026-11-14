import crypto from 'crypto'
import { CookieOptions } from 'express'
import ms from 'ms'

const isProduction = process.env.NODE_ENV === 'production'
// Если секрет не задан в окружении, генерируем случайный при старте
const secretOrRandom = (value?: string) =>
    value || crypto.randomBytes(48).toString('hex')

export const { PORT = '3000' } = process.env
export const { DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek' } = process.env
export const ORIGIN_ALLOW = process.env.ORIGIN_ALLOW || 'http://localhost:5173'
export const JWT_SECRET = secretOrRandom(process.env.JWT_SECRET)
export const CSRF_SECRET = secretOrRandom(process.env.CSRF_SECRET)

export const ACCESS_TOKEN = {
    secret: secretOrRandom(process.env.AUTH_ACCESS_TOKEN_SECRET),
    expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m',
}
export const REFRESH_TOKEN = {
    secret: secretOrRandom(process.env.AUTH_REFRESH_TOKEN_SECRET),
    expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    cookie: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            maxAge: ms(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d'),
            path: '/',
        } as CookieOptions,
    },
}

export const CSRF_COOKIE = {
    name: '_csrf',
    options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
    } as CookieOptions,
}
