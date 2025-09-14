

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação (login)
 */
import express from 'express';
import { authController } from '../controllers/authController.js';
import { validate, Joi } from '../middlewares/validate.js';

const router = express.Router();

// Joi schema for login
const loginSchema = Joi.object({
  documentoOuEmail: Joi.string().required(),
  senha: Joi.string().required(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - documentoOuEmail
 *         - senha
 *       properties:
 *         documentoOuEmail:
 *           type: string
 *           example: "admin@app.com"
 *         senha:
 *           type: string
 *           example: "senhaAdmin123!"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Realiza login e retorna um token JWT
 *     description: Permite login por documento ou email e senha. Retorna um token JWT válido para autenticação.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dados de requisição inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: fail }
 *                 message: { type: string, example: "Dados de requisição inválidos." }
 *       401:
 *         description: Credenciais inválidas ou usuário inativo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: error }
 *                 message: { type: string, example: "Credenciais inválidas." }
 */
router.post('/login', validate(loginSchema), authController.login);

export default router;
