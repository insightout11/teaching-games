import { notFound } from 'next/navigation';
import { RadioCheckDevClient } from './client';

// Dev-only preview of Radio Check with sample content. 404s outside development.
export const dynamic = 'force-dynamic';

export default function RadioCheckDevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <RadioCheckDevClient />;
}
