
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './middlewares/errorHandler.js';
import logger from './config/logger.js'; // Importa o logger Winston
import userManagementRoutes from './routes/userManagementRoutes.js'; // Importe a nova rota
import authRoutes from './routes/authRoutes.js';

const app = express();

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gym Management API',
      version: '1.0.0',
      description: 'API para gestão de treinos de academia',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos de rota que contêm as anotações JSDoc
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares essenciais de segurança e logging
app.use(express.json()); // Permite que o Express leia JSON do corpo da requisição
app.use(express.urlencoded({ extended: true })); // Permite que o Express leia dados de formulário

// Integra o Morgan com o Winston. Todas as requisições HTTP serão logadas nos arquivos.
// Usamos o formato 'combined' para logs mais detalhados nos arquivos.
app.use(morgan('combined', { stream: logger.stream }));

app.use(helmet()); // Proteção contra vulnerabilidades de cabeçalho HTTP
app.use(cors()); // Habilita CORS para todas as origens (ajustar em produção)

// Configuração de rate limiting básico (ajustar conforme necessidade)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP em 15 minutos
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
});
app.use(apiLimiter);

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Rotas da API
app.use('/api/v1/users-management', userManagementRoutes); // Adicione a nova rota de gerenciamento de usuários
app.use('/api/v1/auth', authRoutes); // Adicione a rota de autenticação

// Middleware para rotas não encontradas (404)
app.all('*', (req, res, next) => {
  next(new Error(`A rota ${req.originalUrl} não foi encontrada no servidor!`, { cause: 404 }));
});

// Middleware de tratamento de erros global
app.use(errorHandler);

export default app;
