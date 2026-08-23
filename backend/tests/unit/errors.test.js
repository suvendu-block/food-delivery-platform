import { describe, it, expect } from "@jest/globals";

// ─── Error Classes ──────────────────────────────────────────────────

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create error with default 500 status", async () => {
      const { AppError } = await import("../../utils/errors.js");
      const err = new AppError("Something broke");
      expect(err.message).toBe("Something broke");
      expect(err.statusCode).toBe(500);
      expect(err.status).toBe("error");
      expect(err).toBeInstanceOf(Error);
    });

    it("should set status to 'fail' for 4xx codes", async () => {
      const { AppError } = await import("../../utils/errors.js");
      const err = new AppError("Bad request", 400);
      expect(err.statusCode).toBe(400);
      expect(err.status).toBe("fail");
    });
  });

  describe("ValidationError", () => {
    it("should create error with 400 status", async () => {
      const { ValidationError } = await import("../../utils/errors.js");
      const err = new ValidationError("Invalid input");
      expect(err.message).toBe("Invalid input");
      expect(err.statusCode).toBe(400);
      expect(err.status).toBe("fail");
    });
  });

  describe("AuthenticationError", () => {
    it("should create error with 401 status and default message", async () => {
      const { AuthenticationError } = await import("../../utils/errors.js");
      const err = new AuthenticationError();
      expect(err.message).toBe("Authentication failed");
      expect(err.statusCode).toBe(401);
    });

    it("should accept custom message", async () => {
      const { AuthenticationError } = await import("../../utils/errors.js");
      const err = new AuthenticationError("Wrong password");
      expect(err.message).toBe("Wrong password");
    });
  });

  describe("AuthorizationError", () => {
    it("should create error with 403 status and default message", async () => {
      const { AuthorizationError } = await import("../../utils/errors.js");
      const err = new AuthorizationError();
      expect(err.message).toBe("Not authorized");
      expect(err.statusCode).toBe(403);
    });
  });

  describe("NotFoundError", () => {
    it("should create error with 404 status and default message", async () => {
      const { NotFoundError } = await import("../../utils/errors.js");
      const err = new NotFoundError();
      expect(err.message).toBe("Resource not found");
      expect(err.statusCode).toBe(404);
    });

    it("should accept custom message", async () => {
      const { NotFoundError } = await import("../../utils/errors.js");
      const err = new NotFoundError("User not found");
      expect(err.message).toBe("User not found");
    });
  });
});
