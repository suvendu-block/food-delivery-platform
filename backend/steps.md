# Food Delivery Platform — Backend Implementation Steps

## Overview

Step-by-step guide for building the backend from scratch. Each phase builds on the previous one, with verification checkpoints to ensure everything works before moving forward.

---

## Phase 1: Project Bootstrap

### Step 1.1 — Initialize project

```bash
mkdir backend && cd backend
npm init -y
# Edit package.json: add "type": "module", fix scripts
```

### Step 1.2 — Install dependencies

```bash
# Core
npm install express mongoose dotenv cors bcrypt jsonwebtoken zod pino uuid

# Security
npm install helmet compression express-rate-limit express-mongo-sanitize

# Dev
npm install --save-dev nodemon
```

### Step 1.3 — Create directory structure

```
backend/
├── config/
├── models/
├── routes/
├── services/
├── middleware/
├── validations/
└── utils/
```

### Step 1.4 — Create `.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=your_256_bit_secret_here
JWT_EXPIRE=1d
BCRYPT_SALT_ROUNDS=12
```

### Step 1.5 — Create `.gitignore`

```
node_modules/
.env
.env.*
dist/
logs/
*.log
```

**Checkpoint:** `npm run dev` should start (will fail on DB connect — that's expected).

---

## Phase 2: Configuration Layer

### Step 2.1 — `config/env.js` — Typed env config

- Load dotenv
- Validate required vars (`MONGODB_URI`, `JWT_SECRET`) — `process.exit(1)` if missing
- Export typed `env` object: `port`, `nodeEnv`, `mongodbUri`, `jwtSecret`, `jwtExpire`, `bcryptSaltRounds`
- Export `corsOptions`: configurable origin, methods, headers, credentials

### Step 2.2 — `config/db.js` — MongoDB connection

- Import `env` from `./env.js` (not raw `process.env`)
- `connectDB()`: `mongoose.connect(env.mongodbUri)` with error handling
- Log connection/disconnection events via Pino

**Checkpoint:** Server starts and logs "MongoDB connected" when Mongo is running.

---

## Phase 3: Utilities

### Step 3.1 — `utils/errors.js` — Custom error classes

```
AppError(message, statusCode)       — base class
ValidationError(message)            — 400
AuthenticationError(message)        — 401
AuthorizationError(message)         — 403
NotFoundError(message)              — 404
```

### Step 3.2 — `utils/logger.js` — Pino logger

- `baseLogger`: app-level Pino instance
- `createLogger(requestId)`: child logger with correlation ID
- `loggerMiddleware`: attaches `req.requestId` + `req.logger`, logs request/response with duration

**Checkpoint:** Import and use `createLogger` — no crashes.

---

## Phase 4: Models

### Step 4.1 — `models/User.js`

- Schema: `username`, `email`, `password` (`select: false`), `role` (enum), `phone`, `address` (nested with `coordinates` 2dsphere), `isActive`
- `{ timestamps: true }` — do NOT add manual `createdAt`/`updatedAt` fields
- **Pre-save hook:** Hash password with bcrypt if modified (Mongoose 9 async — no `next` param)
- `generateAuthToken()`: `jwt.sign({ _id, role }, env.jwtSecret, { expiresIn: env.jwtExpire })`
- `findByCredentials(email, password)`: `findOne({ email }).select("+password")` + bcrypt compare
- Indexes: `{ email: 1 }` unique, `{ username: 1 }` unique, `coordinates` 2dsphere

### Step 4.2 — `models/Restaurant.js`

- Schema: `name`, `description`, `cuisine` ([String]), `phone`, `address`, `rating` (0–5), `isOpen`, `menu` ([ObjectId → Menu]), `owner` (ObjectId → User, required)
- Indexes: `{ isOpen: 1 }`, `{ cuisine: 1 }`, `{ owner: 1 }`

### Step 4.3 — `models/Menu.js`

- Schema: `restaurantId` (ref), `name`, `description`, `price` (min 0), `category` (enum), `isAvailable`, `imageUrl`, `prepTime` (default 20)
- Index: `{ restaurantId: 1, isAvailable: 1 }`

### Step 4.4 — `models/Order.js`

- Schema: `userId` (ref), `restaurantId` (ref), `items` ([{ menuId, quantity, priceAtPurchase }]), `totalAmount`, `status` (enum), `paymentMethod` (enum), `deliveryAddress`, `estimatedDelivery`, `actualDelivery`
- Indexes: `{ userId: 1, createdAt: -1 }`, `{ restaurantId: 1, status: 1 }`, `{ status: 1 }`

### Step 4.5 — `models/Review.js`

- Schema: `userId` (ref), `restaurantId` (ref), `rating` (1–5), `comment`
- Unique compound index: `{ userId: 1, restaurantId: 1 }`

**Checkpoint:** `node -e "import('./models/User.js')"` — no import errors.

---

## Phase 5: Validation

### Step 5.1 — `validations/schemas.js`

All Zod schemas for every API boundary:

- `registerUserSchema`: username (3–50), email, password (6–128). **No `role` field** — prevents privilege escalation.
- `loginUserSchema`: email, password
- `updateProfileSchema`: username (optional), phone (≤20, optional), address (optional object)
- `createRestaurantSchema`: name (3–100), description, cuisine, phone, address (required object)
- `updateRestaurantSchema`: partial of create
- `createOrderSchema`: restaurantId (ObjectId), items array with menuId (ObjectId) + quantity (1–99)
- `updateOrderStatusSchema`: status enum
- `createReviewSchema`: restaurantId (ObjectId), rating (1–5), comment

**Checkpoint:** `node -e "import('./validations/schemas.js')"` — no import errors.

---

## Phase 6: Middleware

### Step 6.1 — `middleware/authMiddleware.js`

- `protect`: Extract Bearer token → verify JWT → load user → attach `req.user`. Returns 401 for: missing token, invalid token, expired token, user not found. Every branch has explicit `return`.
- `requireRole(...roles)`: Composable guard. Checks `req.user.role` against allowed roles. Returns 403 if not authorized.

### Step 6.2 — `middleware/errorHandler.js`

- `globalErrorHandler(err, req, res, next)`: 4-arg Express error handler
- Maps custom `AppError` classes → status codes
- Maps Mongoose `ValidationError` → 400, duplicate key (11000) → 409, CastError → 400
- Hides stack traces when `NODE_ENV=production`
- Logs via Pino with request ID correlation

### Step 6.3 — `middleware/rateLimiter.js`

- `limiter`: 100 requests / 15 min (global)
- `authLimiter`: 5 requests / 15 min (register + login)
- `orderLimiter`: 10 requests / 1 min (order creation)

**Checkpoint:** Import middleware — no crashes.

---

## Phase 7: Services

### Step 7.1 — `services/index.js`

Business logic layer. Imports all models, error classes, and validation schemas.

**authService:**
- `register(payload)`: Zod validate → check uniqueness → create user → return `{ user, token }`
- `login(payload)`: Zod validate → `findByCredentials` → check `isActive` → return `{ user, token }`
- `getProfile(userId)`: Find by ID, exclude password
- `updateProfile(userId, payload)`: Zod validate → `findByIdAndUpdate` with `runValidators`

**restaurantService:**
- `getAllOpen()`: `find({ isOpen: true })` lean
- `getById(id)`: `findById` + populate menu, lean
- `create(payload, ownerId)`: Zod validate → create with owner
- `update(id, payload, userId, userRole)`: Zod validate → **ownership check** (owner or admin) → update
- `getMenu(restaurantId)`: Verify restaurant exists → `find({ restaurantId, isAvailable: true })`

**orderService:**
- `createOrder(userId, payload)`: Zod validate → verify restaurant open → validate each menu item → calculate total → save → populate
- `getOrderById(id, userId, userRole)`: Find + **authorization check** (owner or admin)
- `getUserOrders(userId, page, limit)`: Paginated query with total count
- `updateStatus(id, status, userRole)`: Zod validate → admin only → update

**Checkpoint:** `node -e "import('./services/index.js')"` — no import errors.

---

## Phase 8: Routes

### Step 8.1 — `routes/userRoutes.js`

```
POST   /api/users/register   → authLimiter → authService.register
POST   /api/users/login      → authLimiter → authService.login
GET    /api/users/profile     → protect → authService.getProfile
PUT    /api/users/profile     → protect → authService.updateProfile
```

Every handler: `async (req, res, next) => { try { ... } catch (e) { next(e) } }`

### Step 8.2 — `routes/restaurantRoutes.js`

```
GET    /api/restaurants              → restaurantService.getAllOpen
GET    /api/restaurants/:id          → restaurantService.getById
POST   /api/restaurants              → protect + requireRole("restaurant") → create
PUT    /api/restaurants/:id          → protect + requireRole("restaurant","admin") → update
GET    /api/restaurants/:id/menu     → restaurantService.getMenu
```

### Step 8.3 — `routes/orderRoutes.js`

```
GET    /api/orders/user/me           → protect → getUserOrders  ← MUST be before /:id
POST   /api/orders                   → protect + orderLimiter → createOrder
PUT    /api/orders/:id/status        → protect + requireRole("admin") → updateStatus
GET    /api/orders/:id               → protect → getOrderById
```

**Route ordering matters:** `/user/me` must be defined before `/:id` to avoid Express matching "user" as an ID param.

**Checkpoint:** All routes import correctly — `node -e "import('./routes/userRoutes.js')"`.

---

## Phase 9: Composition Root

### Step 9.1 — `index.js`

```javascript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { env, corsOptions } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { loggerMiddleware } from "./utils/logger.js";
import { limiter } from "./middleware/rateLimiter.js";
import globalErrorHandler from "./middleware/errorHandler.js";
import userRouter from "./routes/userRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import orderRouter from "./routes/orderRoutes.js";

