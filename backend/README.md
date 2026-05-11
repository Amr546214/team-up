# TeamUp Backend API

Express.js backend API for TeamUp application.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your values:
```
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/teamup
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Auth Routes

#### Get Current User
```
GET /auth/me
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@gmail.com",
      "role": "client | developer | company | admin",
      "fullName": "John Doe",
      "companyName": "...",
      "companySize": "...",
      "industry": "...",
      "skills": [],
      "servicesWanted": [],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - User not found
- `500` - Server error

## Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Testing with cURL

```bash
# Get current user
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Health check
curl http://localhost:5000/health
```

## Architecture

```
backend/
├── server.js              # Express server entry point
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── README.md              # Documentation
├── middleware/
│   └── authMiddleware.js  # JWT verification middleware
├── controllers/
│   └── authController.js # Auth endpoint handlers
├── routes/
│   └── authRoutes.js      # Auth route definitions
└── data/
    └── userStore.js       # Mock user data (replace with DB)
```

## Production Notes

1. Replace `userStore.js` with actual database integration (MongoDB, PostgreSQL, etc.)
2. Use strong JWT secret (generate with `openssl rand -base64 64`)
3. Enable HTTPS
4. Add rate limiting
5. Add request logging
6. Set up proper CORS configuration
