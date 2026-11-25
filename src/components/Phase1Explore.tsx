import React from 'react';
import { ArrowRight, CheckCircle2, Info, MapPin, Wrench } from 'lucide-react';
import {
  ComponentId,
  EDUCATIONAL_COMPONENTS,
} from '../data/componentsData';
import { DeviceSvg } from './DeviceSvg';

interface Phase1ExploreProps {
  selectedId: ComponentId;
  exploredIds: ComponentId[];
  onSelectComponent: (id: ComponentId) => void;
  onGoToPhase2: () => void;
}

export const Phase1Explore: React.FC<Phase1ExploreProps> = ({
  selectedId,
  exploredIds,
  onSelectComponent,
  onGoToPhase2,
}) => {
  const selected =
    EDUCATIONAL_COMPONENTS.find((c) => c.id === selectedId) ??
    EDUCATIONAL_COMPONENTS[0];

  const exploredCount = exploredIds.length;
  const totalCount = EDUCATIONAL_COMPONENTS.length;

  return (
    <section
      aria-labelledby="phase1-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-sky-700 font-semibold mb-1">
            FASE 1 · MODO EXPLORACIÓN
          </p>
          <h2
            id="phase1-heading"
            className="text-2xl font-bold text-slate-900 tracking-tight"
          >
            Conoce los componentes del armario rack y el aula
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Haz clic en cada equipo para leer su ficha técnica y saber dónde se coloca antes de empezar el montaje.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-slate-700">
            Fichas revisadas:{' '}
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
            const isSelected = comp.id === selected.id;
            const isExplored = exploredIds.includes(comp.id);
            const isLastFullSpan = idx === EDUCATIONAL_COMPONENTS.length - 1;

            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => onSelectComponent(comp.id)}
                aria-pressed={isSelected}
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

                  {isExplored && (
                    <span
                      className="text-xs font-semibold text-emerald-700 flex items-center gap-1 shrink-0"
                      title="Componente revisado"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>Visto</span>
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-center">
                  <DeviceSvg type={comp.id} className="w-full h-16" />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {comp.subtitulo}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed FP Básica Technical Sheet */}
        <aside
          aria-live="polite"
          data-tour="p1-detail-sheet"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-32"
        >
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
                <Wrench className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span>¿Para qué sirve?</span>
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed mt-1">
                {selected.paraQueSirve}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" aria-hidden="true" />
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
        </aside>
      </div>
    </section>
  );
};
