import type { Metadata } from 'next';
import { PolicyReviewPage } from '@/components/PolicyReviewPage/PolicyReviewPage';

export const metadata: Metadata = { title: 'Privacy Policy — Galaxy Tools Hub', robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <PolicyReviewPage title="Privacy Policy" summary="How customer and enquiry information is handled." decisions={['Data retention period', 'Third-party processor disclosures', 'Customer data-access and deletion procedure']} />;
}
