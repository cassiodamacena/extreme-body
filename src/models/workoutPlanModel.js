import { database, generateId } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';

const workoutPlanModel = {
  async create(planData) {
    // Validate if student_id and instructor_id exist
    const studentExists = database.users.some(u => u.id === planData.student_id && u.tipo === 'Aluno');
    if (!studentExists) {
      throw new AppError('Aluno não encontrado.', 404);
    }
    const instructorExists = database.users.some(u => u.id === planData.instructor_id && u.tipo === 'Instrutor');
    if (!instructorExists) {
      throw new AppError('Instrutor não encontrado.', 404);
    }

    const newPlan = {
      id: generateId('workoutPlans'),
      ...planData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Generate IDs for nested items
    newPlan.items.forEach(item => {
      item.id = generateId('workoutPlanItems'); // Using a temporary name for ID generation
    });

    database.workoutPlans.push(newPlan);
    return newPlan;
  },

  async findAll(filter = {}) {
    let plans = database.workoutPlans;

    if (filter.instructor_id) {
      plans = plans.filter(p => p.instructor_id === parseInt(filter.instructor_id));
    }
    if (filter.student_id) {
      plans = plans.filter(p => p.student_id === parseInt(filter.student_id));
    }
    // Date filters can be added here if needed

    return plans;
  },

  async findById(id) {
    return database.workoutPlans.find(p => p.id === id) || null;
  },

  async update(id, updateData) {
    const planIndex = database.workoutPlans.findIndex(p => p.id === id);
    if (planIndex === -1) {
      throw new AppError('Plano de treino não encontrado.', 404);
    }

    const updatedPlan = {
      ...database.workoutPlans[planIndex],
      ...updateData,
      updated_at: new Date(),
    };

    // If items are being replaced, ensure they have IDs
    if (updateData.items) {
      updatedPlan.items.forEach(item => {
        if (!item.id) {
          item.id = generateId('workoutPlanItems');
        }
      });
    }

    database.workoutPlans[planIndex] = updatedPlan;
    return updatedPlan;
  },

  async remove(id) {
    database.workoutPlans = database.workoutPlans.filter(p => p.id !== id);
  },
};

export { workoutPlanModel };
