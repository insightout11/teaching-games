'use client';

interface MissionControlSummaryProps {
  studentMissions: Record<string, string>;     // clientId → mission question
  landingAnswers: Record<string, string>;       // clientId → landing answer
  displayNames: Record<string, string>;         // clientId → student display name
  onClose: () => void;
}

export function MissionControlSummary({ studentMissions, landingAnswers, displayNames, onClose }: MissionControlSummaryProps) {
  // Only show students who have both a mission and a landing answer
  const clientIds = Object.keys(studentMissions).filter((id) => landingAnswers[id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl shadow-2xl border border-lc-border w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-violet-300">Mission Control — Class Summary</h2>
            <p className="text-sm opacity-60 mt-0.5">
              Use these to start a brief reflection discussion.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass border border-lc-border text-sm hover:bg-lc-card transition-colors"
          >
            Close
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {clientIds.length === 0 ? (
            <p className="text-center opacity-50 py-8">No mission–answer pairs to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs opacity-50 uppercase tracking-widest text-left">
                    <th className="px-4 py-2 w-28">Student</th>
                    <th className="px-4 py-2">Mission → Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {clientIds.map((clientId) => (
                    <tr key={clientId} className="border-t border-lc-border-subtle">
                      <td className="px-4 py-3 align-top font-semibold opacity-70 w-28">
                        {displayNames[clientId] ?? 'Student'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="opacity-60 italic mb-1">
                          &ldquo;{studentMissions[clientId]}&rdquo;
                        </p>
                        <p>
                          <span className="text-violet-400 mr-1">→</span>
                          {landingAnswers[clientId]}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
