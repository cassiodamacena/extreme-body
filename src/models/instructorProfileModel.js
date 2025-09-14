import { database } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

const instructorProfileModel = {
  async create(profileData) {
    const { user_id, cref, ...rest } = profileData;

    const existingProfileByUser = database.instructorProfiles.find(p => p.user_id === user_id);
    if (existingProfileByUser) {
      throw new AppError('Perfil de instrutor já existe para este usuário.', 400);
    }

    const existingProfileByCref = database.instructorProfiles.find(p => p.cref === cref);
    if (existingProfileByCref) {
      throw new AppError('CREF já cadastrado.', 400);
    }

    const newProfile = {
      user_id,
      cref,
      ...rest,
    };

    database.instructorProfiles.push(newProfile);
    return newProfile;
  },

  async findByUserId(userId) {
    return database.instructorProfiles.find(p => p.user_id === userId) || null;
  },

  async update(userId, updateData) {
    const profileIndex = database.instructorProfiles.findIndex(p => p.user_id === userId);
    if (profileIndex === -1) {
      throw new AppError('Perfil de instrutor não encontrado.', 404);
    }

    const profile = database.instructorProfiles[profileIndex];

    // Verificar unicidade de CREF se estiver sendo atualizado
    if (updateData.cref && updateData.cref !== profile.cref) {
      const existingProfile = database.instructorProfiles.find(p => p.cref === updateData.cref);
      if (existingProfile && existingProfile.user_id !== userId) {
        throw new AppError('CREF já cadastrado por outro instrutor.', 400);
      }
    }

    const updatedProfile = {
      ...profile,
      ...updateData,
    };
    database.instructorProfiles[profileIndex] = updatedProfile;
    return updatedProfile;
  },

  async remove(userId) {
    const initialLength = database.instructorProfiles.length;
    database.instructorProfiles = database.instructorProfiles.filter(p => p.user_id !== userId);
    if (database.instructorProfiles.length === initialLength) {
      throw new AppError('Perfil de instrutor não encontrado para remoção.', 404);
    }
  },
};

export { instructorProfileModel };
