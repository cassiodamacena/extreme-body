import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { authService } from '../../services/authService.js';
import { userService } from '../../services/userService.js';
import { exerciseService } from '../../services/exerciseService.js';
import { modifierService } from '../../services/modifierService.js';
import { workoutPlanService } from '../../services/workoutPlanService.js';
import { sessionService } from '../../services/sessionService.js';
import { userModel } from '../../models/userModel.js';
import { database } from '../../models/inMemoryDB.js';

export const resolvers = {
  Query: {
    // User
    users: async (_, args, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return userService.getAllUsers(context.user, args);
    },
    user: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return userService.getUserById(parseInt(id), context.user);
    },

    // Exercise
    exercises: async () => {
      return exerciseService.getAllExercises();
    },
    exercise: async (_, { id }) => {
      return exerciseService.getExerciseById(parseInt(id));
    },

    // Modifier
    modifiers: async () => {
      return modifierService.getAllModifiers();
    },
    modifier: async (_, { id }) => {
      return modifierService.getModifierById(parseInt(id));
    },

    // WorkoutPlan
    workoutPlans: async (_, args, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return workoutPlanService.getAllWorkoutPlans(context.user, args);
    },
    workoutPlan: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return workoutPlanService.getWorkoutPlanById(parseInt(id), context.user);
    },

    // Session
    sessions: async (_, args, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      const filters = {
        student_id: args.studentId ? parseInt(args.studentId) : undefined,
        workout_plan_id: args.planId ? parseInt(args.planId) : undefined,
      };
      return sessionService.getAllSessions(context.user, filters);
    },
    session: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return sessionService.getSessionById(parseInt(id), context.user);
    },
  },

  Mutation: {
    // Auth
    login: async (_, { email, password }) => {
      const token = await authService.loginUser(email, password);
      let user = await userModel.findByEmail(email);
      if (!user) {
        user = await userModel.findByDocumento(email);
      }
      const { senha_hash, ...userWithoutPassword } = user;
      return { token, user: userWithoutPassword };
    },

    // User
    createUser: async (_, { input }) => {
      try {
        const { studentProfile, instructorProfile, ...userData } = input;
        const profileData = studentProfile || instructorProfile;
        return userService.createUser(userData, profileData, input.tipo);
      } catch (error) {
        console.error("Erro no resolver createUser:", error); // Log do erro
        throw error; // Re-lança o erro para o GraphQL
      }
    },
    updateUser: async (_, { id, input }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      const { studentProfile, instructorProfile, ...userData } = input;
      const updateData = {
        user_data: userData,
        profile_data: studentProfile || instructorProfile,
      };
      return userService.updateUser(parseInt(id), updateData, context.user);
    },
    deleteUser: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      await userService.deleteUser(parseInt(id), context.user);
      return true;
    },

    // Exercise
    createExercise: async (_, { input }, context) => {
       if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem criar exercícios.');
      }
      return exerciseService.createExercise(input);
    },
    updateExercise: async (_, { id, input }, context) => {
       if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem atualizar exercícios.');
      }
      return exerciseService.updateExercise(parseInt(id), input);
    },
    deleteExercise: async (_, { id }, context) => {
       if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem deletar exercícios.');
      }
      await exerciseService.deleteExercise(parseInt(id));
      return true;
    },

    // Modifier
    createModifier: async (_, { input }, context) => {
      if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem criar modificadores.');
      }
      return modifierService.createModifier(input);
    },
    updateModifier: async (_, { id, input }, context) => {
      if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem atualizar modificadores.');
      }
      return modifierService.updateModifier(parseInt(id), input);
    },
    deleteModifier: async (_, { id }, context) => {
      if (!context.user || (context.user.tipo !== 'Admin' && context.user.tipo !== 'Instrutor')) {
        throw new ForbiddenError('Apenas Admins ou Instrutores podem deletar modificadores.');
      }
      await modifierService.deleteModifier(parseInt(id));
      return true;
    },

    // WorkoutPlan
    createWorkoutPlan: async (_, { input }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return workoutPlanService.createWorkoutPlan(input, context.user);
    },
    updateWorkoutPlan: async (_, { id, input }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return workoutPlanService.updateWorkoutPlan(parseInt(id), input, context.user);
    },
    deleteWorkoutPlan: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      await workoutPlanService.deleteWorkoutPlan(parseInt(id), context.user);
      return true;
    },

    // Session
    createSession: async (_, { input }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return sessionService.createSession(input, context.user);
    },
    updateSession: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      return sessionService.updateSession(parseInt(id), input, context.user);
    },
    deleteSession: async (_, { id }, context) => {
      if (!context.user) throw new AuthenticationError('You must be logged in.');
      await sessionService.deleteSession(parseInt(id), context.user);
      return true;
    },
  },

  // Type Resolvers
  User: {
    studentProfile: (parent) => {
      if (parent.tipo !== 'Aluno') return null;
      return database.studentProfiles.find(p => p.user_id === parent.id) || null;
    },
    instructorProfile: (parent) => {
      if (parent.tipo !== 'Instrutor') return null;
      return database.instructorProfiles.find(p => p.user_id === parent.id) || null;
    },
  },

  StudentProfile: {
    instructor: (parent) => {
      if (!parent.instructor_id) return null;
      return userModel.findById(parent.instructor_id);
    },
  },
  
  Session: {
    workout_plan: (parent) => {
        // The service populates 'workoutPlan', but the schema expects 'workout_plan'
        return parent.workoutPlan || null;
    }
  }
};