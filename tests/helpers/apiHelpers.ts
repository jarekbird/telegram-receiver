/**
 * API test helper functions
 */

import request, { SuperTest, Test } from 'supertest';
import { Express } from 'express';

/**
 * Creates a test request instance
 */
export const createTestRequest = (app: Express): SuperTest<Test> => {
  return request(app);
};

/**
 * Common HTTP status codes for reference
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Common headers for API requests
 */
export const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const createJsonHeaders = () => ({
  'Content-Type': 'application/json',
});
