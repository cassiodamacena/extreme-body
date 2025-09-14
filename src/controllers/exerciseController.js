import { exerciseService } from '../services/exerciseService.js';

const exerciseController = {
  async createExercise(req, res, next) {
    try {
      const exercise = await exerciseService.createExercise(req.body);
      res.status(201).json({
        status: 'success',
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllExercises(req, res, next) {
    try {
      const exercises = await exerciseService.getAllExercises(req.query);
      res.status(200).json({
        status: 'success',
        results: exercises.length,
        data: { exercises },
      });
    } catch (error) {
      next(error);
    }
  },

  async getExerciseById(req, res, next) {
    try {
      const exercise = await exerciseService.getExerciseById(parseInt(req.params.id));
      res.status(200).json({
        status: 'success',
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateExercise(req, res, next) {
    try {
      const exercise = await exerciseService.updateExercise(parseInt(req.params.id), req.body);
      res.status(200).json({
        status: 'success',
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteExercise(req, res, next) {
    try {
      await exerciseService.deleteExercise(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
export { exerciseController };
