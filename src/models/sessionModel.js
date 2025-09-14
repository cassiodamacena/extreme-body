import { database, generateId } from './inMemoryDB.js';
import { AppError } from '../utils/AppError.js';
import { userModel } from './userModel.js';
import { workoutPlanModel } from './workoutPlanModel.js';

const sessionModel = {
  async create(sessionData) {
    // Validate foreign keys
    const studentExists = await userModel.findById(sessionData.student_id);
    if (!studentExists) {
      throw new AppError(`Aluno com ID ${sessionData.student_id} não encontrado.`, 400);
    }

    if (sessionData.workout_plan_id) {
      const planExists = await workoutPlanModel.findById(sessionData.workout_plan_id);
      if (!planExists) {
        throw new AppError(`Plano de treino com ID ${sessionData.workout_plan_id} não encontrado.`, 400);
      }
    }

    const newSession = {
      id: generateId('sessions'),
      ...sessionData,
      created_at: new Date(),
      updated_at: new Date(),
      executions: (sessionData.executions || []).map(exec => ({
        id: generateId('executions'), // Note: This assumes a global ID pool for executions
        ...exec,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    };

    database.sessions.push(newSession);
    return newSession;
  },

  async findAll(filter = {}) {
    let sessions = [...database.sessions];

    if (filter.student_id) {
      sessions = sessions.filter(s => s.student_id === Number(filter.student_id));
    }
    if (filter.workout_plan_id) {
      sessions = sessions.filter(s => s.workout_plan_id === Number(filter.workout_plan_id));
    }
    if (filter.session_date) {
      sessions = sessions.filter(s => s.session_date === filter.session_date);
    }

    return sessions;
  },

  async findById(id) {
    return database.sessions.find(s => s.id === id);
  },

  async update(id, updateData) {
    const sessionIndex = database.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) {
      throw new AppError('Sessão não encontrada.', 404);
    }

    const originalSession = database.sessions[sessionIndex];

    // Simple merge for top-level properties
    const updatedSession = {
      ...originalSession,
      ...updateData,
      updated_at: new Date(),
    };

    // If new executions are provided, replace the old ones
    if (updateData.executions) {
      updatedSession.executions = updateData.executions.map(exec => ({
        ...exec,
        id: exec.id || generateId('executions'), // Keep existing ID or generate new one
        created_at: exec.created_at || new Date(),
        updated_at: new Date(),
      }));
    }

    database.sessions[sessionIndex] = updatedSession;
    return updatedSession;
  },

  async remove(id) {
    const initialLength = database.sessions.length;
    database.sessions = database.sessions.filter(s => s.id !== id);
    return database.sessions.length < initialLength;
  },
};

export { sessionModel };