import { authService } from '../services/authService.js';
import { AppError } from '../utils/AppError.js';

const authController = {
  async login(req, res, next) {
    try {
      const { documentoOuEmail, senha } = req.body;
      const token = await authService.loginUser(documentoOuEmail, senha);
      res.status(200).json({
        status: 'success',
        token,
      });
    } catch (error) {
      next(error);
    }
  },
};

export { authController };
