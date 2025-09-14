import Joi from 'joi';
import { AppError } from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const validationOptions = {
    abortEarly: false, // Incluir todos os erros de validação
    allowUnknown: true, // Permitir chaves não definidas no schema
    stripUnknown: true, // Remover chaves não definidas
  };

  // Se o schema tem keys body/params/query, valida objeto aninhado; senão, valida req.body direto
  let validationTarget;
  const schemaKeys = Object.keys(schema.describe().keys || {});
  if (schemaKeys.length === 1 && schemaKeys[0] === 'id') {
    // Caso especial: validação de params apenas (ex: GET /:id)
    validationTarget = req.params;
  } else if (schemaKeys.includes('body') || schemaKeys.includes('params') || schemaKeys.includes('query')) {
    validationTarget = {
      body: req.body,
      params: req.params,
      query: req.query,
    };
  } else {
    validationTarget = req.body;
  }

  const { error, value } = schema.validate(validationTarget, validationOptions);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    return next(new AppError('Dados de requisição inválidos.', 400, errorMessage));
  }

  // Se a validação for bem-sucedida, substitua os objetos originais pelos valores validados e limpos
  req.body = value.body || req.body;
  req.params = value.params || req.params;
  req.query = value.query || req.query;

  next();
};

export { validate, Joi }; // Exporte Joi também para uso nos schemas de rota
