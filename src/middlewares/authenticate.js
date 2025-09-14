
import { verifyToken } from '../utils/jwtUtils.js';
import { AppError } from '../utils/AppError.js';
import { userModel } from '../models/userModel.js'; // Importa o userModel
import logger from '../config/logger.js';

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Você não está logado! Por favor, faça login para ter acesso.', 401));
    }

    const decoded = verifyToken(token);

    // Substituído por userModel.findById(decoded.id)
    const currentUser = await userModel.findById(decoded.id); // userModel.findById já retorna sem senha_hash
    // É importante que o `type` do usuário no token seja usado para a autorização,
    // mas aqui buscamos o usuário completo para ter certeza de que ele ainda existe e está ativo.

    if (!currentUser || currentUser.status !== 'Ativo') { // Verifica o status do usuário
      return next(new AppError('O usuário pertencente a este token não existe mais ou está inativo.', 401));
    }

    req.user = currentUser; // Anexa o usuário (sem senha_hash) à requisição
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Seu token expirou! Por favor, faça login novamente.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido! Por favor, faça login novamente.', 401));
    }
    next(new AppError('Erro de autenticação.', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten roles array in case it's nested
    const allowedRoles = roles.flat();
    logger.debug(`[authorize] User Type: ${req.user?.tipo} | Allowed Roles: ${allowedRoles.join(', ')}`);
    if (!req.user || !allowedRoles.includes(req.user.tipo)) {
      logger.warn(`[authorize] Permission denied for user type: ${req.user?.tipo}`);
      return next(new AppError('Você não tem permissão para realizar esta ação.', 403, 'Role not allowed'));
    }
    next();
  };
};

export { authenticate, authorize };
