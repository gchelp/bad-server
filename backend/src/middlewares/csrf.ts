import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { CSRF_COOKIE, CSRF_SECRET } from '../config'
import ForbiddenError from '../errors/forbidden-error'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const sign = (token: string) =>
    crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex')

const safeEqual = (a: string, b: string) => {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

export const issueCsrfToken = (_req: Request, res: Response) => {
    const csrfToken = crypto.randomBytes(32).toString('hex')
    res.cookie(
        CSRF_COOKIE.name,
        `${csrfToken}.${sign(csrfToken)}`,
        CSRF_COOKIE.options
    )
    res.set('Cache-Control', 'no-store')
    res.json({ csrfToken })
}

export const csrfProtection = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (SAFE_METHODS.has(req.method)) {
        return next()
    }
    const cookie = req.cookies?.[CSRF_COOKIE.name]
    const header = req.get('x-csrf-token')
    if (typeof cookie !== 'string' || typeof header !== 'string') {
        return next(new ForbiddenError('CSRF-токен отсутствует'))
    }
    const [token, signature] = cookie.split('.')
    if (
        !token ||
        !signature ||
        !safeEqual(signature, sign(token)) ||
        !safeEqual(token, header)
    ) {
        return next(new ForbiddenError('Недействительный CSRF-токен'))
    }
    next()
}
