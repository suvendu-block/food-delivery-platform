/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  setupFiles: ["./tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
