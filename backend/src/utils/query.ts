import { Types } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'

export const MAX_LIMIT = 10

export const getPagination = (
    pageRaw: unknown,
    limitRaw: unknown,
    defaultLimit = 10
) => {
    const page = Math.min(
        1_000_000,
        Math.max(1, Math.floor(Number(pageRaw)) || 1)
    )
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, Math.floor(Number(limitRaw)) || defaultLimit)
    )
    return { page, limit, skip: (page - 1) * limit }
}

// Параметр запроса должен быть строкой ограниченной длины (не объектом/массивом)
export const queryString = (value: unknown, name: string, maxLength = 100) => {
    if (value === undefined || value === '') return undefined
    if (typeof value !== 'string' || value.length > maxLength) {
        throw new BadRequestError(`Некорректный параметр "${name}"`)
    }
    return value
}

export const queryNumber = (value: unknown, name: string) => {
    const str = queryString(value, name, 20)
    if (str === undefined) return undefined
    const num = Number(str)
    if (!Number.isFinite(num)) {
        throw new BadRequestError(`Некорректный параметр "${name}"`)
    }
    return num
}

export const queryDate = (value: unknown, name: string) => {
    const str = queryString(value, name, 40)
    if (str === undefined) return undefined
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) {
        throw new BadRequestError(`Некорректный параметр "${name}"`)
    }
    return date
}

export const pickSortField = (
    value: unknown,
    allowed: string[],
    fallback = 'createdAt'
) => (typeof value === 'string' && allowed.includes(value) ? value : fallback)

export const assertObjectId = (id: unknown) => {
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Передан невалидный ID')
    }
}
