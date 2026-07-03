import { permanentRedirect } from 'next/navigation';

// Legacy/public synonym. The product page is canonicalized as Spot the Fib at
// /classroom-activities/two-truths to avoid duplicate SEO content.
export default function TwoTruthsAndALieAliasPage() {
  permanentRedirect('/classroom-activities/two-truths');
}
