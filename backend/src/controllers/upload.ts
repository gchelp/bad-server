import { NextFunction, Request, Response } from 'express'
import { unlink, open } from 'fs/promises'
import { constants } from 'http2'
import { extname } from 'path'
import { UPLOAD_PATH } from '../config'
import BadRequestError from '../errors/bad-request-error'
import { MIN_FILE_SIZE } from '../middlewares/file'
import { sanitizeText } from '../utils/sanitize'

// Сигнатуры (magic bytes) разрешённых форматов
const SIGNATURES: Record<string, number[][]> = {
    '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    '.jpg': [[0xff, 0xd8, 0xff]],
    '.gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
}

const hasValidSignature = async (filePath: string, ext: string) => {
    const handle = await open(filePath, 'r')
    try {
        const buffer = Buffer.alloc(8)
        await handle.read(buffer, 0, 8, 0)
        return (SIGNATURES[ext] || []).some((signature) =>
            signature.every((byte, i) => buffer[i] === byte)
        )
    } finally {
        await handle.close()
    }
}

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    const { path: filePath, filename, size, originalname } = req.file
    try {
        const isValid =
            size >= MIN_FILE_SIZE &&
            (await hasValidSignature(filePath, extname(filename)))

        if (!isValid) {
            await unlink(filePath).catch(() => undefined)
            return next(
                new BadRequestError(
                    'Файл не прошёл проверку: недопустимый размер или содержимое'
                )
            )
        }

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName: `/${UPLOAD_PATH}/${filename}`,
            originalName: sanitizeText(originalname).slice(0, 200),
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
