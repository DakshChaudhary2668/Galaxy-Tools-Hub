import type { Metadata } from 'next';
import { PolicyReviewPage } from '@/components/PolicyReviewPage/PolicyReviewPage';

export const metadata: Metadata = { title: 'Cancellation Policy — Galaxy Tools Hub', robots: { index: false, follow: false } };

export default function CancellationPage() {
  return <PolicyReviewPage title="Cancellation Policy" summary="Order cancellation terms are awaiting final owner approval." decisions={['Cancellation eligibility and cutoff point', 'Payment reversal timeline', 'Non-cancellable special-order items']} />;
}
