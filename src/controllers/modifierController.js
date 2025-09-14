import { modifierService } from '../services/modifierService.js';

const modifierController = {
  async createModifier(req, res, next) {
    try {
      const modifier = await modifierService.createModifier(req.body);
      res.status(201).json({
        status: 'success',
        data: { modifier },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllModifiers(req, res, next) {
    try {
      const modifiers = await modifierService.getAllModifiers(req.query);
      res.status(200).json({
        status: 'success',
        results: modifiers.length,
        data: { modifiers },
      });
    } catch (error) {
      next(error);
    }
  },

  async getModifierById(req, res, next) {
    try {
      const modifier = await modifierService.getModifierById(parseInt(req.params.id));
      res.status(200).json({
        status: 'success',
        data: { modifier },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateModifier(req, res, next) {
    try {
      const modifier = await modifierService.updateModifier(parseInt(req.params.id), req.body);
      res.status(200).json({
        status: 'success',
        data: { modifier },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteModifier(req, res, next) {
    try {
      await modifierService.deleteModifier(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export { modifierController };
