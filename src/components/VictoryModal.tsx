import React, { useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Clock,
  Medal,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  DifficultyLevel,
  formatSecondsMMSS,
  getDifficultyLabel,
  LeaderboardEntry,
  TotalScoreSummary,
} from '../logic/gamification';

interface VictoryModalProps {
  isOpen: boolean;
  nick: string;
  difficulty?: DifficultyLevel;
  scoreSummary: TotalScoreSummary;
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  onPlayAgain: () => void;
}

function downloadCertificatePng(
  nick: string,
  difficulty: DifficultyLevel,
  scoreSummary: TotalScoreSummary
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer technical border
  ctx.strokeStyle = difficulty === 'tecnico' ? '#4F46E5' : '#0284C7';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  const levelBadgeText =
    difficulty === 'tecnico'
      ? 'NIVEL TÉCNICO SUPERADO'
      : 'NIVEL PRINCIPIANTE SUPERADO';

  // Header
  ctx.fillStyle = difficulty === 'tecnico' ? '#4338CA' : '#0369A1';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(
    `TALLER DE REDES FP · RACK 19" · ${levelBadgeText}`,
    72,
    95
  );

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(`¡Enhorabuena, ${nick || 'Alumno/a'}!`, 72, 160);

  ctx.fillStyle = '#475569';
  ctx.font = '22px sans-serif';
  ctx.fillText(
    `Comprobante de práctica (${getDifficultyLabel(difficulty)}) para entrega de clase`,
    72,
    200
  );

  // Score hero box
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(72, 235, 440, 175);
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('PUNTUACIÓN TOTAL (3 FASES)', 100, 275);
  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(`${scoreSummary.totalScore} pts`, 100, 348);
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '18px sans-serif';
  ctx.fillText(
    `Aciertos: ${scoreSummary.totalAccuracyPoints} pts · Bonus tiempo: +${scoreSummary.totalTimeBonusPoints} pts`,
    100,
    386
  );

  // Rank box
  ctx.fillStyle = '#EFF6FF';
  ctx.fillRect(540, 235, 588, 175);
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 2;
  ctx.strokeRect(540, 235, 588, 175);
  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('RANGO OBTENIDO', 568, 275);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(scoreSummary.rank.title, 568, 325);
  ctx.fillStyle = '#334155';
  ctx.font = '18px sans-serif';
  ctx.fillText(
    `Fecha: ${new Date().toLocaleDateString('es-ES')} · Prof. Adrián Santos`,
    568,
    380
  );

  // 3 phase summary cards
  const cardW = 336;
  scoreSummary.phases.forEach((p, idx) => {
    const x = 72 + idx * (cardW + 24);
    const y = 445;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, cardW, 195);
    ctx.strokeStyle = p.completed ? '#10B981' : '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, cardW, 195);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(p.title, x + 20, y + 42);

    ctx.fillStyle = '#475569';
    ctx.font = '18px sans-serif';
    ctx.fillText(
      `Estado: ${p.completed ? 'Superada ✓' : 'Pendiente'}`,
      x + 20,
      y + 82
    );
    ctx.fillText(
      `Tiempo: ${p.timeUsedSeconds !== null ? formatSecondsMMSS(p.timeUsedSeconds) : '--:--'}`,
      x + 20,
      y + 114
    );
    ctx.fillText(
      `Aciertos: ${p.accuracyPoints} · Tiempo: +${p.timeBonusPoints}`,
      x + 20,
      y + 146
    );
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`Total: ${p.totalPoints} pts`, x + 20, y + 180);
  });

  const safeName = (nick || 'alumno')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_');
  const link = document.createElement('a');
  link.download = `entrega_rack19_${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  nick,
  difficulty = 'principiante',
  scoreSummary,
  leaderboard,
  onClose,
  onPlayAgain,
}) => {
  const [downloadedNotice, setDownloadedNotice] = useState(false);

  if (!isOpen) return null;

  const completedPhasesCount = scoreSummary.phases.filter(
    (p) => p.completed
  ).length;
  const difficultyLabel = getDifficultyLabel(difficulty);
  const certificateBadge =
    difficulty === 'tecnico'
      ? 'Nivel Técnico superado'
      : 'Nivel Principiante superado';

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
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-mono font-semibold text-emerald-700">
                  RESUMEN DE PRÁCTICA · {completedPhasesCount}/3 FASES COMPLETADAS
                </p>
                <span
                  data-testid="victory-difficulty-badge"
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                    difficulty === 'tecnico'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                      : 'bg-sky-50 border-sky-300 text-sky-900'
                  }`}
                >
                  {certificateBadge}
                </span>
              </div>
              <h2
                id="victory-modal-title"
                className="text-xl font-bold text-slate-900 mt-0.5"
              >
                ¡Enhorabuena, {nick || 'Técnico/a'}!
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {completedPhasesCount === 3
                  ? `Has completado el ${difficultyLabel} montando el armario rack 19" y cableando la red.`
                  : `Has completado el cableado de la Fase 3 (${difficultyLabel}). Aquí tienes tu resumen actual.`}
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
              PUNTUACIÓN TOTAL (3 FASES)
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
                <span className="text-emerald-300">
                  +{scoreSummary.totalTimeBonusPoints} pts
                </span>
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
                RANGO OBTENIDO · TIEMPO {formatSecondsMMSS(totalTimeUsed)}
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
            Puntuación por fases
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {scoreSummary.phases.map((phase) => (
              <div
                key={phase.phase}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between gap-1 font-bold text-slate-900">
                  <span>{phase.title}</span>
                  {phase.completed && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  )}
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
                        : 'En curso'}
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
                      · {entry.rankTitle} ·{' '}
                      {getDifficultyLabel(entry.difficulty ?? 'principiante')}
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

        {downloadedNotice && (
          <p
            role="status"
            className="mt-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
          >
            ¡Captura de entrega descargada! Ya puedes subir la imagen a tu aula virtual o hacer captura directa de esta ventana.
          </p>
        )}

        {/* Footer Buttons: Capture for class + Continue + Restart */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              downloadCertificatePng(nick, difficulty, scoreSummary);
              setDownloadedNotice(true);
            }}
            data-testid="victory-capture-btn"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            <span>Guardar captura de entrega</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span>Seguir viendo</span>
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              data-testid="victory-play-again-btn"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reiniciar práctica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
