export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {children}
    </div>
  );
}
