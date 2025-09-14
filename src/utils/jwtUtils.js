import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Opcional: tratar diferentes tipos de erro JWT (TokenExpiredError, JsonWebTokenError)
    throw new Error('Token inválido ou expirado.');
  }
};

export { generateToken, verifyToken };
