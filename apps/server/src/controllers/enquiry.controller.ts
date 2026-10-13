import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/response';

export const EnquirySchema = z.object({
  type: z.enum(['contact', 'dealer']),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional(),
  company: z.string().trim().min(2).max(150),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(5000),
  website: z.string().max(200).optional()
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] as string);
}

export async function createEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.RESEND_API_KEY) throw new AppError('Enquiry service is temporarily unavailable', 503);

    const enquiry = EnquirySchema.parse(req.body);
    if (enquiry.website) {
      sendSuccess(res, { data: { accepted: true }, statusCode: 202 });
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Galaxy Tools Hub <no-reply@auth.galaxytoolshub.com>',
        to: [env.ENQUIRY_RECIPIENT_EMAIL],
        reply_to: enquiry.email,
        subject: `[${enquiry.type === 'dealer' ? 'Dealer application' : 'Website enquiry'}] ${enquiry.subject}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p><p><strong>Company:</strong> ${escapeHtml(enquiry.company)}</p><p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p><p><strong>Phone:</strong> ${escapeHtml(enquiry.phone || 'Not provided')}</p><p><strong>Message:</strong></p><p>${escapeHtml(enquiry.message).replace(/\n/g, '<br>')}</p>`
      })
    });

    if (!response.ok) throw new AppError('Your enquiry could not be sent. Please contact us directly.', 502);

    sendSuccess(res, {
      data: { accepted: true },
      message: 'Your enquiry has been sent successfully.',
      statusCode: 202
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Please check the enquiry details and try again.', 400, error.flatten().fieldErrors as Record<string, string[]>));
    }
    next(error);
  }
}
