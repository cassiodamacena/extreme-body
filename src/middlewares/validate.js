import Joi from 'joi';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware de validação que usa Joi.
 * Ele pode validar `body`, `params` e `query` da requisição.
 *
 * @param {object} schema - Um objeto contendo os schemas do Joi para `body`, `params` ou `query`.
 * Ex: { body: Joi.object({...}), params: Joi.object({...}) }
 * Também suporta a passagem direta de um schema para validar o `body` (compatibilidade).
 */
const validate = (schema) => (req, res, next) => {
  const validationOptions = {
    abortEarly: false, // Reporta todos os erros, não apenas o primeiro
    allowUnknown: true, // Permite propriedades não definidas no schema
    stripUnknown: false, // Não remove propriedades desconhecidas
  };

  const partsToValidate = [];

  // Lógica para o novo formato de schema (objeto com chaves)
  if (schema.body) partsToValidate.push({ key: 'body', schema: schema.body, data: req.body });
  if (schema.params) partsToValidate.push({ key: 'params', schema: schema.params, data: req.params });
  if (schema.query) partsToValidate.push({ key: 'query', schema: schema.query, data: req.query });

  // Lógica para o formato antigo (schema direto) para manter a compatibilidade
  if (partsToValidate.length === 0 && typeof schema.validate === 'function') {
    partsToValidate.push({ key: 'body', schema, data: req.body });
  }

  const errors = [];

  partsToValidate.forEach(part => {
    const { error } = part.schema.validate(part.data, validationOptions);
    if (error) {
      errors.push(...error.details.map(detail => detail.message.replace(/['"]/g, '')));
    }
  });

  if (errors.length > 0) {
    const errorMessage = errors.join('. ');
    return next(new AppError('Dados de requisição inválidos.', 400, errorMessage));
  }

  return next();
};

export { validate, Joi };