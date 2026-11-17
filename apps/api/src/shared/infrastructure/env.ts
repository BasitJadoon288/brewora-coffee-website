import 'dotenv/config';
import { z } from 'zod';
const opt = z.string().optional().transform(v => (v ? v : undefined));
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  CUSTOMER_URL: z.string().url(),
  ADMIN_URL: z.string().url().optional(), // admin lives inside the same Next.js app; only set if hosted separately
  ADMIN_EMAIL: opt, ADMIN_PASSWORD: opt, ADMIN_NAME: opt, SEED_DEMO_PASSWORD: opt,
  SMTP_HOST: opt, SMTP_PORT: z.coerce.number().default(587), SMTP_USER: opt, SMTP_PASS: opt, MAIL_FROM: opt,
  CLOUDINARY_CLOUD_NAME: opt, CLOUDINARY_API_KEY: opt, CLOUDINARY_API_SECRET: opt,
  JAZZCASH_MERCHANT_ID: opt, JAZZCASH_PASSWORD: opt, JAZZCASH_INTEGRITY_SALT: opt,
  JAZZCASH_BASE_URL: z.string().default('https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'),
  UPLOAD_DIR: opt,
  EASYPAISA_STORE_ID: opt, EASYPAISA_HASH_KEY: opt,
  EASYPAISA_BASE_URL: z.string().default('https://easypaystg.easypaisa.com.pk/easypay/Index.jsf'),
});
export type Env = z.infer<typeof schema>;
export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => schema.parse(source);
