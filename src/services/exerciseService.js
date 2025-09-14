import { exerciseModel } from '../models/exerciseModel.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js';

const exerciseService = {
  async createExercise(exerciseData) {
    return exerciseModel.create(exerciseData);
  },

  async getAllExercises(filter = {}) {
    return exerciseModel.findAll(filter);
  },

  async getExerciseById(id) {
    const exercise = await exerciseModel.findById(id);
    if (!exercise) {
      throw new AppError('Exercício não encontrado.', 404);
    }
    return exercise;
  },

  async updateExercise(id, updateData) {
    // A verificação de existência é feita pelo model.update
    return exerciseModel.update(id, updateData);
  },

  async deleteExercise(id) {
    // 1. Verifica se o exercício existe
    await this.getExerciseById(id);

    // 2. Verifica vínculos em planos de treino e execuções
    // Nota: `workoutPlanItems` não está no inMemoryDB.js, mas é adicionado aqui para seguir o ERD e a robustez.
    const isLinkedToPlan = (database.workoutPlanItems || []).some(item => item.exercise_id === id);
    const isLinkedToExecution = (database.executions || []).some(exec => exec.exercise_id === id);

    if (isLinkedToPlan || isLinkedToExecution) {
      throw new AppError(
        'Não é possível remover o exercício: ele está vinculado a planos de treino ou execuções existentes.',
        400
      );
    }

    // 3. Se não houver vínculos, remove
    await exerciseModel.remove(id);
  },
};

export { exerciseService };