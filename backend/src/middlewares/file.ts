import crypto from 'crypto'
import { Express, Request } from 'express'
import { mkdirSync } from 'fs'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import { UPLOAD_PATH_TEMP } from '../config'
import BadRequestError from '../errors/bad-request-error'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MIN_FILE_SIZE = 2 * 1024

// SVG не разрешаем: он может содержать скрипты (XSS)
const EXTENSIONS: Record<string, string> = {
    'image/png': '.png',
    'image/jpg': '.jpg',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
}

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const destinationPath = join(__dirname, '../public', UPLOAD_PATH_TEMP)
        mkdirSync(destinationPath, { recursive: true })
        cb(null, destinationPath)
    },

    // Имя формируем сами: оригинальное имя пользователя в путь не попадает
    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`)
    },
})

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!EXTENSIONS[file.mimetype]) {
        return cb(new BadRequestError('Недопустимый тип файла'))
    }
    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 3 },
})
