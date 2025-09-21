import { userModel } from '../models/userModel.js';
import { database } from '../models/inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

/**
 * Helper para buscar o perfil de um usuário
 */
const getProfile = (user) => {
  if (!user) return null;
  if (user.tipo === 'Aluno') {
    return database.studentProfiles.find(p => p.user_id === user.id) || null;
  }
  if (user.tipo === 'Instrutor') {
    return database.instructorProfiles.find(p => p.user_id === user.id) || null;
  }
  return null;
};

/**
 * Helper para verificar se um instrutor é responsável por um aluno
 */
const isInstructorOfStudent = (instructorId, studentId) => {
  const studentProfile = database.studentProfiles.find(p => p.user_id === studentId);
  return studentProfile?.instructor_id === instructorId;
};


const userService = {
  async createUser(userData, profileData, userType) {
    // console.log('userService.createUser chamado com:', { userData, profileData, userType }); // Removido para depuração
    const newUser = await userModel.create({ ...userData, tipo: userType });

    if (userType === 'Aluno') {
      database.studentProfiles.push({ user_id: newUser.id, ...profileData });
    } else if (userType === 'Instrutor') {
      database.instructorProfiles.push({ user_id: newUser.id, ...profileData });
    }

    newUser.profile = getProfile(newUser);
    return newUser;
  },

  async getAllUsers(requestingUser, filters) {
    let users;

    switch (requestingUser.tipo) {
      case 'Admin':
        users = await userModel.findAll(filters);
        break;
      case 'Instrutor':
        const allUsers = await userModel.findAll(filters);
        users = allUsers.filter(user =>
          user.id === requestingUser.id || // O próprio instrutor
          (user.tipo === 'Aluno' && isInstructorOfStudent(requestingUser.id, user.id)) // Seus alunos
        );
        break;
      case 'Aluno':
        users = [requestingUser]; // Aluno só pode ver a si mesmo
        break;
      default:
        users = [];
    }

    // Adiciona o perfil a cada usuário
    return users.map(user => ({
      ...user,
      profile: getProfile(user),
    }));
  },

  async getUserById(targetId, requestingUser) {
    const targetUser = await userModel.findById(targetId);
    if (!targetUser) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Verificação de permissão
    const isAdmin = requestingUser.tipo === 'Admin';
    const isOwner = requestingUser.id === targetUser.id;
    const isMyStudent = requestingUser.tipo === 'Instrutor' &&
                        targetUser.tipo === 'Aluno' &&
                        isInstructorOfStudent(requestingUser.id, targetUser.id);

    if (!isAdmin && !isOwner && !isMyStudent) {
      throw new AppError('Você não tem permissão para visualizar este usuário.', 403);
    }

    targetUser.profile = getProfile(targetUser);
    return targetUser;
  },

  async updateUser(targetId, updateData, requestingUser) {
    const targetUser = await userModel.findById(targetId);
    if (!targetUser) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Verificação de permissão
    const isAdmin = requestingUser.tipo === 'Admin';
    const isOwner = requestingUser.id === targetUser.id;
    const isMyStudent = requestingUser.tipo === 'Instrutor' &&
                        targetUser.tipo === 'Aluno' &&
                        isInstructorOfStudent(requestingUser.id, targetUser.id);

    if (!isAdmin && !isOwner && !isMyStudent) {
      throw new AppError('Você não tem permissão para atualizar este usuário.', 403);
    }

    // Regras de negócio para atualização
    if (updateData.user_data) {
      // Alunos não podem alterar seu próprio tipo ou status
      if (requestingUser.tipo === 'Aluno' && (updateData.user_data.tipo || updateData.user_data.status)) {
        throw new AppError('Você não pode alterar o tipo ou status do seu usuário.', 403);
      }
      // Instrutores não podem alterar o tipo de outros usuários
      if (requestingUser.tipo === 'Instrutor' && updateData.user_data.tipo && !isOwner) {
         throw new AppError('Você não tem permissão para alterar o tipo de outros usuários.', 403);
      }
    }

    // Atualiza dados do usuário (tabela users)
    if (updateData.user_data && Object.keys(updateData.user_data).length > 0) {
      await userModel.update(targetId, updateData.user_data);
    }

    // Atualiza dados do perfil (tabelas studentProfiles/instructorProfiles)
    if (updateData.profile_data && Object.keys(updateData.profile_data).length > 0) {
      if (targetUser.tipo === 'Aluno') {
        const profileIndex = database.studentProfiles.findIndex(p => p.user_id === targetId);
        if (profileIndex !== -1) {
          Object.assign(database.studentProfiles[profileIndex], updateData.profile_data);
        }
      } else if (targetUser.tipo === 'Instrutor') {
        const profileIndex = database.instructorProfiles.findIndex(p => p.user_id === targetId);
        if (profileIndex !== -1) {
          Object.assign(database.instructorProfiles[profileIndex], updateData.profile_data);
        }
      }
    }

    // Retorna o usuário completo e atualizado
    return this.getUserById(targetId, requestingUser);
  },

  async deleteUser(targetId, requestingUser) {
    const targetUser = await userModel.findById(targetId);
    if (!targetUser) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Verificação de permissão
    const isAdmin = requestingUser.tipo === 'Admin';
    const isOwner = requestingUser.id === targetUser.id;
    const isMyStudent = requestingUser.tipo === 'Instrutor' &&
                        targetUser.tipo === 'Aluno' &&
                        isInstructorOfStudent(requestingUser.id, targetUser.id);

    if (!isAdmin && !isOwner && !isMyStudent) {
      throw new AppError('Você não tem permissão para deletar este usuário.', 403);
    }

    // Regra: Não permitir que instrutores ou alunos deletem Admins
    if (targetUser.tipo === 'Admin' && !isAdmin) {
      throw new AppError('Você não tem permissão para deletar este tipo de usuário.', 403);
    }

    // Verificação de vínculos antes da deleção
    const hasWorkoutPlans = database.workoutPlans.some(plan => plan.student_id === targetId || plan.instructor_id === targetId);
    if (hasWorkoutPlans) {
      throw new AppError('Não é possível remover o usuário: existem planos de treino associados. Desvincule ou inative-o primeiro.', 400);
    }

    const hasSessions = database.sessions.some(session => session.student_id === targetId);
    if (hasSessions) {
      throw new AppError('Não é possível remover o usuário: existem sessões de treino associadas. Desvincule ou inative-o primeiro.', 400);
    }

    // Deleção do perfil
    if (targetUser.tipo === 'Aluno') {
      database.studentProfiles = database.studentProfiles.filter(p => p.user_id !== targetId);
    } else if (targetUser.tipo === 'Instrutor') {
      database.instructorProfiles = database.instructorProfiles.filter(p => p.user_id !== targetId);
    }

    // Deleção do usuário
    await userModel.remove(targetId);
  }
};

export { userService };