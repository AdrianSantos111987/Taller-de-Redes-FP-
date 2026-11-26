import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import {
  ComponentId,
  EDUCATIONAL_COMPONENTS,
  PHASE1_QUIZ_BY_COMPONENT,
} from '../data/componentsData';
import { DifficultyLevel } from '../logic/gamification';
import { DeviceSvg } from './DeviceSvg';

interface Phase1ExploreProps {
  difficulty?: DifficultyLevel;
  selectedId: ComponentId | null;
  exploredIds: ComponentId[];
  firstTryIds?: ComponentId[];
  onSelectComponent: (id: ComponentId) => void;
  onValidateComponent?: (id: ComponentId, isFirstTry: boolean) => void;
  onGoToPhase2: () => void;
}

export const Phase1Explore: React.FC<Phase1ExploreProps> = ({
  difficulty = 'principiante',
  selectedId,
  exploredIds,
  firstTryIds = [],
  onSelectComponent,
  onValidateComponent,
  onGoToPhase2,
}) => {
  const isTechnical = difficulty === 'tecnico';

  const [quizTargetId, setQuizTargetId] = useState<ComponentId | null>(null);
  const [wrongOptionIds, setWrongOptionIds] = useState<string[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [quizSolved, setQuizSolved] = useState(false);

  const selected =
    selectedId !== null
      ? EDUCATIONAL_COMPONENTS.find((c) => c.id === selectedId) ?? null
      : isTechnical
        ? null
        : EDUCATIONAL_COMPONENTS[0];

  const exploredCount = exploredIds.length;
  const totalCount = EDUCATIONAL_COMPONENTS.length;

  const handleCardClick = (compId: ComponentId) => {
    if (!isTechnical) {
      onSelectComponent(compId);
      return;
    }

    // In Nivel Técnico: validated components open their technical sheet directly;
    // unvalidated components open the active identification quiz modal first.
    if (exploredIds.includes(compId)) {
      onSelectComponent(compId);
      return;
    }

    setQuizTargetId(compId);
    setWrongOptionIds([]);
    setActiveHint(null);
    setQuizSolved(false);
  };

  const handleQuizOptionClick = (
    compId: ComponentId,
    optionId: 'a' | 'b' | 'c',
    isCorrect: boolean,
    wrongHint: string
  ) => {
    if (quizSolved) return;

    if (!isCorrect) {
      setWrongOptionIds((prev) =>
        prev.includes(optionId) ? prev : [...prev, optionId]
      );
      setActiveHint(wrongHint);
      return;
    }

    const isFirstTry = wrongOptionIds.length === 0;
    setActiveHint(null);
    setQuizSolved(true);
    onValidateComponent?.(compId, isFirstTry);
    onSelectComponent(compId);
  };

  const quizComponent = quizTargetId
    ? EDUCATIONAL_COMPONENTS.find((c) => c.id === quizTargetId) ?? null
    : null;
  const quizData = quizTargetId ? PHASE1_QUIZ_BY_COMPONENT[quizTargetId] : null;

  return (
    <section
      aria-labelledby="phase1-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-sky-700 font-semibold mb-1">
            {isTechnical
              ? 'FASE 1 · IDENTIFICACIÓN ACTIVA (NIVEL TÉCNICO)'
              : 'FASE 1 · MODO EXPLORACIÓN'}
          </p>
          <h2
            id="phase1-heading"
            className="text-2xl font-bold text-slate-900 tracking-tight"
          >
            {isTechnical
              ? 'Identifica la función de cada equipo del taller'
              : 'Conoce los componentes del armario rack y el aula'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {isTechnical
              ? 'Haz clic en cada dispositivo, elige su descripción correcta para desbloquear su ficha técnica y consigue puntos extra si aciertas a la primera.'
              : 'Haz clic en cada equipo para leer su ficha técnica y saber dónde se coloca antes de empezar el montaje.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-slate-700">
            {isTechnical ? 'Equipos validados:' : 'Fichas revisadas:'}{' '}
            <strong className="text-slate-900">
              {exploredCount}/{totalCount}
            </strong>
          </span>
          <button
            type="button"
            onClick={onGoToPhase2}
            data-tour="p1-next-btn"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <span>Pasar a Fase 2: Montaje</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 7 Interactive Component Cards */}
        <div
          className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-tour="p1-cards-grid"
        >
          {EDUCATIONAL_COMPONENTS.map((comp, idx) => {
            const isSelected = selected !== null && comp.id === selected.id;
            const isExplored = exploredIds.includes(comp.id);
            const isFirstTry = firstTryIds.includes(comp.id);
            const isLastFullSpan = idx === EDUCATIONAL_COMPONENTS.length - 1;

            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => handleCardClick(comp.id)}
                aria-pressed={isSelected}
                data-testid={`p1-card-${comp.id}`}
                data-tour={
                  comp.id === 'hub'
                    ? 'p1-card-hub'
                    : comp.id === 'sai'
                      ? 'p1-card-sai'
                      : undefined
                }
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 flex flex-col gap-3 ${
                  isLastFullSpan ? 'sm:col-span-2' : ''
                } ${
                  isSelected
                    ? 'bg-white border-sky-600 ring-2 ring-sky-600/20 shadow-sm'
                    : isTechnical && isExplored
                      ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      0{idx + 1} · {comp.unidadesU}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {comp.nombre}
                    </h3>
                  </div>

                  {isExplored ? (
                    <span
                      className="text-xs font-semibold text-emerald-700 flex items-center gap-1 shrink-0"
                      title={
                        isTechnical
                          ? isFirstTry
                            ? 'Validado a la primera'
                            : 'Validado'
                          : 'Componente revisado'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {isTechnical
                          ? isFirstTry
                            ? '1.ª (+50)'
                            : 'Validado'
                          : 'Visto'}
                      </span>
                    </span>
                  ) : isTechnical ? (
                    <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1 shrink-0">
                      <HelpCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Identificar</span>
                    </span>
                  ) : null}
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-center">
                  <DeviceSvg type={comp.id} className="w-full h-16" />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isTechnical && !isExplored
                    ? 'Haz clic para identificar su función y desbloquear la ficha técnica.'
                    : comp.subtitulo}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed FP Básica Technical Sheet (or locked prompt before first unlock in Técnico) */}
        <aside
          aria-live="polite"
          data-tour="p1-detail-sheet"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-32"
        >
          {selected === null ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-indigo-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Ficha técnica bloqueada
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                En <strong>Nivel Técnico</strong> debes identificar primero cada
                equipo eligiendo su función correcta entre 3 opciones. Haz clic
                en cualquier tarjeta de la izquierda para empezar.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-mono text-sky-700 font-semibold">
                    FICHA TÉCNICA · {selected.unidadesU}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {selected.nombre}
                  </h3>
                  <p className="text-sm text-slate-600">{selected.subtitulo}</p>
                </div>
              </div>

              <div className="my-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <DeviceSvg type={selected.id} className="w-full h-24" />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600" aria-hidden="true" />
                    <span>¿Qué es?</span>
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">
                    {selected.queEs}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Wrench
                      className="w-4 h-4 text-sky-600"
                      aria-hidden="true"
                    />
                    <span>¿Para qué sirve?</span>
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">
                    {selected.paraQueSirve}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin
                      className="w-4 h-4 text-sky-600"
                      aria-hidden="true"
                    />
                    <span>¿Dónde se coloca?</span>
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">
                    {selected.dondeSeColoca}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
                  <strong className="font-semibold text-slate-900">
                    Clave de taller:{' '}
                  </strong>
                  {selected.datoClave}
                </div>

                {selected.notaEducativa && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-950">
                      {selected.notaEducativa.titulo}
                    </h4>
                    <p className="text-sm text-amber-900 leading-relaxed mt-1">
                      {selected.notaEducativa.texto}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Nivel Técnico: Active Identification Quiz Modal */}
      {isTechnical && quizComponent && quizData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="p1-quiz-title"
          data-testid="p1-quiz-modal"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <p className="text-xs font-mono font-bold text-indigo-700">
                  RETO TÉCNICO · IDENTIFICA EL EQUIPO
                </p>
                <h3
                  id="p1-quiz-title"
                  className="text-xl font-bold text-slate-900 mt-0.5"
                >
                  {quizComponent.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuizTargetId(null)}
                aria-label="Cerrar pregunta"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <DeviceSvg type={quizComponent.id} className="w-full h-24" />
            </div>

            <p className="text-sm font-bold text-slate-900 mb-3">
              {quizData.question}
            </p>

            <div className="space-y-2.5">
              {quizData.options.map((opt) => {
                const isWrongTried = wrongOptionIds.includes(opt.id);
                const isSolvedRight = quizSolved && opt.isCorrect;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={quizSolved || isWrongTried}
                    onClick={() =>
                      handleQuizOptionClick(
                        quizComponent.id,
                        opt.id,
                        opt.isCorrect,
                        opt.wrongHint
                      )
                    }
                    data-testid={`quiz-option-${opt.id}`}
                    data-correct={opt.isCorrect ? 'true' : 'false'}
                    className={`w-full text-left p-3.5 rounded-xl border-2 text-sm transition-colors flex items-start gap-3 ${
                      isSolvedRight
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                        : isWrongTried
                          ? 'bg-rose-50/70 border-rose-300 text-rose-800 opacity-80 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-slate-800 cursor-pointer'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 uppercase">
                      {opt.id}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {activeHint && (
              <div
                role="status"
                data-testid="p1-quiz-hint"
                className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-950 flex items-start gap-2.5"
              >
                <AlertCircle
                  className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{activeHint}</span>
              </div>
            )}

            {quizSolved && (
              <div
                role="status"
                data-testid="p1-quiz-success"
                className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                  <Sparkles
                    className="w-5 h-5 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {wrongOptionIds.length === 0
                      ? '¡Correcto a la primera! (+50 pts) Ficha desbloqueada.'
                      : '¡Correcto! (+25 pts) Ficha desbloqueada.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuizTargetId(null)}
                  data-testid="p1-quiz-close-success"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Ver ficha técnica
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

