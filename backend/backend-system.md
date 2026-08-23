# Food Delivery Platform — Backend System Design

## Overview

Production-grade REST API for a food delivery platform. Built with Node.js, Express 5, MongoDB (Mongoose 9), JWT authentication, Zod validation, and structured logging. Follows a strict layered architecture: **routes → services → data**, with middleware handling auth, validation, rate limiting, and error handling.

## Architecture

```
HTTP Request
    │
    ▼
index.js (composition root)
    ├── helmet()                    Security HTTP headers
    ├── cors(corsOptions)           Locked-down CORS
    ├── limiter()                   Global rate limiting (100/15min)
    ├── express.json({ limit })     Body parser (10kb max)
    ├── compression()               gzip
    ├── loggerMiddleware()          Request ID + structured Pino logging
    │
    ▼
Route (routes/*.js)                  Thin HTTP layer
    ├── protect middleware           JWT verification + req.user
    ├── requireRole(...)            Role-based access control
    ├── try/catch → next(error)     Async error forwarding
    │
    ▼
Service (services/*.js)             Business logic (no req/res)
    ├── Zod validation              Input sanitization + type safety
    ├── Domain rules                Authorization, calculations
    └── Mongoose queries            Data access
    │
    ▼
Model (models/*.js)                  Mongoose schemas + indexes
    │
    ▼
Error Handler (middleware/errorHandler.js)
    ├── Custom AppError classes     → status codes
    ├── Mongoose errors             → friendly messages
    ├── Stack traces                → hidden in production
    └── Request ID correlation      → in logs
```

**Rules enforced at every layer:**
- Controllers (routes) never touch the DB directly
- Services never see `req`/`res`
- Validation happens at every boundary (Zod in services)
- Every async handler has try/catch forwarding to `next(error)`

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 22+ | JavaScript runtime |
| Framework | Express 5.x | HTTP server & routing |
| ODM | Mongoose 9.x | MongoDB object modeling |
| Auth | jsonwebtoken 9.x | JWT creation/verification |
| Hashing | bcrypt 5.x | Password hashing (cost from env) |
| Validation | Zod 3.x | Schema validation at every boundary |
| Logging | Pino 10.x | Structured JSON logging |
| Security | Helmet 8.x | Security HTTP headers |
| Rate Limiting | express-rate-limit 8.x | Abuse protection |
| Compression | compression 1.x | gzip responses |
| Env | dotenv 17.x | Environment configuration |
| Module System | ESM | `"type": "module"` in package.json |

## Project Structure

```
backend/
├── index.js                    Composition root — mounts everything, starts server
├── package.json                Dependencies & scripts (ESM)
├── .env                        Environment variables (gitignored)
├── config/
│   ├── env.js                  Typed env config with boot-time validation
│   └── db.js                   MongoDB connection via Mongoose
├── models/                     Mongoose schemas + indexes + methods
│   ├── User.js                 Auth, roles, profile, password hashing
│   ├── Restaurant.js           Owner, menu refs, ratings
│   ├── Menu.js                 Items, pricing, categories
│   ├── Order.js                Items, status tracking, payment
│   └── Review.js               Ratings, unique per user+restaurant
├── routes/                     Express routers — thin HTTP layer
│   ├── userRoutes.js           Auth & profile endpoints
│   ├── restaurantRoutes.js     Restaurant CRUD & menu
│   └── orderRoutes.js          Order lifecycle
├── services/                   Business logic (no req/res)
│   └── index.js                authService, restaurantService, orderService
├── middleware/                  Express middleware
│   ├── authMiddleware.js        protect + requireRole(...)
│   ├── errorHandler.js          Global error handler
│   └── rateLimiter.js           Global + per-route rate limiters
├── validations/
│   └── schemas.js              Zod schemas for all inputs
└── utils/
    ├── errors.js                AppError, ValidationError, etc.
    └── logger.js                Pino logger + request middleware
```

## Database Schemas

### User

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `username` | String | unique, required, trimmed | Display name |
| `email` | String | unique, required, lowercase | Login identifier |
| `password` | String | required, minlength 6, `select: false` | Hashed by pre-save hook |
| `role` | String enum | `customer`, `restaurant`, `delivery`, `admin` | Default: `customer` |
| `phone` | String | optional | Contact number |
| `address` | Object | `{ street, city, state, zip, coordinates }` | coordinates: 2dsphere |
| `isActive` | Boolean | default: true | Account toggle |

