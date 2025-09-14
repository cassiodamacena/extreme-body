import express from 'express';
import { userManagementController } from '../controllers/userManagementController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

// Joi schemas for validation
const userBaseSchema = Joi.object({
  documento: Joi.string().pattern(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/).required(), // Ex: 123.456.789-00
  nome_completo: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(8).required(),
});

const studentProfileSchema = Joi.object({
  height: Joi.number().min(50).max(250).optional(),
  weight: Joi.number().min(10).max(500).optional(),
  date_of_birth: Joi.string().isoDate().optional(),
  instructor_id: Joi.number().integer().positive().optional(),
});

const instructorProfileSchema = Joi.object({
  cref: Joi.string().regex(/^[0-9]{6}-\w\/\w{2}$/).required(), // Ex: 123456-G/SP
  specialization: Joi.string().max(255).optional(),
  bio: Joi.string().max(500).optional(),
});

const createUserSchema = Joi.object({
  user_data: userBaseSchema.required(),
  profile_data: Joi.object().optional(), // Será validado especificamente no controller/service
});

const createStudentSchema = Joi.object({
  user_data: userBaseSchema.required(),
  profile_data: studentProfileSchema.required(),
});

const createInstructorSchema = Joi.object({
  user_data: userBaseSchema.required(),
  profile_data: instructorProfileSchema.required(),
});

const updateUserSchema = Joi.object({
  user_data: Joi.object({
    documento: Joi.string().pattern(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/),
    nome_completo: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    senha: Joi.string().min(8),
    status: Joi.string().valid('Ativo', 'Inativo'),
  }).optional(),
  profile_data: Joi.object().unknown(true).optional(), // Permite qualquer campo dentro do profile_data
}).min(1).messages({ // Garante que o corpo da requisição não esteja vazio
  'object.min': 'O corpo da requisição deve conter pelo menos user_data ou profile_data.'
});

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: Gerenciamento de usuários, alunos e instrutores
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         documento:
 *           type: string
 *         nome_completo:
 *           type: string
 *         email:
 *           type: string
 *         tipo:
 *           type: string
 *         status:
 *           type: string
 *         created_at:
 *           type: string
 *         updated_at:
 *           type: string
 *         profile:
 *           type: object
  *     UserBase:
  *       type: object
  *       required:
  *         - documento
  *         - nome_completo
  *         - email
  *         - senha
  *       properties:
  *         documento:
  *           type: string
  *           pattern: '^\d{3}\.\d{3}\.\d{3}-\d{2}$'
  *           example: "123.456.789-00"
  *         nome_completo:
  *           type: string
  *           minLength: 3
  *           maxLength: 100
  *           example: "Fulano de Tal"
  *         email:
  *           type: string
  *           format: email
  *           example: "fulano@example.com"
  *         senha:
  *           type: string
  *           minLength: 8
  *           example: "SenhaSegura123!"
  *     StudentProfileCreate:
  *       type: object
  *       required:
  *         - height
  *         - weight
  *         - date_of_birth
  *       properties:
  *         height:
  *           type: number
  *           format: float
  *           minimum: 50
  *           maximum: 250
  *           example: 175.5
  *         weight:
  *           type: number
  *           format: float
  *           minimum: 10
  *           maximum: 500
  *           example: 70.2
  *         date_of_birth:
  *           type: string
  *           format: date
  *           example: "1990-01-01"
  *         instructor_id:
  *           type: integer
  *           format: int64
  *           example: 2
  *     InstructorProfileCreate:
  *       type: object
  *       required:
  *         - cref
  *       properties:
  *         cref:
  *           type: string
  *           pattern: '^\d{6}-\w/\w{2}$'
  *           example: "123456-G/SP"
  *         specialization:
  *           type: string
  *           maxLength: 255
  *           example: "Musculação, Hipertrofia"
  *         bio:
  *           type: string
  *           maxLength: 500
  *           example: "Especialista em treinamento de força e condicionamento."
 *   responses:
 *     Unauthorized:
 *       description: Acesso negado por falta de autenticação ou token inválido/expirado.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, example: error }
 *               message: { type: string, example: "Você não está logado! Por favor, faça login para ter acesso." }
 *     Forbidden:
 *       description: Acesso negado por falta de permissão para a ação solicitada.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, example: fail }
 *               message: { type: string, example: "Você não tem permissão para realizar esta ação." }
  *     BadRequest:
  *       description: Requisição inválida devido a dados incorretos ou faltantes.
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               status: { type: string, example: fail }
  *               message: { type: string, example: "Dados de requisição inválidos." }
  *               details: { type: string, example: "\"documento\" with value \"invalid\" fails to match the required pattern" }
  *     NotFound:
  *       description: Recurso não encontrado.
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               status: { type: string, example: fail }
  *               message: { type: string, example: "Usuário não encontrado." }
 */

