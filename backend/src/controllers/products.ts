import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import { Error as MongooseError } from 'mongoose'
import { join } from 'path'
import { UPLOAD_PATH, UPLOAD_PATH_TEMP } from '../config'
import BadRequestError from '../errors/bad-request-error'
import ConflictError from '../errors/conflict-error'
import NotFoundError from '../errors/not-found-error'
import Product from '../models/product'
import movingFile from '../utils/movingFile'
import { getPagination } from '../utils/query'
import { sanitizeRichText, sanitizeText } from '../utils/sanitize'

const TEMP_DIR = join(__dirname, '../public', UPLOAD_PATH_TEMP)
const IMAGES_DIR = join(__dirname, '../public', UPLOAD_PATH)

// GET /product
const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, skip } = getPagination(
            req.query.page,
            req.query.limit,
            5,
            50
        )
        const products = await Product.find({}, null, { skip, limit })
        const totalProducts = await Product.countDocuments({})
        const totalPages = Math.ceil(totalProducts / limit)
        // Каталог запрашивают часто и меняется он редко - разрешаем кэш на минуту
        res.set('Cache-Control', 'public, max-age=60')
        return res.send({
            items: products,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (err) {
        return next(err)
    }
}

// POST /product
const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { description, category, price, title, image } = req.body

        // Переносим картинку из временной папки
        if (image) {
            movingFile(image.fileName, TEMP_DIR, IMAGES_DIR)
        }

        const product = await Product.create({
            description: sanitizeRichText(description),
            image,
            category: sanitizeText(category),
            price,
            title: sanitizeText(title),
        })
        return res.status(constants.HTTP_STATUS_CREATED).send(product)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof Error && error.message.includes('E11000')) {
            return next(
                new ConflictError('Товар с таким заголовком уже существует')
            )
        }
        return next(error)
    }
}

// PATCH /product/:productId
const updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params
        const { title, category, description, price, image } = req.body

        // Переносим картинку из временной папки
        if (image) {
            movingFile(image.fileName, TEMP_DIR, IMAGES_DIR)
        }

        const update: Record<string, unknown> = {}
        if (title !== undefined) update.title = sanitizeText(title)
        if (category !== undefined) update.category = sanitizeText(category)
        if (description !== undefined) {
            update.description = sanitizeRichText(description)
        }
        if (price !== undefined) update.price = price || null
        if (image) update.image = image

        const product = await Product.findByIdAndUpdate(
            productId,
            { $set: update },
            { runValidators: true, new: true }
        ).orFail(() => new NotFoundError('Нет товара по заданному id'))
        return res.send(product)
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID товара'))
        }
        if (error instanceof Error && error.message.includes('E11000')) {
            return next(
                new ConflictError('Товар с таким заголовком уже существует')
            )
        }
        return next(error)
    }
}

// DELETE /product/:productId
const deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params
        const product = await Product.findByIdAndDelete(productId).orFail(
            () => new NotFoundError('Нет товара по заданному id')
        )
        return res.send(product)
    } catch (error) {
        if (error instanceof MongooseError.CastError) {
            return next(new BadRequestError('Передан не валидный ID товара'))
        }
        return next(error)
    }
}

export { createProduct, deleteProduct, getProducts, updateProduct }
