import express from 'express';
import { workoutPlanController } from '../controllers/workoutPlanController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workout Plan Management
 *   description: Gerenciamento de planos de treino detalhados
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     WorkoutPlanItemCreate:
 *       type: object
 *       required:
 *         - exercise_id
 *         - series_count
 *         - repetitions_expected
 *         - load_suggested
 *         - order_index
 *       properties:
 *         exercise_id:
 *           type: integer
 *           description: ID do exercício do catálogo.
 *           example: 1
 *         series_count:
 *           type: integer
 *           minimum: 1
 *           example: 4
 *         repetitions_expected:
 *           type: string
 *           example: "8-12"
 *         load_suggested:
 *           type: string
 *           example: "50kg"
 *         observations:
 *           type: string
 *           example: "Focar na fase excêntrica."
 *         order_index:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         modifier_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: IDs dos modificadores de set a serem aplicados.
 *           example: [1, 2]
 *     WorkoutPlanCreate:
 *       type: object
 *       required:
 *         - name
 *         - student_id
 *         - start_date
 *         - end_date
 *         - items
 *       properties:
 *         name:
 *           type: string
 *           example: "Plano de Ganho de Força"
 *         description:
 *           type: string
 *           example: "Plano focado em desenvolvimento de força máxima."
 *         student_id:
 *           type: integer
 *           description: ID do aluno para quem o plano é destinado.
 *           example: 3
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2024-06-01"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2024-08-31"
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/WorkoutPlanItemCreate'
 *     WorkoutPlanUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Plano de Ganho de Força (Revisado)"
 *         description:
 *           type: string
 *           example: "Plano revisado com foco em periodização."
 *         student_id:
 *           type: integer
 *           description: ID do aluno para quem o plano é destinado.
 *           example: 3
 *         instructor_id:
 *           type: integer
 *           description: "ID do instrutor responsável. Obrigatório se o plano for criado por um Admin."
 *           example: 3
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2024-09-15"
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/WorkoutPlanItemCreate'
 *     WorkoutPlanItemResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         exercise_id:
 *           type: integer
 *           example: 1
 *         exercise:
 *           $ref: '#/components/schemas/ExerciseResponse'
 *         series_count:
 *           type: integer
 *           example: 4
 *         repetitions_expected:
 *           type: string
 *           example: "8-12"
 *         load_suggested:
 *           type: string
 *           example: "50kg"
 *         observations:
 *           type: string
 *           example: "Priorizar a técnica."
 *         order_index:
 *           type: integer
 *           example: 1
 *         modifier_ids:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2]
 *         modifiers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModifierResponse'
 *     WorkoutPlanResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Plano de Hipertrofia - João"
 *         description:
 *           type: string
 *           example: "Foco em ganho de massa muscular para o aluno João."
 *         instructor_id:
 *           type: integer
 *           example: 2
 *         instructor:
 *           $ref: '#/components/schemas/UserResponse'
 *         student_id:
 *           type: integer
 *           example: 3
 *         student:
 *           $ref: '#/components/schemas/UserResponse'
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2024-05-01"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2024-07-31"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkoutPlanItemResponse'
 */

const workoutPlanItemSchema = Joi.object({
  exercise_id: Joi.number().integer().positive().required(),
  series_count: Joi.number().integer().min(1).required(),
  repetitions_expected: Joi.string().required(),
  load_suggested: Joi.string().required(),
  observations: Joi.string().optional().allow(''),
  order_index: Joi.number().integer().min(1).required(),
  modifier_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
});

const createWorkoutPlanSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  student_id: Joi.number().integer().positive().required(),
  instructor_id: Joi.number().integer().positive().optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  items: Joi.array().items(workoutPlanItemSchema).min(1).required(),
});

const updateWorkoutPlanSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(''),
  student_id: Joi.number().integer().positive(),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  items: Joi.array().items(workoutPlanItemSchema).min(1),
}).min(1);

/**
 * @swagger
 * /api/v1/workout-plans:
 *   post:
 *     tags: [Workout Plan Management]
 *     summary: Cria um novo plano de treino detalhado
 *     description: Apenas Admin e Instrutores podem criar planos.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { "application/json": { schema: { $ref: '#/components/schemas/WorkoutPlanCreate' } } }
 *     responses:
 *       '201': { description: "Plano de treino criado com sucesso." }
 *   get:
 *     tags: [Workout Plan Management]
 *     summary: Lista todos os planos de treino (com base na autorização)
 *     description: Admin vê todos; Instrutor vê os que criou e os de seus alunos; Aluno vê apenas os seus.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: student_id, schema: { type: integer }, description: "Filtrar planos por ID do aluno." }
 *       - { in: query, name: instructor_id, schema: { type: integer }, description: "Filtrar planos por ID do instrutor." }
 *     responses:
 *       '200': { description: "Lista de planos de treino recuperada com sucesso." }
 */
router.route('/')
  .post(authenticate, authorize(['Admin', 'Instrutor']), validate(createWorkoutPlanSchema), workoutPlanController.createWorkoutPlan)
  .get(authenticate, workoutPlanController.getAllWorkoutPlans);

/**
 * @swagger
 * /api/v1/workout-plans/{id}:
 *   get:
 *     tags: [Workout Plan Management]
 *     summary: Obtém um plano de treino por ID
 *     description: A autorização é granular (Admin, Instrutor criador, ou Aluno dono do plano).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do plano de treino." }
 *     responses:
 *       '200': { description: "Plano de treino recuperado com sucesso." }
 *   put:
 *     tags: [Workout Plan Management]
 *     summary: Atualiza um plano de treino por ID
 *     description: A autorização é granular (Admin ou Instrutor criador).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do plano de treino." }
 *     requestBody:
 *       required: true
 *       content: { "application/json": { schema: { $ref: '#/components/schemas/WorkoutPlanUpdate' } } }
 *     responses:
 *       '200': { description: "Plano de treino atualizado com sucesso." }
 *   delete:
 *     tags: [Workout Plan Management]
 *     summary: Deleta um plano de treino por ID
 *     description: A autorização é granular (Admin ou Instrutor criador).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID do plano de treino." }
 *     responses:
 *       '204': { description: "Plano de treino deletado com sucesso." }
 */
router.route('/:id')
  .get(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), workoutPlanController.getWorkoutPlanById)
  .put(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }), body: updateWorkoutPlanSchema }), workoutPlanController.updateWorkoutPlan)
  .delete(authenticate, authorize(['Admin', 'Instrutor']), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), workoutPlanController.deleteWorkoutPlan);

export default router;
