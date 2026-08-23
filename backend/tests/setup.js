// Set test environment variables BEFORE any modules are imported
// This must run before env.js validation triggers process.exit()
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Random available port
process.env.MONGODB_URI = "mongodb://localhost:27017/food-delivery-test";
process.env.JWT_SECRET = "test-jwt-secret-do-not-use-in-production";
process.env.JWT_EXPIRE = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4"; // Fast hashing for tests
process.env.CORS_ORIGIN = "http://localhost:3000";
