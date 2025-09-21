import { database, generateId } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/passwordUtils.js';

const userModel = {
  async create(userData) {
    const { documento, email, password, tipo, ...rest } = userData;

    // Verificar unicidade de documento
    const existingUserByDoc = database.users.find(u => u.documento === documento);
    if (existingUserByDoc) {
      throw new AppError('Documento já cadastrado.', 400);
    }

    // Verificar unicidade de email
    const existingUserByEmail = database.users.find(u => u.email === email);
    if (existingUserByEmail) {
      throw new AppError('Email já cadastrado.', 400);
    }

    const newUser = {
      id: generateId('users'),
      documento,
      email,
      tipo,
      senha_hash: await hashPassword(password),
      status: 'Ativo', // Default status
      created_at: new Date(),
      updated_at: new Date(),
      ...rest,
    };

    database.users.push(newUser);
    // Retorna o usuário sem o hash da senha
    const { senha_hash, ...userWithoutPassword } = newUser;
    // console.log('userModel.create retornou:', userWithoutPassword); // Removido para depuração
    return userWithoutPassword;
  },

  async findAll(filter = {}) {
    let filteredUsers = database.users;

    if (filter.tipo) {
      filteredUsers = filteredUsers.filter(user => user.tipo === filter.tipo);
    }
    if (filter.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filter.status);
    }

    // Retorna usuários sem o hash da senha
    return filteredUsers.map(user => {
      const { senha_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  async findById(id) {
  const user = database.users.find(u => u.id === id);
  if (!user) return null;
  // Retorna o usuário sem o hash da senha
  const { senha_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
  },

  async findByDocumento(documento) {
    const user = database.users.find(u => u.documento === documento);
    // Retorna o usuário com o hash da senha, pois é usado para autenticação
    return user;
  },

  async findByEmail(email) {
    const user = database.users.find(u => u.email === email);
    // Retorna o usuário com o hash da senha, pois é usado para autenticação
    return user;
  },

  async update(id, updateData) {
    const userIndex = database.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const user = database.users[userIndex];

    // Verificar unicidade de documento se estiver sendo atualizado
    if (updateData.documento && updateData.documento !== user.documento) {
      const existingUser = database.users.find(u => u.documento === updateData.documento);
      if (existingUser && existingUser.id !== id) {
        throw new AppError('Documento já cadastrado por outro usuário.', 400);
      }
    }

    // Verificar unicidade de email se estiver sendo atualizado
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = database.users.find(u => u.email === updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new AppError('Email já cadastrado por outro usuário.', 400);
      }
    }

    // Hash da nova senha se fornecida
    if (updateData.password) {
      updateData.senha_hash = await hashPassword(updateData.password);
      delete updateData.password; // Remove a senha original
    }

    const updatedUser = {
      ...user,
      ...updateData,
      updated_at: new Date(),
    };
    database.users[userIndex] = updatedUser;

    // Retorna o usuário atualizado sem o hash da senha
    const { senha_hash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },

  async remove(id) {
    const initialLength = database.users.length;
    database.users = database.users.filter(u => u.id !== id);
    if (database.users.length === initialLength) {
      throw new AppError('Usuário não encontrado para remoção.', 404);
    }
  },
};

export { userModel };
