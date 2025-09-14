import { database, generateId } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

const modifierModel = {
  async create(modifierData) {
    const { name } = modifierData;

    const existingModifier = database.modifiers.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existingModifier) {
      throw new AppError('Já existe um modificador com este nome.', 400);
    }

    const newModifier = {
      id: generateId('modifiers'),
      ...modifierData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    database.modifiers.push(newModifier);
    return newModifier;
  },

  async findAll(filter = {}) {
    // No filters specified for modifiers, returning all.
    return database.modifiers;
  },

  async findById(id) {
    return database.modifiers.find(m => m.id === id) || null;
  },

  async update(id, updateData) {
    const modifierIndex = database.modifiers.findIndex(m => m.id === id);
    if (modifierIndex === -1) {
      throw new AppError('Modificador não encontrado.', 404);
    }

    const modifier = database.modifiers[modifierIndex];

    if (updateData.name && updateData.name.toLowerCase() !== modifier.name.toLowerCase()) {
      const existingModifier = database.modifiers.find(m => m.name.toLowerCase() === updateData.name.toLowerCase());
      if (existingModifier && existingModifier.id !== id) {
        throw new AppError('Já existe outro modificador com este nome.', 400);
      }
    }

    const updatedModifier = {
      ...modifier,
      ...updateData,
      updated_at: new Date(),
    };

    database.modifiers[modifierIndex] = updatedModifier;
    return updatedModifier;
  },

  async remove(id) {
    const initialLength = database.modifiers.length;
    database.modifiers = database.modifiers.filter(m => m.id !== id);
    if (database.modifiers.length === initialLength) {
      throw new AppError('Modificador não encontrado para remoção.', 404);
    }
    return true;
  },
};

export { modifierModel };
