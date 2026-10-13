import type { Metadata } from 'next';
import { PolicyReviewPage } from '@/components/PolicyReviewPage/PolicyReviewPage';

export const metadata: Metadata = { title: 'Terms & Conditions — Galaxy Tools Hub', robots: { index: false, follow: false } };

export default function TermsPage() {
  return <PolicyReviewPage title="Terms & Conditions" summary="Commercial terms governing website orders." decisions={['Verified seller legal identity and GSTIN', 'Order acceptance and liability terms', 'Warranty and dispute-resolution terms']} />;
}
