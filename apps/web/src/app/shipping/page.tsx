import type { Metadata } from 'next';
import { PolicyReviewPage } from '@/components/PolicyReviewPage/PolicyReviewPage';

export const metadata: Metadata = { title: 'Shipping & Delivery Policy — Galaxy Tools Hub', robots: { index: false, follow: false } };

export default function ShippingPage() {
  return <PolicyReviewPage title="Shipping & Delivery Policy" summary="Delivery charges are calculated from total cart weight at checkout." decisions={['Dispatch and delivery timelines', 'Supported delivery locations and carriers', 'Transit-risk and failed-delivery process']} />;
}
