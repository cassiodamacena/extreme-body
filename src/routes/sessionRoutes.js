import express from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Session Management
 *   description: Gerenciamento de sessões de treino e suas execuções
 * components:
 *   schemas:
 *     ExecutionItemCreate:
 *       type: object
 *       required:
 *         - exercise_id
 *         - series_completed
 *         - repetitions_completed
 *         - load_used
 *       properties:
 *         exercise_id:
 *           type: integer
 *           description: ID do exercício do catálogo.
 *           example: 1
 *         series_completed:
 *           type: integer
 *           minimum: 1
 *           example: 4
 *         repetitions_completed:
 *           type: string
 *           example: "10,10,9,8"
 *         load_used:
 *           type: string
 *           example: "45kg"
 *         observations:
 *           type: string
 *           example: "Foco na forma, última série até a falha."
 *         modifier_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: IDs dos modificadores de set realmente aplicados.
 *           example: [2]
 *     SessionCreate:
 *       type: object
 *       required:
 *         - student_id
 *         - session_date
 *         - executions
 *       properties:
 *         student_id:
 *           type: integer
 *           description: ID do aluno que realizou a sessão.
 *           example: 3
 *         workout_plan_id:
 *           type: integer
 *           description: ID do plano de treino ao qual esta sessão está vinculada (opcional).
 *           example: 1
 *         session_date:
 *           type: string
 *           format: date
 *           example: "2024-05-01"
 *         observations:
 *           type: string
 *           example: "Dia de treino intenso, senti bom pump."
 *         executions:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/ExecutionItemCreate'
 *     SessionUpdate:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *           description: ID do aluno que realizou a sessão.
 *           example: 3
 *         workout_plan_id:
 *           type: integer
 *           description: ID do plano de treino ao qual esta sessão está vinculada (opcional).
 *           example: 1
 *         session_date:
 *           type: string
 *           format: date
 *           example: "2024-05-02"
 *         observations:
 *           type: string
 *           example: "Dia de treino intenso, senti bom pump. Revisado."
 *         executions:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/ExecutionItemCreate'
 *     ExecutionItemResponse:
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
 *         series_completed:
 *           type: integer
 *           example: 4
 *         repetitions_completed:
 *           type: string
 *           example: "10,10,9,8"
 *         load_used:
 *           type: string
 *           example: "45kg"
 *         observations:
 *           type: string
 *           example: "Última série com falha assistida."
 *         modifier_ids:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2]
 *         modifiers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModifierResponse'
 *     SessionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         student_id:
 *           type: integer
 *           example: 3
 *         student:
 *           $ref: '#/components/schemas/UserResponse'
 *         workout_plan_id:
 *           type: integer
 *           example: 1
 *         workoutPlan:
 *           $ref: '#/components/schemas/WorkoutPlanResponse'
 *         session_date:
 *           type: string
 *           format: date
 *           example: "2024-05-01"
 *         observations:
 *           type: string
 *           example: "Treino de peito e costas conforme plano."
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         executions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExecutionItemResponse'
 */

const executionItemSchema = Joi.object({
  exercise_id: Joi.number().integer().positive().required(),
  series_completed: Joi.number().integer().min(1).required(),
  repetitions_completed: Joi.string().required(),
  load_used: Joi.string().required(),
  observations: Joi.string().optional().allow(''),
  modifier_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
});

const createSessionSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  workout_plan_id: Joi.number().integer().positive().optional(),
  session_date: Joi.date().iso().required(),
  observations: Joi.string().optional().allow(''),
  executions: Joi.array().items(executionItemSchema).min(1).required(),
});

const updateSessionSchema = Joi.object({
  student_id: Joi.number().integer().positive(),
  workout_plan_id: Joi.number().integer().positive(),
  session_date: Joi.date().iso(),
  observations: Joi.string().allow(''),
  executions: Joi.array().items(executionItemSchema).min(1),
}).min(1);

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     tags: [Session Management]
 *     summary: Registra uma nova sessão de treino
 *     description: Alunos registram suas próprias sessões. Admin e Instrutores podem registrar sessões para seus alunos.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionCreate'
 *     responses:
 *       '201':
 *         description: Sessão de treino registrada com sucesso.
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
 *                     session:
 *                       $ref: '#/components/schemas/SessionResponse'
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Session Management]
 *     summary: Lista o histórico de sessões de treino (com base na autorização)
 *     description: Retorna uma lista de todas as sessões de treino que o usuário tem permissão para visualizar. Admin vê todas; Instrutor vê as de seus alunos; Aluno vê apenas as suas. As sessões retornadas incluem detalhes completos das execuções e informações de exercícios e modificadores, servindo como um histórico detalhado.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: student_id, schema: { type: integer }, description: "Filtrar sessões por ID do aluno." }
 *       - { in: query, name: workout_plan_id, schema: { type: integer }, description: "Filtrar sessões por ID do plano de treino." }
 *       - { in: query, name: session_date, schema: { type: string, format: date }, description: "Filtrar sessões por data." }
 *     responses:
 *       '200':
 *         description: Histórico de sessões de treino recuperado com sucesso.
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
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SessionResponse'
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 */
router.route('/')
  .post(authenticate, authorize(['Aluno', 'Admin', 'Instrutor']), validate(createSessionSchema), sessionController.createSession)
  .get(authenticate, sessionController.getAllSessions);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   get:
 *     tags: [Session Management]
 *     summary: Obtém os detalhes de uma sessão de treino específica por ID
 *     description: Retorna os detalhes completos de uma sessão de treino específica, incluindo todas as execuções de exercícios com seus detalhes (exercício, séries, repetições, carga, observações e modificadores), informações do aluno e do plano de treino associado.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID da sessão de treino." }
 *     responses:
 *       '200':
 *         description: Detalhes da sessão de treino recuperados com sucesso.
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
 *                     session:
 *                       $ref: '#/components/schemas/SessionResponse'
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Session Management]
 *     summary: Atualiza uma sessão de treino por ID
 *     description: Admin e Instrutor podem atualizar sessões de seus alunos. Aluno pode atualizar suas próprias sessões.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID da sessão de treino." }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionUpdate'
 *     responses:
 *       '200':
 *         description: Sessão de treino atualizada com sucesso.
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
 *                     session:
 *                       $ref: '#/components/schemas/SessionResponse'
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Session Management]
 *     summary: Deleta uma sessão de treino por ID
 *     description: Admin e Instrutor podem deletar sessões de seus alunos. Aluno pode deletar suas próprias sessões.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, description: "ID da sessão de treino." }
 *     responses:
 *       '204': { description: "Sessão de treino deletada com sucesso." }
 *       '401': { $ref: '#/components/responses/Unauthorized' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
router.route('/:id')
  .get(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), sessionController.getSessionById)
  .put(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }), body: updateSessionSchema }), sessionController.updateSession)
  .delete(authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), sessionController.deleteSession);

export default router;