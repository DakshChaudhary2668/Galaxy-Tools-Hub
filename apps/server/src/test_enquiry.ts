import assert from 'node:assert/strict';
import { EnquirySchema } from './controllers/enquiry.controller';

const valid = EnquirySchema.safeParse({
  type: 'contact',
  name: 'Test Customer',
  company: 'Test Company',
  email: 'customer@example.com',
  phone: '+91 90000 00000',
  subject: 'Product enquiry',
  message: 'Please share product availability.',
  website: ''
});

assert.equal(valid.success, true);
assert.equal(EnquirySchema.safeParse({ ...valid.data, email: 'invalid' }).success, false);
assert.equal(EnquirySchema.safeParse({ ...valid.data, website: 'bot-filled' }).success, true);

console.log('Enquiry validation checks passed');