const app = express();

// Security
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);

// Parsing
app.use(express.json({ limit: "10kb" }));
app.use(compression());

// Logging
app.use(loggerMiddleware);

// Routes
app.use("/api/users", userRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/orders", orderRouter);

// System
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error handling (must be last)
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(globalErrorHandler);

// Boot
const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => console.log(`Server running on port ${env.port} [${env.nodeEnv}]`));
};

startServer();
export default app;
```

**Checkpoint:** `node index.js` — server starts, health check returns `{"status":"ok"}`.

---

## Phase 10: Verification

### Step 10.1 — Start MongoDB

```bash
docker run -d --name food-delivery-mongo -p 27017:27017 mongo:7
```

### Step 10.2 — Start server

```bash
cd backend && npm run dev
```

### Step 10.3 — Test all endpoints

```bash
# Register
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'

# Profile (use token from login)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users/profile

# Restaurants
curl http://localhost:3000/api/restaurants

# Health
curl http://localhost:3000/health

# Validation error
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"x","email":"bad","password":"12"}'
# → 400 with Zod error message

# Unauthorized
curl http://localhost:3000/api/users/profile
# → 401 "Not authorized, no token provided"
```

### Step 10.4 — Verify security features

```bash
# Helmet headers present
curl -I http://localhost:3000/health
# → X-Content-Type-Options, X-Frame-Options, etc.

