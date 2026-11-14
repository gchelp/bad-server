import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'

// Безопасное выражение: без вложенных квантификаторов, длина ограничена
export const phoneRegExp = /^\+?[\d\s\-()]{5,20}$/
export const imagePathRegExp = /^\/[\w-]+\/[\w-][\w.-]*$/

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

const email = () => Joi.string().email().max(254)

// валидация id
export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .min(1)
            .max(50)
            .required()
            .messages({
                'array.min': 'Не указаны товары',
                'array.empty': 'Не указаны товары',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: email().required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().required().max(20).pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: Joi.string().required().max(200).messages({
            'string.empty': 'Не указан адрес',
        }),
        total: Joi.number().positive().required().messages({
            'number.base': 'Не указана сумма заказа',
        }),
        comment: Joi.string().optional().allow('').max(500),
    }),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required().max(200).pattern(imagePathRegExp),
            originalName: Joi.string().required().max(200),
        }),
        category: Joi.string().required().max(50).messages({
            'string.empty': 'Поле "category" должно быть заполнено',
        }),
        description: Joi.string().required().max(5000).messages({
            'string.empty': 'Поле "description" должно быть заполнено',
        }),
        price: Joi.number().allow(null),
    }),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required().max(200).pattern(imagePathRegExp),
            originalName: Joi.string().required().max(200),
        }),
        category: Joi.string().max(50),
        description: Joi.string().max(5000),
        price: Joi.number().allow(null),
    }),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        password: Joi.string().min(6).max(72).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: email()
            .required()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: email()
            .required()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().required().max(72).messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})

// Профиль: только разрешённые поля (роли и прочее изменить нельзя)
export const validateProfileBody = celebrate({
    body: Joi.object()
        .keys({
            name: Joi.string().min(2).max(30),
            email: email(),
            phone: Joi.string().max(20).pattern(phoneRegExp),
        })
        .min(1),
})

export const validateOrderStatus = celebrate({
    body: Joi.object()
        .keys({
            status: Joi.string()
                .valid('new', 'delivering', 'completed', 'cancelled')
                .required(),
        })
        .unknown(true),
})
