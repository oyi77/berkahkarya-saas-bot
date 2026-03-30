/**
 * Environment Variable Validation
 * Validates required env vars at startup — fails fast with clear errors.
 */

const REQUIRED_ENV_VARS = [
  'BOT_TOKEN',
  'DATABASE_URL',
  'REDIS_URL',
  'ADMIN_PASSWORD',
  'DUITKU_MERCHANT_CODE',
  'DUITKU_API_KEY',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file.`
    );
  }
}
