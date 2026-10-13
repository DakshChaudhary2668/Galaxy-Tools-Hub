import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createEnquiry } from '../controllers/enquiry.controller';

export const enquiryRouter: Router = Router();

enquiryRouter.post(
  '/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many enquiries. Please try again later.' }
  }),
  createEnquiry
);
