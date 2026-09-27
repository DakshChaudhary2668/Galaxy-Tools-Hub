import { z } from 'zod';

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional()
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;
  const origin = new URL(value.CORS_ORIGIN);
  if (origin.protocol !== 'https:' || origin.origin !== value.CORS_ORIGIN || origin.hostname === 'localhost' || origin.hostname === '127.0.0.1') {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'CORS_ORIGIN must be the exact HTTPS production storefront origin' });
  }
  for (const key of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'] as const) {
    if (!value[key]) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required in production` });
    }
  }
});

export const WebEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url()
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
