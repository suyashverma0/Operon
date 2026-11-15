import { ENV } from './env';

export const secrets = {
  geminiApiKey: ENV.GEMINI_API_KEY,
  jwtSecret: ENV.JWT_SECRET,
};
