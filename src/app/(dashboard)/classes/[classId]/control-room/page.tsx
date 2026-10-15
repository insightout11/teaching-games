import { redirect } from 'next/navigation';

// The class Control Room was replaced by the Students section on the class page (Oct 2026). Old links land there.
export default function ClassControlRoomRedirect({ params }: { params: { classId: string } }) {
  redirect(`/classes/${params.classId}#students`);
}
