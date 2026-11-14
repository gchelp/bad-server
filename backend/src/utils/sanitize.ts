import sanitizeHtml from 'sanitize-html'

// Убирает любые HTML-теги и атрибуты, оставляет только текст
export const sanitizeText = (value: string): string =>
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
        .replace(/&amp;/g, '&')
        .trim()
