import express from 'express';
import { modifierController } from '../controllers/modifierController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Modifier Management
 *   description: Gerenciamento do catálogo de modificadores de set (e.g., Drop Set, Warm Up)
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     ModifierCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: "Rest Pause"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Realizar até a falha, descansar 15s e realizar novamente."
 *     ModifierUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: "Rest Pause (Atualizado)"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Após a falha, pausar por 15 segundos e continuar as repetições."
 *     ModifierResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Warm Up Set"
 *         description:
 *           type: string
 *           example: "Série de aquecimento, com carga leve e longe da falha."
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

const createModifierSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
});

const updateModifierSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500).allow(''),
}).min(1);

/**
 * @swagger
 * /api/v1/modifiers:
 *   post:
 *     tags: [Modifier Management]
 *     summary: Cria um novo modificador de set
 *     description: Apenas Admin e Instrutores podem adicionar novos modificadores.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModifierCreate'
 *     responses:
 *       '201':
 *         description: Modificador criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { type: object, properties: { modifier: { $ref: '#/components/schemas/ModifierResponse' } } }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Modifier Management]
 *     summary: Lista todos os modificadores de set
 *     description: Usuários autenticados podem visualizar todos os modificadores.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200':
 *         description: Lista de modificadores recuperada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 results: { type: integer, example: 3 }
 *                 data: { type: object, properties: { modifiers: { type: array, items: { $ref: '#/components/schemas/ModifierResponse' } } } }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 */
router.route('/')
  .post(authenticate, authorize(['Admin', 'Instrutor']), validate(createModifierSchema), modifierController.createModifier)
  .get(authenticate, modifierController.getAllModifiers);

/**
 * @swagger
 * /api/v1/modifiers/{id}:
 *   get:
 *     tags: [Modifier Management]
 *     summary: Obtém um modificador de set por ID
 *     description: Usuários autenticados podem visualizar um modificador específico.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do modificador." }
 *     responses:
 *       '200':
 *         description: Modificador recuperado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { type: object, properties: { modifier: { $ref: '#/components/schemas/ModifierResponse' } } }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Modifier Management]
 *     summary: Atualiza um modificador de set por ID
 *     description: Apenas Admin e Instrutores podem atualizar modificadores.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do modificador." }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModifierUpdate'
 *     responses:
 *       '200':
 *         description: Modificador atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data: { type: object, properties: { modifier: { $ref: '#/components/schemas/ModifierResponse' } } }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Modifier Management]
 *     summary: Deleta um modificador de set por ID
 *     description: Apenas Admin e Instrutores podem deletar modificadores. A exclusão falha se o modificador estiver vinculado a planos ou execuções.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do modificador." }
 *     responses:
 *       '204':
 *         description: Modificador deletado com sucesso.
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
router.route('/:id')
  .get(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), modifierController.getModifierById)
  .put(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }), body: updateModifierSchema }), modifierController.updateModifier)
  .delete(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), modifierController.deleteModifier);

export default router;
