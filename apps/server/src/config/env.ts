import dotenv from 'dotenv';
import { ServerEnvSchema, validateEnv } from '@galaxy/config';

dotenv.config();

export const env = validateEnv(ServerEnvSchema, process.env);
