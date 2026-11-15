import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'openron-jwt-dev-secret-key-change-in-prod-32chars',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
