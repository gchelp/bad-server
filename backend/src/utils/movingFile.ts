import { existsSync, mkdirSync, renameSync } from 'fs'
import { basename, join } from 'path'

function movingFile(imagePath: string, from: string, to: string) {
    const fileName = basename(imagePath)
    if (!fileName || fileName.startsWith('.')) {
        throw new Error('Ошибка при сохранении файла')
    }
    const imagePathTemp = join(from, fileName)
    const imagePathPermanent = join(to, fileName)

    mkdirSync(to, { recursive: true })
    if (!existsSync(imagePathTemp)) {
        throw new Error('Ошибка при сохранении файла')
    }

    renameSync(imagePathTemp, imagePathPermanent)
}

export default movingFile
