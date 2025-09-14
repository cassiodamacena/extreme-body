import { database } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

const studentProfileModel = {
  async create(profileData) {
    const { user_id, ...rest } = profileData;

    const existingProfile = database.studentProfiles.find(p => p.user_id === user_id);
    if (existingProfile) {
      throw new AppError('Perfil de estudante já existe para este usuário.', 400);
    }

    const newProfile = {
      user_id,
      ...rest,
    };

    database.studentProfiles.push(newProfile);
    return newProfile;
  },

  async findByUserId(userId) {
    return database.studentProfiles.find(p => p.user_id === userId) || null;
  },

  async update(userId, updateData) {
    const profileIndex = database.studentProfiles.findIndex(p => p.user_id === userId);
    if (profileIndex === -1) {
      throw new AppError('Perfil de estudante não encontrado.', 404);
    }

    const updatedProfile = {
      ...database.studentProfiles[profileIndex],
      ...updateData,
    };
    database.studentProfiles[profileIndex] = updatedProfile;
    return updatedProfile;
  },

  async remove(userId) {
    const initialLength = database.studentProfiles.length;
    database.studentProfiles = database.studentProfiles.filter(p => p.user_id !== userId);
    if (database.studentProfiles.length === initialLength) {
      throw new AppError('Perfil de estudante não encontrado para remoção.', 404);
    }
  },
};

export { studentProfileModel };
