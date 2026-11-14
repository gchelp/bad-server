import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import BadRequestError from '../errors/bad-request-error'

export default function serveStatic(baseDir: string) {
    const root = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next()
        }

        let requestedPath: string
        try {
            requestedPath = decodeURIComponent(req.path)
        } catch (_error) {
            return next(new BadRequestError('Некорректный путь'))
        }
        if (requestedPath.includes('\0')) {
            return next(new BadRequestError('Некорректный путь'))
        }

        // Итоговый путь обязан остаться внутри разрешённой папки
        const filePath = path.resolve(root, `.${requestedPath}`)
        if (!filePath.startsWith(root + path.sep)) {
            return next()
        }

        return fs.stat(filePath, (statError, stats) => {
            if (statError || !stats.isFile()) {
                return next()
            }
            return res.sendFile(
                filePath,
                { dotfiles: 'deny', maxAge: '1d' },
                (sendError) => {
                    if (sendError) {
                        next(sendError)
                    }
                }
            )
        })
    }
}
