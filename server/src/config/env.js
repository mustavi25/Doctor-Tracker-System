require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().default('admin@doctortracker.com'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.issues.forEach((i) => console.error(` - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

module.exports = parsed.data;