**Methods:** `generateAuthToken()` → JWT with `{ _id, role }` + expiration
**Statics:** `findByCredentials(email, password)` → bcrypt compare
**Pre-save hook:** Hashes password with bcrypt (cost from `BCRYPT_SALT_ROUNDS`)
**Indexes:** `{ email: 1 }` unique, `{ username: 1 }` unique, `coordinates` 2dsphere

### Restaurant

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `name` | String | required, trimmed | Restaurant name |
| `description` | String | optional | |
| `cuisine` | [String] | default: [] | e.g., `["Italian", "Chinese"]` |
| `phone` | String | optional | |
| `address` | Object | `{ street, city, state, zip }` | |
| `rating` | Number | 0–5, default: 0 | |
| `isOpen` | Boolean | default: true | Operating status |
| `menu` | [ObjectId → Menu] | | Array of menu item refs |
| `owner` | ObjectId → User | required | Restaurant creator |

**Indexes:** `{ isOpen: 1 }`, `{ cuisine: 1 }`, `{ owner: 1 }`

### Menu

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `restaurantId` | ObjectId → Restaurant | required | Parent restaurant |
| `name` | String | required | Item name |
| `description` | String | optional | |
| `price` | Number | required, min: 0 | |
| `category` | String enum | `appetizer`, `main`, `drink`, `dessert` | |
| `isAvailable` | Boolean | default: true | |
| `imageUrl` | String | optional | |
| `prepTime` | Number | default: 20 | Minutes |

**Indexes:** `{ restaurantId: 1, isAvailable: 1 }`

### Order

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `userId` | ObjectId → User | required | Customer |
| `restaurantId` | ObjectId → Restaurant | required | |
| `items` | Array | `[{ menuId, quantity, priceAtPurchase }]` | Snapshot of price at purchase |
| `totalAmount` | Number | required | Calculated by service |
| `status` | String enum | `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled` | Default: `pending` |
| `paymentMethod` | String enum | `card`, `cash`, `wallet` | Default: `card` |
| `deliveryAddress` | String | optional | |
| `estimatedDelivery` | Date | optional | |
| `actualDelivery` | Date | optional | |

**Indexes:** `{ userId: 1, createdAt: -1 }`, `{ restaurantId: 1, status: 1 }`, `{ status: 1 }`

### Review

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `userId` | ObjectId → User | required | Reviewer |
| `restaurantId` | ObjectId → Restaurant | required | |
| `rating` | Number | required, 1–5 | |
| `comment` | String | optional, trimmed | |

**Indexes:** `{ userId: 1, restaurantId: 1 }` unique (prevents duplicate reviews)

### Entity Relationships

```
User ──< Restaurant       (owner)
User ──< Order            (userId)
User ──< Review           (userId)
Restaurant ──< Menu       (menu[] + restaurantId back-ref)
Restaurant ──< Order      (restaurantId)
Restaurant ──< Review     (restaurantId)
Menu ──< Order.items      (menuId)
```

## API Endpoints

### Users

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/users/register` | Public | 5/15min | Register new user (always customer role) |
| POST | `/api/users/login` | Public | 5/15min | Login, returns JWT |
| GET | `/api/users/profile` | Protected | — | Get current user profile |
| PUT | `/api/users/profile` | Protected | — | Update username, phone, address |

### Restaurants

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/restaurants` | Public | List all open restaurants |
| GET | `/api/restaurants/:id` | Public | Get restaurant with populated menu |
| POST | `/api/restaurants` | Protected (restaurant role) | Create restaurant |
| PUT | `/api/restaurants/:id` | Protected (owner or admin) | Update restaurant |
| GET | `/api/restaurants/:id/menu` | Public | Get available menu items |

