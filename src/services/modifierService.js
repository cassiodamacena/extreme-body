import { modifierModel } from '../models/modifierModel.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js';

const modifierService = {
  async createModifier(modifierData) {
    return modifierModel.create(modifierData);
  },

  async getAllModifiers(filter = {}) {
    return modifierModel.findAll(filter);
  },

  async getModifierById(id) {
    const modifier = await modifierModel.findById(id);
    if (!modifier) {
      throw new AppError('Modificador não encontrado.', 404);
    }
    return modifier;
  },

  async updateModifier(id, updateData) {
    return modifierModel.update(id, updateData);
  },

  async deleteModifier(id) {
    await this.getModifierById(id); // Verifica se o modificador existe

    // Verifica vínculos em workoutPlanItems
    const isLinkedToPlan = (database.workoutPlanItems || []).some(item =>
      Array.isArray(item.modifiers) && item.modifiers.includes(id)
    );

    // Verifica vínculos em executions
    const isLinkedToExecution = (database.executions || []).some(exec =>
      Array.isArray(exec.modifiers) && exec.modifiers.includes(id)
    );

    if (isLinkedToPlan || isLinkedToExecution) {
      throw new AppError(
        'Não é possível remover o modificador: ele está vinculado a planos de treino ou execuções existentes.',
        400
      );
    }

    await modifierModel.remove(id);
  },
};

export { modifierService };
