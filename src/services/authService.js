import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { comparePassword } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/jwtUtils.js';

const authService = {
  async loginUser(documentoOuEmail, senha) {
    // Busca por documento ou email
    let user = await userModel.findByEmail(documentoOuEmail);
    if (!user) {
      user = await userModel.findByDocumento(documentoOuEmail);
    }
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }
    // Verifica senha
    const senhaOk = await comparePassword(senha, user.senha_hash);
    if (!senhaOk) {
      throw new AppError('Credenciais inválidas.', 401);
    }
    if (user.status !== 'Ativo') {
      throw new AppError('Sua conta está inativa. Contate o administrador.', 401);
    }
    // Gera token JWT
    const token = generateToken({ id: user.id, tipo: user.tipo });
    return token;
  },
};

export { authService };
