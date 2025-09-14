import { verifyToken } from '../utils/jwtUtils.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js'; // Importa o inMemoryDB para buscar usuários

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

    // No futuro, substituir por userModel.findById(decoded.id)
    const currentUser = database.users.find((user) => user.id === decoded.id && user.status === 'Ativo');

    if (!currentUser) {
      return next(new AppError('O usuário pertencente a este token não existe mais ou está inativo.', 401));
    }

    req.user = currentUser;
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
    if (!req.user || !roles.includes(req.user.tipo)) {
      return next(new AppError('Você não tem permissão para realizar esta ação.', 403));
    }
    next();
  };
};

export { authenticate, authorize };
