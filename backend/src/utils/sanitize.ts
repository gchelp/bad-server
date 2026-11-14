import sanitizeHtml from 'sanitize-html'

// Убирает любые HTML-теги и атрибуты, оставляет только текст
export const sanitizeText = (value: string): string =>
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
        .replace(/&amp;/g, '&')
        .trim()

// Для описания товара из WYSIWYG: безопасный минимум разметки, без javascript: в ссылках
export const sanitizeRichText = (value: string): string =>
    sanitizeHtml(value, {
        allowedTags: [
            'b',
            'i',
            'em',
            'strong',
            'u',
            'p',
            'br',
            'ul',
            'ol',
            'li',
            'a',
        ],
        allowedAttributes: { a: ['href', 'rel', 'target'] },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowProtocolRelative: false,
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', {
                rel: 'noopener noreferrer',
                target: '_blank',
            }),
        },
    })