# Rate limiting headers
curl -I http://localhost:3000/api/users/login
# → RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
```

---

## Phase 11: Production Deployment

### Step 11.1 — Dockerfile (multi-stage)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "index.js"]
```

### Step 11.2 — Production env

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/food-delivery
JWT_SECRET=<strong_random_64_chars>
JWT_EXPIRE=1d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
```

### Step 11.3 — Production checklist

- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (32+ random chars)
- [ ] Production MongoDB with auth enabled
- [ ] CORS restricted to frontend origin
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] No `.env` in version control
- [ ] Health check endpoint working
- [ ] Logs to stdout (not files) for container orchestration
- [ ] Graceful shutdown handler

---

## Phase 12: Future Enhancements

| Priority | Feature | Notes |
|----------|---------|-------|
| High | Review routes | Wire up `createReviewSchema`, add review endpoints |
| High | Jest + Supertest tests | Unit tests for services, integration tests for routes |
| High | Docker Compose | API + MongoDB with healthchecks |
| Medium | Payment integration | Stripe/PayPal for order payment |
| Medium | Real-time tracking | WebSocket for order status updates |
| Medium | File uploads | Menu item images (Cloudinary/S3) |
| Medium | Email notifications | Order confirmations (Resend/SendGrid) |
| Low | Admin dashboard | Analytics, user management |
| Low | Search & filtering | Full-text search, cuisine/price filters |
| Low | API versioning | `/api/v1/...` with sunset headers |
| Low | Redis caching | Hot reads, rate limit store |
| Low | Refresh tokens | Token rotation for long-lived sessions |

---

## Quick Reference

```bash
# Development
npm run dev              # nodemon auto-restart

# Production
npm start                # node index.js

# Docker
docker compose up -d     # Start API + MongoDB
docker compose down      # Stop everything
```
