import { database, generateId } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

const exerciseModel = {
  async create(exerciseData) {
    const { name } = exerciseData;

    const existingExercise = database.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (existingExercise) {
      throw new AppError('Já existe um exercício com este nome.', 400);
    }

    const newExercise = {
      id: generateId('exercises'),
      ...exerciseData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    database.exercises.push(newExercise);
    return newExercise;
  },

  async findAll(filter = {}) {
    let exercises = database.exercises;

    if (filter.muscle_category) {
      exercises = exercises.filter(e => e.muscle_category.toLowerCase() === filter.muscle_category.toLowerCase());
    }

    return exercises;
  },

  async findById(id) {
    return database.exercises.find(e => e.id === id) || null;
  },

  async update(id, updateData) {
    const exerciseIndex = database.exercises.findIndex(e => e.id === id);
    if (exerciseIndex === -1) {
      throw new AppError('Exercício não encontrado.', 404);
    }

    const exercise = database.exercises[exerciseIndex];

    if (updateData.name && updateData.name.toLowerCase() !== exercise.name.toLowerCase()) {
      const existingExercise = database.exercises.find(e => e.name.toLowerCase() === updateData.name.toLowerCase());
      if (existingExercise && existingExercise.id !== id) {
        throw new AppError('Já existe outro exercício com este nome.', 400);
      }
    }

    const updatedExercise = {
      ...exercise,
      ...updateData,
      updated_at: new Date(),
    };

    database.exercises[exerciseIndex] = updatedExercise;
    return updatedExercise;
  },

  async remove(id) {
    const initialLength = database.exercises.length;
    database.exercises = database.exercises.filter(e => e.id !== id);
    if (database.exercises.length === initialLength) {
      // This case is handled by the service layer first, but it's good practice.
      throw new AppError('Exercício não encontrado para remoção.', 404);
    }
    return true;
  },
};

export { exerciseModel };