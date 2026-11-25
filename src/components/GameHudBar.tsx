import React from 'react';
import { Award, CheckCircle2, Clock, Pause, Trophy, User } from 'lucide-react';
import { PhaseId } from './HeaderBar';
import { formatSecondsMMSS, TotalScoreSummary } from '../logic/gamification';

interface GameHudBarProps {
  nick: string;
  activePhase: PhaseId;
  remainingSeconds: number;
  isTimerPaused: boolean;
  scoreSummary: TotalScoreSummary;
  allPhasesCompleted: boolean;
  onEditNick: () => void;
  onOpenVictory: () => void;
}

export const GameHudBar: React.FC<GameHudBarProps> = ({
  nick,
  activePhase,
  remainingSeconds,
  isTimerPaused,
  scoreSummary,
  allPhasesCompleted,
  onEditNick,
  onOpenVictory,
}) => {
  const activePhaseScore = scoreSummary.phases[activePhase - 1];
  const isPhaseDone = activePhaseScore.completed;
  const isLowTime = !isPhaseDone && remainingSeconds > 0 && remainingSeconds <= 30;
  const isTimeUp = !isPhaseDone && remainingSeconds <= 0;

  return (
    <div
      className="bg-slate-100 border-b border-slate-200"
      aria-label="Marcador de reto y cronómetro de fase"
      data-testid="game-hud-bar"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Player Nick + Phase Timer */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEditNick}
            data-testid="hud-nick-btn"
            title="Cambiar nick"
            className="px-3 py-1 bg-white hover:bg-sky-50 border border-slate-300 hover:border-sky-400 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span className="text-slate-500 font-normal">Alumno/a:</span>
            <strong className="text-slate-900">
              {nick || 'Sin nick'}
            </strong>
          </button>

          <div
            data-testid="hud-phase-timer"
            className={`px-3 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 ${
              isPhaseDone
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isTimeUp
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : isLowTime
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {isPhaseDone ? (
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
            ) : isTimerPaused ? (
              <Pause
                className="w-3.5 h-3.5 text-slate-500 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <Clock
                className={`w-3.5 h-3.5 shrink-0 ${
                  isLowTime
                    ? 'text-rose-600'
                    : isTimeUp
                      ? 'text-amber-600'
                      : 'text-sky-700'
                }`}
                aria-hidden="true"
              />
            )}

            <span>
              Tiempo Fase {activePhase}:{' '}
              {isPhaseDone
                ? `${formatSecondsMMSS(remainingSeconds)} (+${activePhaseScore.timeBonusPoints} pts)`
                : formatSecondsMMSS(remainingSeconds)}
            </span>

            {!isPhaseDone && isTimerPaused && (
              <span className="font-sans text-[11px] font-semibold text-slate-500">
                (Pausado)
              </span>
            )}
            {isTimeUp && (
              <span className="font-sans text-[11px] font-semibold text-amber-800">
                · Bonus tiempo 0 (puedes seguir)
              </span>
            )}
          </div>
        </div>

        {/* Right: Per-phase mini breakdown + Total Score + Diploma button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600">
            {scoreSummary.phases.map((p) => (
              <span
                key={p.phase}
                className={`px-2 py-1 rounded border ${
                  p.completed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                    : p.phase === activePhase
                      ? 'bg-white border-sky-300 text-slate-900 font-semibold'
                      : 'bg-white/70 border-slate-200 text-slate-500'
                }`}
              >
                F{p.phase}: {p.totalPoints} pts
              </span>
            ))}
          </div>

          <div
            data-testid="hud-total-score"
            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-2"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>
              Puntuación:{' '}
              <strong className="text-amber-300 text-sm">
                {scoreSummary.totalScore}
              </strong>{' '}
              pts
            </span>
          </div>

          {allPhasesCompleted && (
            <button
              type="button"
              onClick={onOpenVictory}
              data-testid="hud-open-victory-btn"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ver puntuación final</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
