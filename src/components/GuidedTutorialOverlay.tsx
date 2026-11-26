import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  X,
} from 'lucide-react';
import {
  computeTooltipPosition,
  RectBox,
  TooltipCoords,
  TutorialStep,
} from '../logic/tutorialSteps';

interface GuidedTutorialOverlayProps {
  isOpen: boolean;
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const GuidedTutorialOverlay: React.FC<GuidedTutorialOverlayProps> = ({
  isOpen,
  steps,
  currentStepIndex,
  onNext,
  onPrev,
  onClose,
}) => {
  const step = steps[currentStepIndex];
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [targetRect, setTargetRect] = useState<RectBox | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords>({
    top: 80,
    left: 24,
    placement: 'bottom',
  });

  const measureTarget = useCallback(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.targetTourId}"]`
    );
    if (!el) {
      setTargetRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    const pad = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const top = Math.max(0, r.top - pad);
    const left = Math.max(0, r.left - pad);
    const right = Math.min(vw, r.right + pad);
    const bottom = Math.min(vh, r.bottom + pad);

    const nextWidth = Math.max(0, right - left);
    const nextHeight = Math.max(0, bottom - top);

    setTargetRect((prev) => {
      if (
        prev &&
        Math.abs(prev.top - top) < 1 &&
        Math.abs(prev.left - left) < 1 &&
        Math.abs(prev.width - nextWidth) < 1 &&
        Math.abs(prev.height - nextHeight) < 1
      ) {
        return prev;
      }
      return {
        top,
        left,
        right,
        bottom,
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.targetTourId}"]`
    );
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }
    measureTarget();
    const timer = window.setTimeout(measureTarget, 80);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, step, measureTarget]);

  useLayoutEffect(() => {
    if (!isOpen || !targetRect) return;
    const tip = tooltipRef.current;
    const tipWidth = tip?.offsetWidth || 340;
    const tipHeight = tip?.offsetHeight || 220;

    setTooltipCoords(
      computeTooltipPosition(
        targetRect,
        { width: tipWidth, height: tipHeight },
        { width: window.innerWidth, height: window.innerHeight },
        step?.preferredPlacement ?? 'bottom'
      )
    );
  }, [isOpen, targetRect, step, currentStepIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft' && currentStepIndex > 0) onPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, onNext, onPrev, currentStepIndex]);

  if (!isOpen || !step) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50"
      data-testid="guided-tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-step-title"
    >
      {/* Four backdrop panels creating a crisp cutout around targetRect */}
      {targetRect ? (
        <>
          <div
            className="fixed left-0 top-0 right-0 bg-slate-900/55 transition-all duration-150"
            style={{ height: `${targetRect.top}px` }}
            onClick={onClose}
          />
          <div
            className="fixed left-0 right-0 bottom-0 bg-slate-900/55 transition-all duration-150"
            style={{ top: `${targetRect.bottom}px` }}
            onClick={onClose}
          />
          <div
            className="fixed left-0 bg-slate-900/55 transition-all duration-150"
            style={{
              top: `${targetRect.top}px`,
              height: `${targetRect.height}px`,
              width: `${targetRect.left}px`,
            }}
            onClick={onClose}
          />
          <div
            className="fixed right-0 bg-slate-900/55 transition-all duration-150"
            style={{
              top: `${targetRect.top}px`,
              height: `${targetRect.height}px`,
              left: `${targetRect.right}px`,
            }}
            onClick={onClose}
          />
          {/* Spotlight Ring */}
          <div
            className="fixed pointer-events-none border-2 border-sky-400 ring-4 ring-sky-400/30 rounded-xl transition-all duration-150"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-slate-900/55" onClick={onClose} />
      )}

      {/* Informative Tooltip Card */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-[352px] max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-xl shadow-2xl p-4"
        style={{
          top: `${tooltipCoords.top}px`,
          left: `${tooltipCoords.left}px`,
        }}
        data-testid="tutorial-tooltip"
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <GraduationCap
              className="w-4 h-4 text-sky-600 shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-mono font-semibold text-sky-700">
              Tutorial Fase {step.phase} · Paso {currentStepIndex + 1}/
              {steps.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tutorial guiado"
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <h3
          id="tutorial-step-title"
          className="text-base font-bold text-slate-900 mt-3 leading-snug"
        >
          {step.title}
        </h3>

        <p className="text-sm text-slate-700 leading-relaxed mt-1.5">
          {step.body}
        </p>

        {step.solutionChecklist && step.solutionChecklist.length > 0 && (
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-[11px] font-mono font-semibold text-slate-600">
              SOLUCIÓN RECOMENDADA
            </div>
            {step.solutionChecklist.map((line, i) => (
              <div
                key={i}
                className="text-xs font-medium text-slate-900 flex items-start gap-1.5"
              >
                <Check
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer px-1.5 py-1"
          >
            Omitir tutorial
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Anterior</span>
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? onClose : onNext}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <span>{isLast ? '¡Entendido, empezar!' : 'Siguiente'}</span>
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
