import { sessionModel } from '../models/sessionModel.js';
import { userModel } from '../models/userModel.js';
import { workoutPlanModel } from '../models/workoutPlanModel.js';
import { exerciseModel } from '../models/exerciseModel.js';
import { modifierModel } from '../models/modifierModel.js';
import { AppError } from '../utils/AppError.js';
import { database } from '../models/inMemoryDB.js';

const isInstructorOfStudent = (instructorId, studentId) => {
  const studentProfile = database.studentProfiles.find(p => p.user_id === studentId);
  return studentProfile?.instructor_id === instructorId;
};

const populateSessionDetails = async (session) => {
  if (!session) return null;

  session.student = await userModel.findById(session.student_id);
  if (session.student && session.student.tipo === 'Aluno') {
    session.student.profile = database.studentProfiles.find(p => p.user_id === session.student.id) || null;
  }

  if (session.workout_plan_id) {
    const plan = await workoutPlanModel.findById(session.workout_plan_id);
    if (plan) {
      plan.instructor = await userModel.findById(plan.instructor_id);
    }
    session.workoutPlan = plan;
  }

  if (session.executions && Array.isArray(session.executions)) {
    for (const exec of session.executions) {
      exec.exercise = await exerciseModel.findById(exec.exercise_id);
      if (exec.modifier_ids && Array.isArray(exec.modifier_ids)) {
        exec.modifiers = await Promise.all(
          exec.modifier_ids.map(modId => modifierModel.findById(modId))
        );
      } else {
        exec.modifiers = [];
      }
    }
  }
  return session;
};

const sessionService = {
  async createSession(sessionData, requestingUser) {
    const { student_id, workout_plan_id, executions } = sessionData;

    // Authorization
    const isOwner = requestingUser.tipo === 'Aluno' && requestingUser.id === student_id;
    const isAdmin = requestingUser.tipo === 'Admin';
    const isMyStudent = requestingUser.tipo === 'Instrutor' && isInstructorOfStudent(requestingUser.id, student_id);

    if (!isOwner && !isAdmin && !isMyStudent) {
      throw new AppError('Você não tem permissão para registrar uma sessão para este aluno.', 403);
    }

    // Validation
    for (const exec of executions) {
      if (!await exerciseModel.findById(exec.exercise_id)) {
        throw new AppError(`Exercício com ID ${exec.exercise_id} não encontrado.`, 400);
      }
      if (exec.modifier_ids) {
        for (const modId of exec.modifier_ids) {
          if (!await modifierModel.findById(modId)) {
            throw new AppError(`Modificador com ID ${modId} não encontrado.`, 400);
          }
        }
      }
    }

    const newSession = await sessionModel.create(sessionData);
    return populateSessionDetails(newSession);
  },

  async getAllSessions(requestingUser, filter = {}) {
    let sessions = await sessionModel.findAll(filter);

    // Authorization
    if (requestingUser.tipo === 'Instrutor') {
      sessions = sessions.filter(s => isInstructorOfStudent(requestingUser.id, s.student_id));
    } else if (requestingUser.tipo === 'Aluno') {
      sessions = sessions.filter(s => s.student_id === requestingUser.id);
    }

    return Promise.all(sessions.map(s => populateSessionDetails(s)));
  },

  async getSessionById(id, requestingUser) {
    const session = await sessionModel.findById(id);
    if (!session) {
      throw new AppError('Sessão de treino não encontrada.', 404);
    }

    // Authorization
    const isOwner = requestingUser.tipo === 'Aluno' && requestingUser.id === session.student_id;
    const isAdmin = requestingUser.tipo === 'Admin';
    const isMyStudent = requestingUser.tipo === 'Instrutor' && isInstructorOfStudent(requestingUser.id, session.student_id);

    if (!isOwner && !isAdmin && !isMyStudent) {
      throw new AppError('Você não tem permissão para visualizar esta sessão.', 403);
    }

    return populateSessionDetails(session);
  },

  async updateSession(id, updateData, requestingUser) {
    const session = await sessionModel.findById(id);
    if (!session) {
      throw new AppError('Sessão de treino não encontrada.', 404);
    }

    // Authorization
    const isOwner = requestingUser.tipo === 'Aluno' && requestingUser.id === session.student_id;
    const isAdmin = requestingUser.tipo === 'Admin';
    const isMyStudent = requestingUser.tipo === 'Instrutor' && isInstructorOfStudent(requestingUser.id, session.student_id);

    if (!isOwner && !isAdmin && !isMyStudent) {
      throw new AppError('Você não tem permissão para atualizar esta sessão.', 403);
    }

    // Validation
    if (updateData.executions) {
      for (const exec of updateData.executions) {
        if (!await exerciseModel.findById(exec.exercise_id)) {
          throw new AppError(`Exercício com ID ${exec.exercise_id} não encontrado.`, 400);
        }
      }
    }

    const updatedSession = await sessionModel.update(id, updateData);
    return populateSessionDetails(updatedSession);
  },

  async deleteSession(id, requestingUser) {
    const session = await sessionModel.findById(id);
    if (!session) {
      throw new AppError('Sessão de treino não encontrada.', 404);
    }

    // Authorization
    const isOwner = requestingUser.tipo === 'Aluno' && requestingUser.id === session.student_id;
    const isAdmin = requestingUser.tipo === 'Admin';
    const isMyStudent = requestingUser.tipo === 'Instrutor' && isInstructorOfStudent(requestingUser.id, session.student_id);

    if (!isOwner && !isAdmin && !isMyStudent) {
      throw new AppError('Você não tem permissão para deletar esta sessão.', 403);
    }

    await sessionModel.remove(id);
  },
};

export { sessionService };