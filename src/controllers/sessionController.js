import { sessionService } from '../services/sessionService.js';
import { AppError } from '../utils/AppError.js';

const sessionController = {
  createSession: async (req, res, next) => {
    try {
      const sessionData = req.body;
      const requestingUser = req.user;

      const newSession = await sessionService.createSession(sessionData, requestingUser);
      res.status(201).json({ status: 'success', data: { session: newSession } });
    } catch (error) {
      next(error);
    }
  },

  getAllSessions: async (req, res, next) => {
    try {
      const requestingUser = req.user;
      const filters = req.query;

      const sessions = await sessionService.getAllSessions(requestingUser, filters);
      res.status(200).json({ status: 'success', results: sessions.length, data: { sessions } });
    } catch (error) {
      next(error);
    }
  },

  getSessionById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const requestingUser = req.user;

      const session = await sessionService.getSessionById(Number(id), requestingUser);
      res.status(200).json({ status: 'success', data: { session } });
    } catch (error) {
      next(error);
    }
  },

  updateSession: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const requestingUser = req.user;

      const updatedSession = await sessionService.updateSession(Number(id), updateData, requestingUser);
      res.status(200).json({ status: 'success', data: { session: updatedSession } });
    } catch (error) {
      next(error);
    }
  },

  deleteSession: async (req, res, next) => {
    try {
      const { id } = req.params;
      const requestingUser = req.user;

      await sessionService.deleteSession(Number(id), requestingUser);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export { sessionController };