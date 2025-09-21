import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './middlewares/errorHandler.js';
import logger from './config/logger.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import workoutPlanRoutes from './routes/workoutPlanRoutes.js';
import modifierRoutes from './routes/modifierRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/schemas/index.js';
import { resolvers } from './graphql/resolvers/index.js';
import { verifyToken } from './utils/jwtUtils.js';
import { userModel } from './models/userModel.js';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';


export const createApp = async () => {
  const app = express();

  // Rota básica para /
  app.get('/', (req, res) => {
    res.send('Extreme Body Online!!!');
  });

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
    apis: ['./src/routes/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: logger.stream }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          "img-src": ["'self'", "data:", "cdn.jsdelivr.net"],
        },
      },
    })
  );
  app.use(cors());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
  });
  app.use(apiLimiter);

  // Apollo Server Setup - Playground clássico
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return {};
      try {
        const decoded = verifyToken(token);
        const user = await userModel.findById(decoded.id);
        return { user };
      } catch (error) {
        return {};
      }
    },
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  logger.info(`🚀 GraphQL server ready at http://localhost:${process.env.PORT || 3000}${server.graphqlPath}`);

  // Rota para favicon.ico
  app.get('/favicon.ico', (req, res) => res.status(204).send());

  // API Docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // REST API Routes
  app.use('/api/v1/users-management', userManagementRoutes);
  app.use('/api/v1/exercises', exerciseRoutes);
  app.use('/api/v1/modifiers', modifierRoutes);
  app.use('/api/v1/workout-plans', workoutPlanRoutes);
  app.use('/api/v1/sessions', sessionRoutes);
  app.use('/api/v1/auth', authRoutes);

  // 404 Handler
  app.all('*', (req, res, next) => {
    // The error handler will catch this and return a 404
    next(new Error(`A rota ${req.originalUrl} não foi encontrada no servidor!`, { cause: 404 }));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};