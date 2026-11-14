import { ErrorRequestHandler } from 'express'
import { MulterError } from 'multer'

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    let statusCode = Number(err.statusCode || err.status) || 500
    let { message } = err

    if (err instanceof MulterError) {
        statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
        message =
            err.code === 'LIMIT_FILE_SIZE'
                ? 'Файл слишком большой'
                : 'Ошибка загрузки файла'
    } else if (err.type === 'entity.too.large') {
        message = 'Слишком большой запрос'
    } else if (err.type === 'entity.parse.failed') {
        message = 'Некорректный формат запроса'
    }

    if (statusCode >= 500) {
        // Подробности только в лог (одной строкой), клиенту - общее сообщение
        console.error('[error]', err.message)
        message = 'На сервере произошла ошибка'
    }

    if (res.headersSent) {
        return next(err)
    }
    return res.status(statusCode).send({ message })
}

export default errorHandler
