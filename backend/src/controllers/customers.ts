import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import escapeRegExp from '../utils/escapeRegExp'
import {
    assertObjectId,
    getPagination,
    pickSortField,
    queryDate,
    queryNumber,
    queryString,
} from '../utils/query'
import { sanitizeText } from '../utils/sanitize'

const CUSTOMER_SORT_FIELDS = [
    'createdAt',
    'totalAmount',
    'orderCount',
    'lastOrderDate',
    'name',
]

const endOfDay = (date: Date) => {
    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
}

// GET /customers?page=2&limit=5&sortField=totalAmount&sortOrder=desc&...
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = getPagination(
            req.query.page,
            req.query.limit
        )
        const sortField = pickSortField(
            req.query.sortField,
            CUSTOMER_SORT_FIELDS
        )
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

        const registrationDateFrom = queryDate(
            req.query.registrationDateFrom,
            'registrationDateFrom'
        )
        const registrationDateTo = queryDate(
            req.query.registrationDateTo,
            'registrationDateTo'
        )
        const lastOrderDateFrom = queryDate(
            req.query.lastOrderDateFrom,
            'lastOrderDateFrom'
        )
        const lastOrderDateTo = queryDate(
            req.query.lastOrderDateTo,
            'lastOrderDateTo'
        )
        const totalAmountFrom = queryNumber(
            req.query.totalAmountFrom,
            'totalAmountFrom'
        )
        const totalAmountTo = queryNumber(
            req.query.totalAmountTo,
            'totalAmountTo'
        )
        const orderCountFrom = queryNumber(
            req.query.orderCountFrom,
            'orderCountFrom'
        )
        const orderCountTo = queryNumber(req.query.orderCountTo, 'orderCountTo')
        const searchText = queryString(req.query.search, 'search')

        const filters: FilterQuery<Partial<IUser>> = {}

        if (registrationDateFrom) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: registrationDateFrom,
            }
        }

        if (registrationDateTo) {
            filters.createdAt = {
                ...filters.createdAt,
                $lte: endOfDay(registrationDateTo),
            }
        }

        if (lastOrderDateFrom) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: lastOrderDateFrom,
            }
        }

        if (lastOrderDateTo) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: endOfDay(lastOrderDateTo),
            }
        }

        if (totalAmountFrom !== undefined) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: totalAmountFrom,
            }
        }

        if (totalAmountTo !== undefined) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: totalAmountTo,
            }
        }

        if (orderCountFrom !== undefined) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: orderCountFrom,
            }
        }

        if (orderCountTo !== undefined) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: orderCountTo,
            }
        }

        if (searchText) {
            const searchRegex = new RegExp(escapeRegExp(searchText), 'i')
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ]
        }

        const options = {
            sort: { [sortField]: sortOrder } as Record<string, 1 | -1>,
            skip,
            limit,
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (error) {
        next(error)
    }
}

// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        assertObjectId(req.params.id)
        const user = await User.findById(req.params.id)
            .populate(['orders', 'lastOrder'])
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// Patch /customers/:id (разрешены только безопасные поля, роли менять нельзя)
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        assertObjectId(req.params.id)
        const { name, phone, email } = req.body
        const update: { name?: string; phone?: string; email?: string } = {}
        if (typeof name === 'string') update.name = sanitizeText(name)
        if (typeof phone === 'string') update.phone = sanitizeText(phone)
        if (typeof email === 'string') update.email = email

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            update,
            {
                new: true,
                runValidators: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        assertObjectId(req.params.id)
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
