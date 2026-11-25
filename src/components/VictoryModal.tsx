import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Medal,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  formatSecondsMMSS,
  LeaderboardEntry,
  TotalScoreSummary,
} from '../logic/gamification';

interface VictoryModalProps {
  isOpen: boolean;
  nick: string;
  scoreSummary: TotalScoreSummary;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  nick,
  scoreSummary,
  leaderboard,
  onClose,
  onPlayAgain,
}) => {
  if (!isOpen) return null;

  const totalTimeUsed = scoreSummary.phases.reduce(
    (sum, p) => sum + (p.timeUsedSeconds ?? 0),
    0
  );

  const tierColors =
    scoreSummary.rank.tier === 'oro'
      ? 'bg-amber-50 border-amber-300 text-amber-950'
      : scoreSummary.rank.tier === 'plata'
        ? 'bg-slate-100 border-slate-300 text-slate-900'
        : 'bg-orange-50 border-orange-300 text-orange-950';

  const medalIconColor =
    scoreSummary.rank.tier === 'oro'
      ? 'text-amber-600'
      : scoreSummary.rank.tier === 'plata'
        ? 'text-slate-600'
        : 'text-orange-700';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
      data-testid="victory-modal"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center shrink-0">
              <Trophy
                className="w-6 h-6 text-emerald-700"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-emerald-700">
                PRÁCTICA COMPLETADA · 3/3 FASES
              </p>
              <h2
                id="victory-modal-title"
                className="text-xl font-bold text-slate-900"
              >
                ¡Enhorabuena, {nick || 'Técnico/a'}!
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Has montado el armario rack 19&quot; y dejado los 4 ordenadores del aula conectados a Internet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de puntuación final"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Hero Final Score & Rank */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between">
            <div className="text-xs font-mono text-slate-300">
              PUNTUACIÓN FINAL
            </div>
            <div
              className="text-4xl font-bold font-mono text-amber-300 my-1"
              data-testid="victory-final-score"
            >
              {scoreSummary.totalScore}{' '}
              <span className="text-base font-normal text-slate-300">pts</span>
            </div>
            <div className="text-xs text-slate-300 space-y-0.5 font-mono">
              <div className="flex justify-between">
                <span className="font-sans">Aciertos:</span>
                <span>{scoreSummary.totalAccuracyPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans">Bonus tiempo:</span>
                <span className="text-emerald-300">+{scoreSummary.totalTimeBonusPoints} pts</span>
              </div>
            </div>
          </div>

          <div
            className={`sm:col-span-7 rounded-xl border p-4 flex items-start gap-3 ${tierColors}`}
          >
            <Medal
              className={`w-7 h-7 shrink-0 mt-0.5 ${medalIconColor}`}
              aria-hidden="true"
            />
            <div>
              <div className="text-xs font-mono font-semibold opacity-80">
                RANGO OBTENIDO · TIEMPO TOTAL {formatSecondsMMSS(totalTimeUsed)}
              </div>
              <h3 className="text-base font-bold mt-0.5">
                {scoreSummary.rank.title}
              </h3>
              <p className="text-xs leading-relaxed mt-1 opacity-90">
                {scoreSummary.rank.description}
              </p>
            </div>
          </div>
        </div>

        {/* Per-phase Breakdown */}
        <div className="mt-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Resumen por fases
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {scoreSummary.phases.map((phase) => (
              <div
                key={phase.phase}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between gap-1 font-bold text-slate-900">
                  <span>{phase.title}</span>
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 space-y-1 text-slate-600 font-mono">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      Tiempo:
                    </span>
                    <strong className="text-slate-900">
                      {phase.timeUsedSeconds !== null
                        ? formatSecondsMMSS(phase.timeUsedSeconds)
                        : '--:--'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Aciertos:</span>
                    <span>{phase.accuracyPoints} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Rapidez:</span>
                    <span className="text-emerald-700 font-semibold">
                      +{phase.timeBonusPoints} pts
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex justify-between font-mono font-bold text-slate-900">
                  <span>Total</span>
                  <span>{phase.totalPoints} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Classroom Hall of Fame */}
        {leaderboard.length > 0 && (
          <div className="mt-4 p-3.5 bg-sky-50/50 border border-sky-200 rounded-xl">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span>Mejores marcas guardadas en este ordenador</span>
            </h3>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-slate-500 w-4">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">
                      {entry.nick}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">
                      · {entry.rankTitle}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-sky-800 shrink-0">
                    {entry.score} pts ({formatSecondsMMSS(entry.totalTimeUsedSeconds)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-700" aria-hidden="true" />
            <span>Seguir explorando</span>
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            data-testid="victory-play-again-btn"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Jugar de nuevo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
