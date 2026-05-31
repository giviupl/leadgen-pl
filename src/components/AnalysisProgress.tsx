export type AnalysisStage = 'idle' | 'data' | 'ai' | 'save' | 'done';

const stages = [
  {
    id: 'data' as const,
    label: 'Pobieram dane firmy',
    desc: 'KRS · REGON · VIES',
  },
  {
    id: 'ai' as const,
    label: 'Analizuję firmę z AI',
    desc: 'Gemini 2.5 Flash · scoring · rekomendacje giftingu',
  },
  {
    id: 'save' as const,
    label: 'Zapisuję raport do bazy',
    desc: 'Supabase · historia analiz',
  },
];

export function AnalysisProgress({ currentStage }: { currentStage: AnalysisStage }) {
  const stageIndex = stages.findIndex((s) => s.id === currentStage);
  const isDone = currentStage === 'done';

  return (
    <div className="bg-bg-panel border border-bg-border rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-muted text-sm uppercase tracking-wider">
          Trwa analiza
        </h3>
        {isDone && (
          <span className="text-success text-sm flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Gotowe
          </span>
        )}
      </div>
      <ul className="space-y-5">
        {stages.map((stage, i) => {
          const isComplete = isDone || i < stageIndex;
          const isCurrent = !isDone && i === stageIndex;
          const isPending = !isDone && i > stageIndex;

          return (
            <li key={stage.id} className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                {isComplete && (
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                {isCurrent && (
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                )}
                {isPending && (
                  <div className="w-6 h-6 border-2 border-bg-border rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <p className={`transition ${isPending ? 'text-text-muted' : 'text-text-main'} ${isCurrent ? 'font-medium' : ''}`}>
                  {stage.label}
                </p>
                <p className="text-text-muted text-xs mt-1">{stage.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}