import rateLimit from 'express-rate-limit'

// 30 запросов за 10 секунд с одного IP (в минуту это существенно больше 10)
export const apiLimiter = rateLimit({
    windowMs: 10 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Слишком много запросов, попробуйте позже' },
})
