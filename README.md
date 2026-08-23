# FreshBite — Food Delivery Platform

A full-stack food delivery application built with Next.js, Express.js, MongoDB, and TypeScript.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React |
| **Backend** | Express.js 5, Mongoose 9, JWT Auth, Zod Validation, Helmet, Rate Limiting |
| **Database** | MongoDB 7 (Docker) |
| **Testing** | Jest, Supertest, MongoDB Memory Server |

## Prerequisites

- Node.js 18+
- Docker (for MongoDB)

## Getting Started

### 1. Start MongoDB

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Or create .env with required variables
npm run dev
```

Backend runs on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`

## Project Structure

```
food-delivery-platform/
├── backend/
│   ├── routes/          # API route definitions
│   │   ├── userRoutes.js
│   │   ├── restaurantRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── menuRoutes.js
│   │   └── reviewRoutes.js
│   ├── services/        # Business logic
│   ├── validations/     # Zod schemas
│   ├── models/          # Mongoose models
│   ├── middleware/       # Auth, error handling
│   └── index.js         # Server entry point
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       │   ├── page.tsx         # Homepage
│       │   ├── restaurants/     # Restaurant listing & detail
│       │   ├── cart/            # Cart page
│       │   ├── checkout/        # Checkout page
│       │   ├── orders/          # Order history
│       │   ├── login/           # Login page
│       │   └── register/        # Register page
│       ├── components/
│       │   ├── ui/              # Button, Input, Badge, Rating, Skeleton
│       │   ├── layout/          # Header, Footer, Providers
│       │   ├── sections/        # Hero, FeaturedRestaurants, Categories
│       │   ├── restaurant/      # RestaurantCard, MenuItemCard, etc.
│       │   └── cart/            # CartContent, CheckoutContent, etc.
│       └── lib/
│           ├── api.ts           # API client & TypeScript types
│           ├── auth-context.tsx  # Auth context provider
│           ├── cart-context.tsx  # Cart context provider
│           └── utils.ts         # Utility functions
```

## API Endpoints

### Auth & Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Register new user | No |
| POST | `/api/users/login` | Login user | No |
| GET | `/api/users/profile` | Get current user profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |

### Restaurants
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/restaurants` | List all restaurants | No |
| GET | `/api/restaurants/:id` | Get restaurant details | No |
| GET | `/api/restaurants/:id/menu` | Get restaurant menu | No |
| POST | `/api/restaurants` | Create restaurant | Admin |
| PUT | `/api/restaurants/:id` | Update restaurant | Admin |
| DELETE | `/api/restaurants/:id` | Delete restaurant | Admin |

### Menu Items
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/menus` | Create menu item | Restaurant |
| PUT | `/api/menus/:id` | Update menu item | Restaurant |
| DELETE | `/api/menus/:id` | Delete menu item | Restaurant |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders/user/me` | Get user orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| PUT | `/api/orders/:id/status` | Update order status | Admin |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Create review | Yes |
| GET | `/api/reviews/restaurant/:id` | Get restaurant reviews | No |
| GET | `/api/reviews/:id` | Get review details | No |
| PUT | `/api/reviews/:id` | Update review | Yes |
| DELETE | `/api/reviews/:id` | Delete review | Yes |

## Features

- **Authentication** — JWT-based auth with role-based access (customer, restaurant, delivery, admin)
- **Restaurants** — Browse, search, and filter by cuisine
- **Menu** — View menu items with categories, prices, and availability
- **Cart** — Multi-restaurant cart with conflict detection
- **Orders** — Order tracking and history
- **Reviews** — Rating and review system per restaurant
- **Responsive Design** — Mobile-first with glass morphism UI

## Testing

### Backend Tests

```bash
cd backend
npm test                # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
```

### QA Test Script

```bash
# Run comprehensive API tests (requires backend running)
./qa-test.sh
```

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/food-delivery` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `JWT_EXPIRE` | JWT token expiration | `30d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `10` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |

## Known Issues

- **Mongoose Deprecation**: `findOneAndUpdate()` uses deprecated `new` option. Should use `returnDocument: 'after'` instead.
- **Rate Limiting**: Auth endpoints limited to 5 requests per 15 minutes.

## License

ISC
