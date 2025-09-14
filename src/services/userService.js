import { userModel } from '../models/userModel.js';
import { studentProfileModel } from '../models/studentProfileModel.js';
import { instructorProfileModel } from '../models/instructorProfileModel.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js'; // Para checagem de vínculos

const userService = {
  async createUser(userData, userType) {
    if (userType === 'Aluno') {
      const { profileData, ...userBaseData } = userData;
      const newUser = await userModel.create({ ...userBaseData, tipo: 'Aluno' });
      await studentProfileModel.create({ ...profileData, user_id: newUser.id });
      return newUser;
    } else if (userType === 'Instrutor') {
      const { profileData, ...userBaseData } = userData;
      // Valida CREF antes de criar o perfil
      if (!profileData || !profileData.cref) {
        throw new AppError('CREF é obrigatório para instrutores.', 400);
      }
      const newUser = await userModel.create({ ...userBaseData, tipo: 'Instrutor' });
      await instructorProfileModel.create({ ...profileData, user_id: newUser.id });
      return newUser;
    } else if (userType === 'Admin') {
      const newUser = await userModel.create({ ...userData, tipo: 'Admin' });
      return newUser;
    } else {
      throw new AppError('Tipo de usuário inválido.', 400);
    }
  },

  async getAllUsers(requestingUserId, requestingUserType, filter = {}) {
    let users = await userModel.findAll(filter);

    // Complementa com dados de perfil
    users = await Promise.all(users.map(async (user) => {
      let profile = null;
      if (user.tipo === 'Aluno') {
        profile = await studentProfileModel.findByUserId(user.id);
      } else if (user.tipo === 'Instrutor') {
        profile = await instructorProfileModel.findByUserId(user.id);
      }
      return { ...user, profile };
    }));

    // Lógica de autorização granular
    if (requestingUserType === 'Admin') {
      return users; // Admin vê todos
    } else if (requestingUserType === 'Instrutor') {
      // Instrutor vê a si mesmo e seus alunos
      const instructorProfile = await instructorProfileModel.findByUserId(requestingUserId);
      if (!instructorProfile) throw new AppError('Perfil de instrutor não encontrado.', 404);

      const students = users.filter(user =>
        user.tipo === 'Aluno' && user.profile && user.profile.instructor_id === requestingUserId
      );
      const self = users.filter(user => user.id === requestingUserId);
      return [...self, ...students];
    } else if (requestingUserType === 'Aluno') {
      // Aluno vê apenas a si mesmo
      return users.filter(user => user.id === requestingUserId);
    }
    return [];
  },

  async getUserById(id, requestingUserId, requestingUserType) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    let profile = null;
    if (user.tipo === 'Aluno') {
      profile = await studentProfileModel.findByUserId(user.id);
    } else if (user.tipo === 'Instrutor') {
      profile = await instructorProfileModel.findByUserId(user.id);
    }

    const fullUser = { ...user, profile };

    // Lógica de autorização granular para leitura individual
    if (requestingUserType === 'Admin') {
      return fullUser;
    } else if (requestingUserType === 'Instrutor') {
      if (user.id === requestingUserId) { // Instrutor pode ver a si mesmo
        return fullUser;
      }
      // Instrutor pode ver seus alunos
      if (user.tipo === 'Aluno' && user.profile && user.profile.instructor_id === requestingUserId) {
        return fullUser;
      }
      throw new AppError('Você não tem permissão para visualizar este usuário.', 403);
    } else if (requestingUserType === 'Aluno') {
      if (user.id === requestingUserId) { // Aluno pode ver a si mesmo
        return fullUser;
      }
      throw new AppError('Você não tem permissão para visualizar este usuário.', 403);
    }

    throw new AppError('Você não tem permissão para visualizar este usuário.', 403);
  },

  async updateUser(id, updateData, requestingUserId, requestingUserType) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Lógica de autorização granular para atualização
    if (requestingUserType === 'Admin') {
      // Admin pode atualizar qualquer um
    } else if (requestingUserType === 'Instrutor') {
      if (user.id === requestingUserId) { // Instrutor pode atualizar a si mesmo
        // Permite atualizar dados básicos do usuário e o perfil do instrutor
        if (updateData.profileData) {
          await instructorProfileModel.update(user.id, updateData.profileData);
          delete updateData.profileData;
        }
      } else if (user.tipo === 'Aluno' && user.profile && user.profile.instructor_id === requestingUserId) {
        // Instrutor pode atualizar seus alunos
        // Permite atualizar dados básicos do usuário e o perfil do aluno
        if (updateData.profileData) {
          await studentProfileModel.update(user.id, updateData.profileData);
          delete updateData.profileData;
        }
      } else {
        throw new AppError('Você não tem permissão para atualizar este usuário.', 403);
      }
    } else if (requestingUserType === 'Aluno') {
      if (user.id === requestingUserId) { // Aluno pode atualizar a si mesmo
        // Permite atualizar dados básicos do usuário (exceto tipo e status) e o perfil do aluno
        if (updateData.tipo || updateData.status) {
          throw new AppError('Você não pode alterar o tipo ou status do seu usuário.', 403);
        }
        if (updateData.profileData) {
          await studentProfileModel.update(user.id, updateData.profileData);
          delete updateData.profileData;
        }
      } else {
        throw new AppError('Você não tem permissão para atualizar este usuário.', 403);
      }
    } else {
      throw new AppError('Você não tem permissão para atualizar este usuário.', 403);
    }

    return await userModel.update(id, updateData);
  },

  async deleteUser(id, requestingUserId, requestingUserType) {
    const user = await userModel.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Lógica de autorização granular para exclusão
    if (requestingUserType === 'Admin') {
      // Admin pode deletar qualquer um (com as verificações abaixo)
    } else if (requestingUserType === 'Instrutor') {
      if (user.id === requestingUserId) { // Instrutor não pode deletar a si mesmo (se tiver alunos, etc.)
        throw new AppError('Instrutores não podem deletar suas próprias contas diretamente através desta API, especialmente se tiverem alunos ou planos associados. Contate um administrador.', 403);
      }
      if (user.tipo === 'Aluno') {
        const studentProfile = await studentProfileModel.findByUserId(user.id);
        if (studentProfile && studentProfile.instructor_id === requestingUserId) {
          // Instrutor pode deletar seus alunos
        } else {
          throw new AppError('Você não tem permissão para deletar este aluno.', 403);
        }
      } else {
        throw new AppError('Você não tem permissão para deletar este tipo de usuário.', 403);
      }
    } else if (requestingUserType === 'Aluno') {
      if (user.id === requestingUserId) { // Aluno pode deletar a si mesmo
        // Permitir que o aluno se delete
      } else {
        throw new AppError('Você não tem permissão para deletar este usuário.', 403);
      }
    } else {
      throw new AppError('Você não tem permissão para deletar este usuário.', 403);
    }

    // **Verificações de vinculação antes da exclusão (simulando FKs)**
    // Checar planos de treino associados
    const hasWorkoutPlans = database.workoutPlans.some(
      (plan) => plan.student_id === id || plan.instructor_id === id
    );
    if (hasWorkoutPlans) {
      throw new AppError('Não é possível remover o usuário: existem planos de treino associados. Desvincule ou inative-o primeiro.', 400);
    }

    // Checar sessões de treino associadas
    const hasSessions = database.sessions.some((session) => session.student_id === id);
    if (hasSessions) {
      throw new AppError('Não é possível remover o usuário: existem sessões de treino associadas. Desvincule ou inative-o primeiro.', 400);
    }

    // Se tudo ok, remover perfil e depois o usuário
    if (user.tipo === 'Aluno') {
      await studentProfileModel.remove(user.id);
    } else if (user.tipo === 'Instrutor') {
      await instructorProfileModel.remove(user.id);
    }

    await userModel.remove(user.id);
  },
};

export { userService };
