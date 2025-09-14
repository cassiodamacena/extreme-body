import { AppError } from '../utils/AppError.js';

const errorHandler = (err, req, res, next) => {
  console.error('ERROR 💥', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
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
