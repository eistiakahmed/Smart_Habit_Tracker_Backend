# Swagger API Documentation

## Accessing the Documentation

Once your server is running, you can access the Swagger UI documentation at:

- **Development**: http://localhost:5000/api/v1/docs
- **Production**: https://api.smarthabits.com/api/v1/docs

The raw OpenAPI JSON specification is available at:

- **Development**: http://localhost:5000/api/v1/docs.json
- **Production**: https://api.smarthabits.com/api/v1/docs.json

## Features

The Swagger UI includes:

- **Interactive API testing** - Try out endpoints directly from the browser
- **Request/response schemas** - View expected data structures
- **Authentication support** - Bearer token authentication with persistent login
- **Syntax highlighting** - Easy-to-read request/response examples
- **Request duration** - See how long each request takes
- **Searchable docs** - Filter endpoints by tag or path

## Authentication

To test authenticated endpoints:

1. Click the **"Authorize"** button (lock icon) at the top right
2. Enter your JWT token: `Bearer your_token_here`
3. Click **"Authorize"** to save the token for all requests
4. The token will persist in your session

## Using the Documentation

1. **Browse endpoints** - Click on any endpoint group (Authentication, Habits, Goals, etc.)
2. **Try it out** - Click "Try it out" on any endpoint
3. **Fill parameters** - Enter required parameters and request body
4. **Execute** - Click "Execute" to send the request
5. **View response** - See the response status, headers, and body

## Adding New Endpoints

When adding new endpoints, document them using JSDoc comments:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param1
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', yourController);
```

## Schemas

Reusable schemas are defined in [`src/config/swagger.ts`](src/config/swagger.ts). Reference them using:

```typescript
$ref: '#/components/schemas/User'
$ref: '#/components/schemas/Habit'
$ref: '#/components/schemas/SuccessResponse'
```

## License

MIT
