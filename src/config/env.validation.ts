import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  JWT_ACCESS_SECRET: Joi.string().min(32).required().messages({
    'string.base': 'JWT_ACCESS_SECRET must be a string',
    'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters long',
    'any.required': 'JWT_ACCESS_SECRET is required',
  }),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).default(7),
  BOOTSTRAP_ADMIN_EMAIL: Joi.string().email().empty('').optional(),
  BOOTSTRAP_ADMIN_PASSWORD: Joi.string().min(8).empty('').optional(),
})
  .and('BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD')
  .messages({
    'object.and':
      'BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be provided together',
  })
  .unknown(true);
