# Smart Habit Tracker Backend

Production-level backend API for Smart Daily Habit & To-Do Tracker application.

## Features

- **Authentication**: JWT-based auth with refresh tokens
- **Habit Tracking**: Create, update, track, and analyze daily habits
- **Progress Analytics**: Streaks, completion rates, and mood tracking
- **Goal Management**: Set and track measurable goals
- **Achievements**: Gamification with badges and milestones
- **Notifications**: In-app notifications for reminders and achievements
- **Rate Limiting**: Protection against API abuse
- **Timezone Support**: User-specific timezone handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Logging**: Winston
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher
- pnpm 9.0 or higher

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for access tokens
- `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
- `PORT`: Server port (default: 5000)

## Running

```bash
# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/profile` - Update profile

### Habits
- `GET /api/v1/habits` - List all habits
- `POST /api/v1/habits` - Create habit
- `GET /api/v1/habits/:id` - Get habit details
- `PUT /api/v1/habits/:id` - Update habit
- `DELETE /api/v1/habits/:id` - Delete habit
- `POST /api/v1/habits/:id/toggle` - Toggle completion
- `GET /api/v1/habits/:id/progress` - Get progress
- `GET /api/v1/habits/:id/streak` - Get streak info

### Health
- `GET /api/v1/health` - API health check

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
├── validators/     # Zod validation schemas
├── app.ts          # Express app setup
└── server.ts       # Server entry point
```

## License

MIT
