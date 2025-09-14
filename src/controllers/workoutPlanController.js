import { workoutPlanService } from '../services/workoutPlanService.js';

const workoutPlanController = {
  async createWorkoutPlan(req, res, next) {
    try {
      const workoutPlan = await workoutPlanService.createWorkoutPlan(req.body, req.user);
      res.status(201).json({
        status: 'success',
        data: { workoutPlan },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllWorkoutPlans(req, res, next) {
    try {
      const workoutPlans = await workoutPlanService.getAllWorkoutPlans(req.user, req.query);
      res.status(200).json({
        status: 'success',
        results: workoutPlans.length,
        data: { workoutPlans },
      });
    } catch (error) {
      next(error);
    }
  },

  async getWorkoutPlanById(req, res, next) {
    try {
      const workoutPlan = await workoutPlanService.getWorkoutPlanById(parseInt(req.params.id), req.user);
      res.status(200).json({
        status: 'success',
        data: { workoutPlan },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateWorkoutPlan(req, res, next) {
    try {
      const workoutPlan = await workoutPlanService.updateWorkoutPlan(parseInt(req.params.id), req.body, req.user);
      res.status(200).json({
        status: 'success',
        data: { workoutPlan },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteWorkoutPlan(req, res, next) {
    try {
      await workoutPlanService.deleteWorkoutPlan(parseInt(req.params.id), req.user);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export { workoutPlanController };