// User management routes
/**
 * @swagger
 * /api/v1/users-management/students:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Cria um novo usuário aluno
 *     description: Apenas Admin e Instrutores podem criar novos alunos.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_data
 *               - profile_data
 *             properties:
 *               user_data:
 *                 $ref: '#/components/schemas/UserBase'
 *               profile_data:
 *                 $ref: '#/components/schemas/StudentProfileCreate'
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso.
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
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/students',
  authenticate,
  authorize(['Admin', 'Instrutor']),
  validate(createStudentSchema),
  userManagementController.createStudent
);

/**
 * @swagger
 * /api/v1/users-management/instructors:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Cria um novo usuário instrutor
 *     description: Apenas Admin podem criar novos instrutores.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_data
 *               - profile_data
 *             properties:
 *               user_data:
 *                 $ref: '#/components/schemas/UserBase'
 *               profile_data:
 *                 $ref: '#/components/schemas/InstructorProfileCreate'
 *     responses:
 *       201:
 *         description: Instrutor criado com sucesso.
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
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/instructors',
  authenticate,
  authorize(['Admin']),
  validate(createInstructorSchema),
  userManagementController.createInstructor
);

/**
 * @swagger
 * /api/v1/users-management:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Lista todos os usuários (com base na autorização)
 *     description: Admin vê todos; Instrutor vê a si mesmo e seus alunos; Aluno vê a si mesmo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Admin, Instrutor, Aluno]
 *         description: Filtrar usuários por tipo.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo]
 *         description: Filtrar usuários por status.
 *     responses:
 *       200:
 *         description: Lista de usuários recuperada com sucesso.
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
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/',
  authenticate,
  userManagementController.getAllUsers
);

/**
 * @swagger
 * /api/v1/users-management/{id}:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Obtém um usuário por ID
 *     description: Admin vê qualquer um; Instrutor vê a si mesmo e seus alunos; Aluno vê a si mesmo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário recuperado com sucesso.
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
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  authenticate,
  validate({
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
  }),
  userManagementController.getUserById
);

/**
 * @swagger
 * /api/v1/users-management/{id}:
 *   put:
 *     tags:
 *       - User Management
 *     summary: Atualiza um usuário por ID
 *     description: Admin atualiza qualquer um; Instrutor atualiza a si mesmo e seus alunos; Aluno atualiza a si mesmo (com restrições).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_data:
 *                 type: object
 *                 properties:
 *                   documento:
 *                     type: string
 *                     pattern: '^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$'
 *                     example: "123.456.789-00"
 *                   nome_completo:
 *                     type: string
 *                     minLength: 3
 *                     maxLength: 100
 *                     example: "Fulano de Tal Atualizado"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "fulano_novo@example.com"
 *                   senha:
 *                     type: string
 *                     minLength: 8
 *                     example: "NovaSenhaSegura123!"
 *                   status:
 *                     type: string
 *                     enum: [Ativo, Inativo]
 *               profile_data:
 *                 type: object
 *                 description: Dados de perfil específicos (StudentProfile ou InstructorProfile)
 *                 properties:
 *                   height: { type: number, format: float, example: 178 }
 *                   weight: { type: number, format: float, example: 75 }
 *                   date_of_birth: { type: string, format: date, example: "1990-01-01" }
 *                   instructor_id: { type: integer, example: 2 }
 *                   cref: { type: string, example: "987654-G/RJ" }
 *                   specialization: { type: string, example: "Crossfit" }
 *                   bio: { type: string, example: "Nova biografia." }
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
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
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  authenticate,
  validate({
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
    body: updateUserSchema,
  }),
  userManagementController.updateUser
);

/**
 * @swagger
 * /api/v1/users-management/{id}:
 *   delete:
 *     tags:
 *       - User Management
 *     summary: Deleta um usuário por ID
 *     description: Admin deleta qualquer um; Instrutor deleta seus alunos; Aluno deleta a si mesmo. Verificações de vínculos são realizadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário deletado com sucesso.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  authenticate,
  validate({
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
  }),
  userManagementController.deleteUser
);

export default router;
