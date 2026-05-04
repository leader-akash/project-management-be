# Backend

Express API for ProjectFlow. It provides authentication, project and task CRUD, comments, permission checks, MongoDB persistence, and Socket.IO broadcasts with optional Redis adapter support.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Environment

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/internal_project_management
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://127.0.0.1:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

## Scripts

- `npm run dev` starts the API with nodemon.
- `npm start` starts the API with Node.
- `npm run check` syntax-checks the backend entry file.

## Structure

- `src/models` contains Mongoose models.
- `src/services` contains business logic.
- `src/controllers` contains request handlers.
- `src/routes` contains Express route definitions.
- `src/sockets` contains Socket.IO auth and room handling.
- `src/validations` contains Zod schemas.