### Orders

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/orders/user/me` | Protected | — | Get current user's orders (paginated) |
| POST | `/api/orders` | Protected | 10/min | Create order (validates items + calculates total) |
| PUT | `/api/orders/:id/status` | Protected (admin) | — | Update order status |
| GET | `/api/orders/:id` | Protected (owner or admin) | — | Get order details |

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check with timestamp |

**Response format:** `{ success: true, data: ... }` or `{ success: false, message: "..." }`

## Middleware

### `protect` (middleware/authMiddleware.js)

1. Extracts Bearer token from `Authorization` header
2. Verifies JWT using `JWT_SECRET`
3. Loads user from DB (without password)
4. Attaches `req.user`
5. Returns 401 for: missing token, invalid token, expired token, user not found

### `requireRole(...roles)` (middleware/authMiddleware.js)

- Composable role guard: `requireRole("admin")`, `requireRole("restaurant", "admin")`
- Checks `req.user.role` against allowed roles
- Returns 403 if not authorized

### `globalErrorHandler` (middleware/errorHandler.js)

- Handles custom `AppError` classes (ValidationError, AuthenticationError, AuthorizationError, NotFoundError)
- Handles Mongoose `ValidationError` (code 1222) and duplicate key errors (code 11000)
- Handles invalid ObjectId (`CastError`)
- Hides stack traces in production
- Logs with request ID correlation via Pino

### Rate Limiters (middleware/rateLimiter.js)

| Limiter | Limit | Window | Applied To |
|---------|-------|--------|------------|
| `limiter` | 100 requests | 15 min | Global (all routes) |
| `authLimiter` | 5 requests | 15 min | `/register`, `/login` |
| `orderLimiter` | 10 requests | 1 min | `POST /orders` |

### `loggerMiddleware` (utils/logger.js)

- Generates or accepts `X-Request-Id` header
- Attaches `req.requestId` and `req.logger` (Pino child logger)
- Logs incoming request and completion with duration

## Validation (Zod)

All input validation uses Zod schemas in `validations/schemas.js`:

| Schema | Used By | Validates |
|--------|---------|-----------|
| `registerUserSchema` | authService.register | username (3–50), email, password (6–128). No `role` field — prevents privilege escalation |
| `loginUserSchema` | authService.login | email, password |
| `updateProfileSchema` | authService.updateProfile | username, phone (≤20), address object |
| `createRestaurantSchema` | restaurantService.create | name, description, cuisine, phone, address |
| `updateRestaurantSchema` | restaurantService.update | Partial of createRestaurantSchema |
| `createOrderSchema` | orderService.createOrder | restaurantId (ObjectId), items array (menuId + quantity 1–99) |
| `updateOrderStatusSchema` | orderService.updateStatus | status enum |
| `createReviewSchema` | (not yet wired) | restaurantId, rating (1–5), comment |

## Error Handling

### Custom Error Classes (utils/errors.js)

| Class | Status Code | Usage |
|-------|-------------|-------|
| `AppError` |任意 | Base class |
| `ValidationError` | 400 | Invalid input, business rule violations |
| `AuthenticationError` | 401 | Auth failures |
| `AuthorizationError` | 403 | Permission denied |
| `NotFoundError` | 404 | Resource not found |

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description",
  "stack": "..." // Only in non-production
}
```

### Mongoose Error Mapping

| Error | Status | Message |
|-------|--------|---------|
| `ValidationError` | 400 | Comma-separated field errors |
| Code `11000` (duplicate) | 409 | `Duplicate value for field: <field>` |
| `CastError` (bad ObjectId) | 400 | `Invalid ID format` |

## Security

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt with configurable salt rounds (default 12) |
| JWT | Short-lived access token (configurable, default 1d), payload: `{ _id, role }` |
| Role-based access | `requireRole()` middleware — service-level authorization |
| Security headers | Helmet (CSP, HSTS, X-Content-Type-Options, etc.) |
| CORS | Configurable origin via `CORS_ORIGIN` env |
| Rate limiting | Global + per-route with express-rate-limit |
| Body size limit | 10kb max via `express.json()` |
| Input validation | Zod at every service boundary |
| Password isolation | `select: false` on schema, never in responses |
| Privilege escalation | Registration always defaults to `customer` role |
| Stack traces | Hidden in production mode |
| Request correlation | X-Request-Id header on every request |

## Environment Variables

```env
# Required (validated at boot — server won't start without them)
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=your_256_bit_secret_key_here

# Optional (with defaults)
PORT=3000
NODE_ENV=development
JWT_EXPIRE=1d
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

## Deployment

### Development

```bash
# Start MongoDB (Docker)
docker run -d --name food-delivery-mongo -p 27017:27017 mongo:7

# Install & run
cd backend
npm install
npm run dev    # nodemon with auto-restart
```

### Production

```bash
NODE_ENV=production npm start

# Or with Docker Compose
docker compose up -d
```

### Docker Compose

```yaml
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/food-delivery
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=https://yourdomain.com
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo_data:
```

### GitHub Actions CI

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports: ["27017:27017"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
```
