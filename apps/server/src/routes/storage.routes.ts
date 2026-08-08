import { Router } from 'express';
import { getSignedUploadUrl } from '../controllers/storage.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { SignedUrlRequestSchema } from '@galaxy/types';

export const storageRouter: Router = Router();

storageRouter.post('/signed-url', validateRequest(SignedUrlRequestSchema), getSignedUploadUrl);
