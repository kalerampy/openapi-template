# Authentication System

This project uses JWT-based authentication with bcrypt password hashing and D1 database storage.

## Features

- **User Registration** - Create new user accounts with email validation
- **Secure Login** - Authenticate users with username/password
- **Password Hashing** - Passwords are hashed using bcrypt (10 rounds)
- **JWT Tokens** - Access tokens (15 min) and refresh tokens (7 days)
- **Database Storage** - User data stored in Cloudflare D1 (SQLite)
- **Protected Routes** - All `/tasks` endpoints require authentication
- **Middleware Protection** - Automatic token verification via middleware

## API Endpoints

### Register a New User

**POST** `/auth/register`

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "result": {
    "message": "Registration successful",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "user": {
      "id": "user_1234567890_abc123",
      "username": "johndoe",
      "email": "john@example.com",
      "created_at": "2025-12-06T00:00:00.000Z",
      "updated_at": "2025-12-06T00:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- Username: 3-50 characters, alphanumeric plus `_` and `-`
- Email: Valid email format
- Password: 8-100 characters

### Login

**POST** `/auth/login`

```json
{
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "message": "Login successful",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "user": {
      "id": "user_1234567890_abc123",
      "username": "johndoe",
      "email": "john@example.com",
      "created_at": "2025-12-06T00:00:00.000Z",
      "updated_at": "2025-12-06T00:00:00.000Z"
    }
  }
}
```

### Refresh Token

**POST** `/auth/refresh`

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "message": "Token refreshed successfully",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

### Get Current User

**GET** `/auth/me` (Protected)

Requires authentication via Bearer token.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "user": {
      "id": "user_1234567890_abc123",
      "username": "johndoe",
      "email": "john@example.com",
      "created_at": "2025-12-06T00:00:00.000Z",
      "updated_at": "2025-12-06T00:00:00.000Z"
    }
  }
}
```

## Protected Routes

### Using Authentication

All `/tasks` endpoints require authentication. Include the access token in the Authorization header:

```bash
# Example: List tasks (protected)
curl -X GET http://localhost:8787/tasks \
  -H "Authorization: Bearer eyJhbGc..."
```

**Protected Endpoints:**
- `GET /tasks` - List all tasks
- `POST /tasks` - Create a new task
- `GET /tasks/:id` - Get a specific task
- `PUT /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
- `GET /auth/me` - Get current user info

**Public Endpoints:**
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token

### Authentication Flow

1. **Register or Login** to get tokens:
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"SecurePassword123"}'
```

2. **Use the access token** in subsequent requests:
```bash
curl -X GET http://localhost:8787/tasks \
  -H "Authorization: Bearer <accessToken>"
```

3. **Refresh when token expires** (after 15 minutes):
```bash
curl -X POST http://localhost:8787/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Accessing User Information in Code

Within protected endpoints, you can access the authenticated user:

```typescript
import { getAuthUser } from "../../middleware/auth";

// Inside your endpoint handler
const authUser = getAuthUser(c);
console.log(authUser.userId);    // "user_1234567890_abc123"
console.log(authUser.username);  // "johndoe"
```

## Token Structure

### Access Token
- **Type**: JWT
- **Expiration**: 15 minutes
- **Purpose**: API authentication

**Payload:**
```json
{
  "userId": "user_1234567890_abc123",
  "username": "johndoe",
  "type": "access",
  "iat": 1701820800,
  "exp": 1701821700
}
```

### Refresh Token
- **Type**: JWT
- **Expiration**: 7 days
- **Purpose**: Obtaining new access tokens

**Payload:**
```json
{
  "userId": "user_1234567890_abc123",
  "username": "johndoe",
  "type": "refresh",
  "iat": 1701820800,
  "exp": 1702425600
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Indexes:**
- `idx_users_username` on `username`
- `idx_users_email` on `email`

## Configuration

### Environment Variables

Create a `.dev.vars` file for local development:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Production Setup

For production deployment, set the JWT_SECRET as a secret in Cloudflare Workers:

```bash
npx wrangler secret put JWT_SECRET
```

Then apply the database migration:

```bash
npx wrangler d1 migrations apply DB --remote
```

## Security Best Practices

1. **Strong JWT Secret**: Use a long, random string (at least 32 characters)
2. **HTTPS Only**: Always use HTTPS in production
3. **Password Requirements**: Enforce minimum 8 characters
4. **Rate Limiting**: Consider adding rate limiting to auth endpoints
5. **Token Storage**: Store tokens securely (HttpOnly cookies or secure storage)

## Project Structure

```
src/
├── endpoints/auth/
│   ├── login.ts          # Login endpoint
│   ├── register.ts       # Registration endpoint
│   ├── refresh.ts        # Token refresh endpoint
│   ├── me.ts             # Get current user endpoint
│   └── router.ts         # Auth routes
├── middleware/
│   └── auth.ts           # JWT authentication middleware
├── models/
│   └── user.ts           # User types and schemas
├── repositories/
│   └── userRepository.ts # Database operations
└── utils/
    └── jwt.ts            # JWT utilities

migrations/
└── 0002_add_users_table.sql  # Users table migration
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "errors": [
    {
      "code": 400,
      "message": "Username already taken"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "errors": [
    {
      "code": 401,
      "message": "Invalid username or password"
    }
  ]
}
```

## Testing

You can test the authentication endpoints using the OpenAPI documentation at `/documentation` when running the development server:

```bash
pnpm dev
```

Then visit `http://localhost:8787/documentation` to interact with the API.
