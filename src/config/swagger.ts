import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Habit Tracker API',
      version: '1.0.0',
      description: `A production-level RESTful API for tracking daily habits and goals.

      ## Features
      - JWT-based authentication
      - Habit tracking with streaks and progress analytics
      - Goal setting and achievement tracking
      - User profile management
      - Rate limiting and security middleware

      ## Authentication
      Most endpoints require a Bearer token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your-access-token>
      \`\`\`

      ## Rate Limiting
      - General endpoints: 100 requests per 15 minutes
      - Authentication endpoints: 5 requests per 15 minutes`,
      contact: {
        name: 'Smart Habits Team',
        email: 'support@smarthabits.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.smarthabits.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            username: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            preferences: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['light', 'dark', 'system'],
                },
                notifications: {
                  type: 'boolean',
                },
              },
            },
            timezone: {
              type: 'string',
              example: 'America/New_York',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15min expiration)',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token (7 days expiration)',
            },
            expiresIn: {
              type: 'integer',
              description: 'Access token expiration in seconds',
              example: 900,
            },
          },
        },
        Habit: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
              example: 'Morning Meditation',
            },
            description: {
              type: 'string',
              example: '10 minutes of meditation every morning',
            },
            category: {
              type: 'string',
              enum: ['wellness', 'health', 'productivity', 'learning', 'finance', 'social', 'creativity', 'other'],
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              example: '#3B82F6',
            },
            icon: {
              type: 'string',
              example: '🧘',
            },
            frequency: {
              type: 'string',
              enum: ['DAILY', 'WEEKLY', 'CUSTOM'],
            },
            targetDays: {
              type: 'integer',
              minimum: 1,
              description: 'Target number of days',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
            },
            reminderTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '07:00',
            },
            isActive: {
              type: 'boolean',
            },
            difficulty: {
              type: 'string',
              enum: ['EASY', 'MEDIUM', 'HARD'],
            },
            stats: {
              type: 'object',
              properties: {
                currentStreak: {
                  type: 'integer',
                },
                longestStreak: {
                  type: 'integer',
                },
                completionRate: {
                  type: 'number',
                  format: 'float',
                },
                daysCompleted: {
                  type: 'integer',
                },
                totalDays: {
                  type: 'integer',
                },
              },
            },
            todayCompleted: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        HabitLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            habitId: {
              type: 'string',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
            note: {
              type: 'string',
              nullable: true,
            },
            mood: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
            },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            targetValue: {
              type: 'number',
            },
            currentValue: {
              type: 'number',
            },
            unit: {
              type: 'string',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'The requested resource was not found',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                  details: [
                    {
                      field: 'email',
                      message: 'Invalid email format',
                    },
                  ],
                },
              },
            },
          },
        },
        RateLimitExceeded: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management endpoints',
      },
      {
        name: 'Habits',
        description: 'Habit tracking and management endpoints',
      },
      {
        name: 'Goals',
        description: 'Goal setting and tracking endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export default swaggerJsdoc(options);
