import { z } from 'zod';

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3000')
});

export const WebEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/admin/sign-in'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/admin/dashboard'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5000/api/v1')
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type WebEnv = z.infer<typeof WebEnvSchema>;

export function validateEnv<T>(schema: z.ZodType<T, any, any>, env: Record<string, unknown>): T {
  const result = schema.safeParse(env);
  if (!result.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }
  return result.data;
}
