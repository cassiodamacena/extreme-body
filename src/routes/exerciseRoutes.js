import express from 'express';
import { exerciseController } from '../controllers/exerciseController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exercise Management
 *   description: Gerenciamento do catálogo de exercícios
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     ExerciseCreate:
 *       type: object
 *       required:
 *         - name
 *         - muscle_category
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: "Remada com Halteres"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Exercício para costas, focando no grande dorsal."
 *         general_observation:
 *           type: string
 *           maxLength: 500
 *           example: "Manter a coluna neutra e puxar o peso em direção ao quadril."
 *         muscle_category:
 *           type: string
 *           example: "Costas"
 *         video_link:
 *           type: string
 *           format: uri
 *           example: "https://www.youtube.com/embed/5477"
 *     ExerciseUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: "Remada com Halteres (Atualizada)"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Exercício para costas, focando no grande dorsal. Ajustes de postura."
 *         general_observation:
 *           type: string
 *           maxLength: 500
 *           example: "Manter a coluna neutra, puxar o peso em direção ao quadril, e focar na contração escapular."
 *         muscle_category:
 *           type: string
 *           example: "Costas"
 *         video_link:
 *           type: string
 *           format: uri
 *           example: "https://www.youtube.com/embed/6300"
 *     ExerciseResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Supino Reto com Barra"
 *         description:
 *           type: string
 *           example: "Exercício para peitoral, ombros e tríceps."
 *         general_observation:
 *           type: string
 *           example: "Manter a barra alinhada com o meio do peito."
 *         muscle_category:
 *           type: string
 *           example: "Peito"
 *         video_link:
 *           type: string
 *           example: "https://youtube.com/supino-reto"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

const createExerciseSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  general_observation: Joi.string().max(500).optional().allow(''),
  muscle_category: Joi.string().required(),
  video_link: Joi.string().uri().optional().allow(''),
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500).allow(''),
  general_observation: Joi.string().max(500).allow(''),
  muscle_category: Joi.string(),
  video_link: Joi.string().uri().allow(''),
}).min(1); // Pelo menos um campo deve ser atualizado

/**
 * @swagger
 * /api/v1/exercises:
 *   post:
 *     tags:
 *       - Exercise Management
 *     summary: Cria um novo exercício no catálogo
 *     description: Apenas Admin e Instrutores podem adicionar novos exercícios.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseCreate'
 *     responses:
 *       '201':
 *         description: Exercício criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     exercise:
 *                       $ref: '#/components/schemas/ExerciseResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags:
 *       - Exercise Management
 *     summary: Lista todos os exercícios
 *     description: Usuários autenticados podem visualizar todos os exercícios.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: muscle_category
 *         schema:
 *           type: string
 *         description: "Filtra exercícios por categoria muscular."
 *     responses:
 *       '200':
 *         description: Lista de exercícios recuperada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     exercises:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ExerciseResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/')
  .post(authenticate, authorize(['Admin', 'Instrutor']), validate(createExerciseSchema), exerciseController.createExercise)
  .get(authenticate, exerciseController.getAllExercises);

/**
 * @swagger
 * /api/v1/exercises/{id}:
 *   get:
 *     tags:
 *       - Exercise Management
 *     summary: Obtém um exercício por ID
 *     description: Usuários autenticados podem visualizar um exercício específico.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID do exercício."
 *     responses:
 *       '200':
 *         description: Exercício recuperado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     exercise:
 *                       $ref: '#/components/schemas/ExerciseResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags:
 *       - Exercise Management
 *     summary: Atualiza um exercício por ID
 *     description: Apenas Admin e Instrutores podem atualizar exercícios.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID do exercício."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseUpdate'
 *     responses:
 *       '200':
 *         description: Exercício atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     exercise:
 *                       $ref: '#/components/schemas/ExerciseResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Exercise Management
 *     summary: Deleta um exercício por ID
 *     description: Apenas Admin e Instrutores podem deletar exercícios. A exclusão falha se o exercício estiver vinculado a planos ou execuções.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID do exercício."
 *     responses:
 *       '204':
 *         description: Exercício deletado com sucesso.
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.route('/:id')
  .get(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), exerciseController.getExerciseById)
  .put(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }), body: updateExerciseSchema }), exerciseController.updateExercise)
  .delete(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), exerciseController.deleteExercise);

export default router;
