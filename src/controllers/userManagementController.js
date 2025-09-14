import { userService } from '../services/userService.js';
import { AppError } from '../utils/AppError.js';

const userManagementController = {
  async createStudent(req, res, next) {
    try {
      const { user_data, profile_data } = req.body;
      const newUser = await userService.createUser({ ...user_data, profileData: profile_data }, 'Aluno');
      res.status(201).json({
        status: 'success',
        data: {
          user: newUser,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createInstructor(req, res, next) {
    try {
      const { user_data, profile_data } = req.body;
      const newUser = await userService.createUser({ ...user_data, profileData: profile_data }, 'Instrutor');
      res.status(201).json({
        status: 'success',
        data: {
          user: newUser,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req, res, next) {
    try {
      const filter = req.query; // Para filtrar por tipo, status, etc.
      const users = await userService.getAllUsers(req.user.id, req.user.tipo, filter);
      res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
          users,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(parseInt(id), req.user.id, req.user.tipo);
      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { user_data, profile_data } = req.body;
      const updatedUser = await userService.updateUser(parseInt(id), { ...user_data, profileData: profile_data }, req.user.id, req.user.tipo);
      res.status(200).json({
        status: 'success',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteUser(parseInt(id), req.user.id, req.user.tipo);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};

export { userManagementController };
