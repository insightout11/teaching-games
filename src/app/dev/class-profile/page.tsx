import { notFound } from 'next/navigation';
import { ClassProfileSection } from '@/components/class/class-profile-section';

// Dev-only: the class type section without the database (the class page needs a signed-in teacher's data).
export default function ClassProfilePreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="theme-Midnight min-h-screen space-y-6 bg-lc-bg p-6">
      <ClassProfileSection classId="dev-new" initialProfile={null} studentCount={6} />
      <ClassProfileSection classId="dev-set" initialProfile={{ type: 'game-time', screens: 'some', place: 'online', minutes: 20, age: 'teens' }} studentCount={1} />
    </div>
  );
}
