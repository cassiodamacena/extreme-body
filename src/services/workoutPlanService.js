import { workoutPlanModel } from '../models/workoutPlanModel.js';
import { userModel } from '../models/userModel.js';
import { exerciseModel } from '../models/exerciseModel.js';
import { modifierModel } from '../models/modifierModel.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js';

const populatePlanDetails = async (plan) => {
  if (!plan) return null;

  plan.student = await userModel.findById(plan.student_id);
  plan.instructor = await userModel.findById(plan.instructor_id);

  if (plan.items && Array.isArray(plan.items)) {
    for (const item of plan.items) {
      item.exercise = await exerciseModel.findById(item.exercise_id);
      if (item.modifier_ids && Array.isArray(item.modifier_ids)) {
        item.modifiers = await Promise.all(
          item.modifier_ids.map(modId => modifierModel.findById(modId))
        );
      } else {
        item.modifiers = [];
      }
    }
  }
  return plan;
};

const workoutPlanService = {
  async createWorkoutPlan(planData, requestingUser) {
    // Authorization: Admin can create for any instructor, but an instructor can only create for themselves.
    if (requestingUser.tipo !== 'Admin' && requestingUser.tipo !== 'Instrutor') {
      throw new AppError('Apenas Admins ou Instrutores podem criar planos de treino.', 403);
    }

    let instructor_id;

    if (requestingUser.tipo === 'Admin') {
      if (!planData.instructor_id) {
        throw new AppError('Administradores devem especificar o campo "instructor_id" ao criar um plano de treino.', 400);
      }
      instructor_id = planData.instructor_id;
    } else { // Implicitamente 'Instrutor' devido ao middleware authorize
      instructor_id = requestingUser.id;
    }

    // Validation: Check if all exercise and modifier IDs exist
    for (const item of planData.items) {
      const exerciseExists = await exerciseModel.findById(item.exercise_id);
      if (!exerciseExists) {
        throw new AppError(`Exercício com ID ${item.exercise_id} não encontrado.`, 400);
      }
      if (item.modifier_ids) {
        for (const modId of item.modifier_ids) {
          const modifierExists = await modifierModel.findById(modId);
          if (!modifierExists) {
            throw new AppError(`Modificador com ID ${modId} não encontrado.`, 400);
          }
        }
      }
    }

    const fullPlanData = { ...planData, instructor_id };
    const newPlan = await workoutPlanModel.create(fullPlanData);
    return populatePlanDetails(newPlan);
  },

  async getAllWorkoutPlans(requestingUser, filter = {}) {
    let plans = await workoutPlanModel.findAll(filter);

    // Authorization logic
    if (requestingUser.tipo === 'Instrutor') {
      plans = plans.filter(p => p.instructor_id === requestingUser.id);
    } else if (requestingUser.tipo === 'Aluno') {
      plans = plans.filter(p => p.student_id === requestingUser.id);
    }

    // Populate details for all filtered plans
    return Promise.all(plans.map(plan => populatePlanDetails(plan)));
  },

  async getWorkoutPlanById(id, requestingUser) {
    const plan = await workoutPlanModel.findById(id);
    if (!plan) {
      throw new AppError('Plano de treino não encontrado.', 404);
    }

    // Authorization logic
    const isOwner = plan.student_id === requestingUser.id;
    const isCreator = plan.instructor_id === requestingUser.id;
    const isAdmin = requestingUser.tipo === 'Admin';

    if (!isAdmin && !isOwner && !isCreator) {
      throw new AppError('Você não tem permissão para visualizar este plano de treino.', 403);
    }

    return populatePlanDetails(plan);
  },

  async updateWorkoutPlan(id, updateData, requestingUser) {
    const plan = await workoutPlanModel.findById(id);
    if (!plan) {
      throw new AppError('Plano de treino não encontrado.', 404);
    }

    // Authorization: Only Admin or the creating instructor can update
    const isCreator = plan.instructor_id === requestingUser.id;
    const isAdmin = requestingUser.tipo === 'Admin';

    if (!isAdmin && !isCreator) {
      throw new AppError('Você não tem permissão para atualizar este plano de treino.', 403);
    }

    // Validation: If items are updated, check if all exercise and modifier IDs exist
    if (updateData.items) {
      for (const item of updateData.items) {
        const exerciseExists = await exerciseModel.findById(item.exercise_id);
        if (!exerciseExists) {
          throw new AppError(`Exercício com ID ${item.exercise_id} não encontrado.`, 400);
        }
        if (item.modifier_ids) {
          for (const modId of item.modifier_ids) {
            const modifierExists = await modifierModel.findById(modId);
            if (!modifierExists) {
              throw new AppError(`Modificador com ID ${modId} não encontrado.`, 400);
            }
          }
        }
      }
    }

    const updatedPlan = await workoutPlanModel.update(id, updateData);
    return populatePlanDetails(updatedPlan);
  },

  async deleteWorkoutPlan(id, requestingUser) {
    const plan = await workoutPlanModel.findById(id);
    if (!plan) {
      throw new AppError('Plano de treino não encontrado.', 404);
    }

    // Authorization: Only Admin or the creating instructor can delete
    const isCreator = plan.instructor_id === requestingUser.id;
    const isAdmin = requestingUser.tipo === 'Admin';

    if (!isAdmin && !isCreator) {
      throw new AppError('Você não tem permissão para deletar este plano de treino.', 403);
    }

    // Check for links to sessions
    const isLinkedToSession = database.sessions.some(session => session.workout_plan_id === id);
    if (isLinkedToSession) {
      throw new AppError('Não é possível remover o plano de treino: ele está vinculado a sessões existentes.', 400);
    }

    await workoutPlanModel.remove(id);
  },
};

export { workoutPlanService };
