import React, { useEffect, useState } from 'react';
import {
  Clock,
  Compass,
  Play,
  Sparkles,
  Trophy,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { DifficultyLevel, sanitizeNick } from '../logic/gamification';

interface NickEntryModalProps {
  isOpen: boolean;
  currentNick: string;
  currentDifficulty: DifficultyLevel;
  canCancel: boolean;
  onConfirmNick: (nick: string, difficulty: DifficultyLevel) => void;
  onCancel?: () => void;
}

export const NickEntryModal: React.FC<NickEntryModalProps> = ({
  isOpen,
  currentNick,
  currentDifficulty,
  canCancel,
  onConfirmNick,
  onCancel,
}) => {
  const [draft, setDraft] = useState(currentNick);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>(currentDifficulty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(currentNick);
      setSelectedDifficulty(currentDifficulty);
      setError(null);
    }
  }, [isOpen, currentNick, currentDifficulty]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeNick(draft);
    if (cleaned.length < 2) {
      setError('Escribe un nick de al menos 2 caracteres para empezar.');
      return;
    }
    onConfirmNick(cleaned, selectedDifficulty);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nick-modal-title"
      data-testid="nick-modal"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl my-auto">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-sky-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-sky-700">
                MODO RETO · TALLER DE REDES FP
              </p>
              <h2
                id="nick-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                {canCancel
                  ? 'Cambiar nick o nivel de dificultad'
                  : '¡Pon tu nick y supera el reto del Rack 19"!'}
              </h2>
            </div>
          </div>
          {canCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cerrar ventana de nick"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="student-nick-input"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Tu nick o nombre en clase
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="student-nick-input"
                type="text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={20}
                autoFocus
                placeholder="Ej: Laura_FPB o Carlos_04"
                data-testid="nick-input"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Difficulty Selector */}
          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-2">
              Elige tu nivel de práctica
            </span>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Selector de dificultad"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedDifficulty === 'principiante'}
                onClick={() => setSelectedDifficulty('principiante')}
                data-testid="level-principiante-btn"
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 flex items-start gap-3 ${
                  selectedDifficulty === 'principiante'
                    ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-600/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedDifficulty === 'principiante'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Compass className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">
                    Nivel Principiante
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Modo guiado paso a paso con fichas de ayuda.
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={selectedDifficulty === 'tecnico'}
                onClick={() => setSelectedDifficulty('tecnico')}
                data-testid="level-tecnico-btn"
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-start gap-3 ${
                  selectedDifficulty === 'tecnico'
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedDifficulty === 'tecnico'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Wrench className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">
                    Nivel Técnico
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                    Reto completo: identifica funciones, llena el rack y cablea varias aulas.
                  </p>
                </div>
              </button>
            </div>
            {canCancel && selectedDifficulty !== currentDifficulty && (
              <p className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                Al cambiar de nivel se reiniciará la práctica para cargar los equipos del nuevo nivel.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
              <Clock
                className="w-4 h-4 text-sky-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <div className="font-bold text-slate-900">Tiempo por fase</div>
                <p className="text-slate-600 mt-0.5 leading-snug">
                  {selectedDifficulty === 'tecnico'
                    ? 'Fase 1 (3:00), Fase 2 (4:00) y Fase 3 (6:00). El reloj se pausa con el tutorial.'
                    : 'Fase 1 (2:00), Fase 2 (3:00) y Fase 3 (5:00). El reloj se pausa mientras lees el tutorial.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg flex items-start gap-2">
              <Sparkles
                className="w-4 h-4 text-sky-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <div className="font-bold text-slate-900">Aciertos + Rapidez</div>
                <p className="text-slate-600 mt-0.5 leading-snug">
                  Sumas puntos por cada ficha, montaje y cable correcto, más un bonus por segundos sobrantes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              data-testid="nick-submit-btn"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>{canCancel ? 'Guardar cambios' : '¡Empezar reto!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
