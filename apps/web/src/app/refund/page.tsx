import type { Metadata } from 'next';
import { PolicyReviewPage } from '@/components/PolicyReviewPage/PolicyReviewPage';

export const metadata: Metadata = { title: 'Returns & Refunds — Galaxy Tools Hub', robots: { index: false, follow: false } };

export default function RefundPolicyPage() {
  return <PolicyReviewPage title="Returns & Refunds Policy" summary="Return, replacement and refund terms are awaiting final owner approval." decisions={['Return eligibility and request window', 'Inspection and replacement process', 'Refund method and processing timeline', 'Manufacturer-warranty handling']} />;
}
