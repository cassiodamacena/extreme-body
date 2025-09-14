import { AppError } from '../utils/AppError.js';
import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  // Apenas loga o erro se não estiver em ambiente de teste OU se for um erro não operacional (inesperado)
  // Isso mantém o output do teste limpo para erros esperados (4xx).
  if (process.env.NODE_ENV !== 'test' || !err.isOperational) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });
  }

  if (err.isOperational) {
    // Padroniza status para 'error' em autenticação/autorização
    let status = err.status;
    if (err.statusCode === 401 || err.statusCode === 403) {
      status = 'error';
    }
    // Inclui detalhes do Joi na mensagem principal se houver
    let message = err.message;
    if (err.details) {
      message += ' ' + err.details;
    }
    return res.status(err.statusCode).json({
      status,
      message,
      details: err.details,
    });
  }

  // Erros de programação ou outros erros desconhecidos: não vazar detalhes
  return res.status(500).json({
    status: 'error',
    message: 'Algo deu muito errado!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined, // Apenas em dev para debug
  });
};

export { errorHandler };
