import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import config from '@/config/app';
import routes from '@/routes';
import swaggerSpec from '@/config/swagger';
import { generalLimiter } from '@/middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import requestLogger from '@/middleware/logger.middleware';

const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // HTTP request logger
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // Custom request logger
  app.use(requestLogger);

  // Rate limiting
  app.use('/api', generalLimiter);

  // API routes
  app.use('/api/v1', routes);

  // Swagger JSON spec
  app.get('/api/v1/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI Documentation
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'Smart Habit Tracker API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  }));

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Smart Habit Tracker API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;
