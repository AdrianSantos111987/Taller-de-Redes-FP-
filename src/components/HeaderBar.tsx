import React from 'react';
import {
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Info,
  RotateCcw,
} from 'lucide-react';

export type PhaseId = 1 | 2 | 3;

interface HeaderBarProps {
  activePhase: PhaseId;
  onSelectPhase: (phase: PhaseId) => void;
  completedPhases: {
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
  };
  onStartTutorial: () => void;
  onOpenHelp: () => void;
  onOpenInfo: () => void;
  onResetAll: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activePhase,
  onSelectPhase,
  completedPhases,
  onStartTutorial,
  onOpenHelp,
  onOpenInfo,
  onResetAll,
}) => {
  const completedCount =
    Number(completedPhases.phase1) +
    Number(completedPhases.phase2) +
    Number(completedPhases.phase3);

  const phases: { id: PhaseId; label: string; done: boolean }[] = [
    { id: 1, label: '1. Conoce los componentes', done: completedPhases.phase1 },
    { id: 2, label: '2. Montaje Rack 19"', done: completedPhases.phase2 },
    { id: 3, label: '3. Cableado y Red', done: completedPhases.phase3 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-5 py-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2">
        {/* Brand Zone */}
        <div className="shrink-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Taller de Redes FP · Rack 19&quot;
          </h1>
        </div>

        {/* Guided Phase Tabs */}
        <nav
          aria-label="Fases de la práctica"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto max-w-full xl:shrink-0"
        >
          {phases.map((phase) => {
            const isActive = activePhase === phase.id;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => onSelectPhase(phase.id)}
                aria-current={isActive ? 'step' : undefined}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                {phase.done && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-sky-100' : 'text-emerald-600'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span>{phase.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Top-right Progress & Actions */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div
            className="text-xs text-slate-700 font-medium whitespace-nowrap font-mono pr-2 border-r border-slate-200"
            aria-label={`Progreso: ${completedCount} de 3 fases completadas`}
            data-testid="progress-counter"
          >
            Progreso: <strong className="text-slate-900">{completedCount}/3</strong>
          </div>

          <button
            type="button"
            onClick={onStartTutorial}
            className="px-2.5 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>Tutorial Guiado</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>Ayuda / Pistas</span>
          </button>

          <button
            type="button"
            onClick={onOpenInfo}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>Más info</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reiniciar práctica</span>
          </button>
        </div>
      </div>
    </header>
  );
};
