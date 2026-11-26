import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  Award,
  Cable,
  Check,
  CheckCircle2,
  Cloud,
  Monitor,
  PlugZap,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  attemptStepConnection,
  CableConnection,
  CableType,
  getCurrentWiringStep,
  getPortById,
  GUIDED_WIRING_STEPS,
  isPortOccupied,
  TOTAL_EXPECTED_CABLES,
  validateStepPortSelection,
} from '../logic/networkValidation';
import { PlacedRackItem } from '../logic/rackValidation';

interface Phase3NetworkWiringProps {
  placedRackItems: PlacedRackItem[];
  rackValidated: boolean;
  cables: CableConnection[];
  phase3Completed: boolean;
  onStepSuccess: (nextCables: CableConnection[]) => void;
  onStepMistake: () => void;
  onClearCables: () => void;
  onOpenVictory: () => void;
}

interface Point {
  x: number;
  y: number;
}

function playSuccessTone(isFinalStep: boolean): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = isFinalStep ? [523.25, 659.25, 783.99] : [523.25, 659.25];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.24);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Ignore audio context restrictions
  }
}

function computeCurvedWirePath(
  p1: Point,
  p2: Point,
  cableType: CableType,
  fromPortId: string,
  toPortId: string,
  rackRightEdge?: number
): string {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);

  // Power cable (SAI -> Router 230V): clean orthogonal rounded duct outside the right edge of the rack
  if (cableType === 'power') {
    const channelX = Math.max(
      (rackRightEdge ?? Math.max(p1.x, p2.x) + 80) + 22,
      Math.max(p1.x, p2.x) + 95
    );
    const r = Math.min(16, Math.max(6, dy / 2));
    const dirY = p2.y >= p1.y ? 1 : -1;
    return `M ${p1.x} ${p1.y} L ${channelX - r} ${p1.y} Q ${channelX} ${p1.y} ${channelX} ${p1.y + r * dirY} L ${channelX} ${p2.y - r * dirY} Q ${channelX} ${p2.y} ${channelX - r} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  // Router LAN -> Switch Uplink or Switch Aula -> Patch Panel: sleek vertical S-curve in dedicated column
  const pair = new Set([fromPortId, toPortId]);
  if (pair.has('router-lan') || pair.has('switch-aula')) {
    const midY = (p1.y + p2.y) / 2;
    return `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
  }

  // Internet (Left col) -> Router WAN (Col 1): smooth horizontal S-curve
  const offset = Math.max(40, Math.min(100, dx * 0.45 + dy * 0.1));
  return `M ${p1.x} ${p1.y} C ${p1.x + (p2.x >= p1.x ? offset : -offset)} ${p1.y}, ${p2.x - (p2.x >= p1.x ? offset : -offset)} ${p2.y}, ${p2.x} ${p2.y}`;
}

function coordsEqual(a: Map<string, Point>, b: Map<string, Point>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, pa] of a) {
    const pb = b.get(k);
    if (!pb) return false;
    if (Math.abs(pa.x - pb.x) >= 0.75 || Math.abs(pa.y - pb.y) >= 0.75) {
      return false;
    }
  }
  return true;
}

export const Phase3NetworkWiring: React.FC<Phase3NetworkWiringProps> = ({
  placedRackItems,
  rackValidated,
  cables,
  phase3Completed,
  onStepSuccess,
  onStepMistake,
  onClearCables,
  onOpenVictory,
}) => {
  const [selectedCable, setSelectedCable] = useState<CableType | null>(null);
  const [selectedOriginPort, setSelectedOriginPort] = useState<string | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'warning';
    text: string;
  } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rackBoxRef = useRef<HTMLDivElement | null>(null);
  const portRefs = useRef<Map<string, HTMLElement>>(new Map());
  const portCoordsRef = useRef<Map<string, Point>>(new Map());
  const [portCoords, setPortCoords] = useState<Map<string, Point>>(new Map());
  const [rackRightEdge, setRackRightEdge] = useState<number | undefined>(
    undefined
  );

  const currentStep = useMemo(() => getCurrentWiringStep(cables), [cables]);

  // Order the 4 key rack devices cleanly (following Phase 2 layout if available, else standard order)
  const rackOrder = useMemo(() => {
    const defaultOrder: ('router' | 'switch' | 'patch_panel' | 'sai')[] = [
      'router',
      'switch',
      'patch_panel',
      'sai',
    ];
    if (placedRackItems.length < 4) return defaultOrder;

    const sorted = [...placedRackItems]
      .filter((i) => i.id !== 'bandeja' && i.id !== 'pdu')
      .sort((a, b) => b.bottomU - a.bottomU)
      .map((i) => i.id as 'router' | 'switch' | 'patch_panel' | 'sai');

    for (const d of defaultOrder) {
      if (!sorted.includes(d)) sorted.push(d);
    }
    return sorted;
  }, [placedRackItems]);

  const measurePorts = useCallback(() => {
    const container = stageRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next = new Map<string, Point>();
    portRefs.current.forEach((el, portId) => {
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      next.set(portId, {
        x: r.left - containerRect.left + r.width / 2,
        y: r.top - containerRect.top + r.height / 2,
      });
    });

    const rackEl = rackBoxRef.current;
    if (rackEl) {
      const rr = rackEl.getBoundingClientRect();
      const nextRight = rr.right - containerRect.left;
      setRackRightEdge((prev) =>
        prev !== undefined && Math.abs(prev - nextRight) < 0.75
          ? prev
          : nextRight
      );
    }

    if (!coordsEqual(portCoordsRef.current, next)) {
      portCoordsRef.current = next;
      setPortCoords(next);
    }
  }, []);

  useLayoutEffect(() => {
    measurePorts();
  }, [measurePorts, rackOrder, cables.length, phase3Completed]);

  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;
    let rafId = 0;
    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => measurePorts());
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [measurePorts]);

  const registerPortRef = useCallback(
    (portId: string) => (el: HTMLButtonElement | null) => {
      if (el) portRefs.current.set(portId, el);
      else portRefs.current.delete(portId);
    },
    []
  );

  const handleSelectCable = (cableType: CableType) => {
    setSelectedCable(cableType);
    setSelectedOriginPort(null);
    setFeedback(null);
  };

  const handlePortClick = (portId: string) => {
    if (!currentStep) return;

    // Step 1: Validate individual port against current cable & step
    const check = validateStepPortSelection({
      step: currentStep,
      selectedCable,
      portId,
      cables,
    });

    if (!check.ok) {
      onStepMistake();
      setFeedback({
        kind: 'warning',
        text: check.reason ?? 'Revisa el cable y los puertos que parpadean.',
      });
      return;
    }

    // First port click -> select origin
    if (!selectedOriginPort) {
      setSelectedOriginPort(portId);
      setFeedback(null);
      return;
    }

    // Clicked same port -> deselect cleanly without error
    if (selectedOriginPort === portId) {
      setSelectedOriginPort(null);
      return;
    }

    // Second port click -> attempt step completion
    const result = attemptStepConnection({
      cables,
      selectedCable,
      fromPortId: selectedOriginPort,
      toPortId: portId,
    });

    if (result.error || !result.completedStep) {
      onStepMistake();
      setFeedback({
        kind: 'warning',
        text: result.error ?? 'Elige los dos puertos del paso actual.',
      });
      return;
    }

    const isFinal = result.cables.length >= TOTAL_EXPECTED_CABLES;
    playSuccessTone(isFinal);
    setSelectedOriginPort(null);
    setFeedback({
      kind: 'success',
      text: result.completedStep.successMessage,
    });
    onStepSuccess(result.cables);
  };

  const renderPortButton = (portId: string) => {
    const port = getPortById(portId);
    if (!port) return null;

    const occupied = isPortOccupied(cables, portId);
    const isOrigin = selectedOriginPort === portId;
    const isCurrentStepPort =
      currentStep !== null &&
      (currentStep.fromPortId === portId || currentStep.toPortId === portId);
    const isReadyTarget =
      Boolean(selectedOriginPort) &&
      isCurrentStepPort &&
      selectedOriginPort !== portId;

    const isPowerPort = port.expectedCable === 'power';

    let styleClass = isPowerPort
      ? 'bg-slate-800 border-slate-900 text-white hover:bg-slate-700'
      : 'bg-sky-50 border-sky-600 text-sky-950 hover:bg-sky-100';

    if (occupied) {
      styleClass =
        'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs';
    } else if (isOrigin) {
      styleClass = isPowerPort
        ? 'bg-slate-900 border-amber-400 text-white ring-4 ring-amber-400/50 scale-105 shadow-md'
        : 'bg-sky-600 border-sky-800 text-white ring-4 ring-sky-400/50 scale-105 shadow-md';
    } else if (isReadyTarget) {
      styleClass =
        'bg-emerald-100 border-emerald-600 text-emerald-950 ring-4 ring-emerald-400/60 animate-pulse shadow-md';
    } else if (isCurrentStepPort) {
      styleClass = isPowerPort
        ? 'bg-slate-800 border-amber-400 text-white ring-4 ring-amber-400/45 animate-pulse shadow-sm'
        : 'bg-sky-100 border-sky-600 text-sky-950 ring-4 ring-sky-400/45 animate-pulse shadow-sm';
    } else if (!occupied && currentStep) {
      styleClass = isPowerPort
        ? 'bg-slate-700/80 border-slate-600 text-slate-200 opacity-75 hover:opacity-100'
        : 'bg-white border-slate-300 text-slate-700 opacity-75 hover:opacity-100';
    }

    return (
      <button
        key={portId}
        ref={registerPortRef(portId)}
        type="button"
        onClick={() => handlePortClick(portId)}
        data-testid={`port-${portId}`}
        data-step-highlight={isCurrentStepPort ? 'true' : 'false'}
        aria-label={`${port.label} (${port.deviceLabel})${
          occupied ? ' - conectado' : isCurrentStepPort ? ' - paso actual' : ''
        }`}
        className={`relative z-30 w-full min-w-[132px] px-3 py-2 rounded-xl border-2 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 flex items-center gap-2 ${styleClass}`}
      >
        <span
          className={`w-3 h-3 rounded-full shrink-0 border ${
            occupied
              ? 'bg-emerald-500 border-emerald-700'
              : isOrigin
                ? 'bg-amber-300 border-white'
                : isPowerPort
                  ? 'bg-amber-400 border-amber-200'
                  : 'bg-sky-500 border-sky-700'
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="block text-xs font-bold leading-tight whitespace-nowrap">
            {port.label}
          </span>
          <span className="block text-[11px] font-mono opacity-80 leading-tight whitespace-nowrap">
            {occupied ? 'Conectado ✓' : port.sublabel}
          </span>
        </span>
      </button>
    );
  };

  const originPortObj = selectedOriginPort
    ? getPortById(selectedOriginPort)
    : undefined;

  return (
    <section
      aria-labelledby="phase3-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 space-y-3"
    >
      {/* Top Big Mission Banner */}
      <div
        className="bg-white border-2 border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs"
        data-tour="p3-mission-banner"
        data-testid="mission-banner"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-sky-700">
              FASE 3 · CABLEADO GUIADO EN 4 PASOS
            </p>
            <h2
              id="phase3-heading"
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
              data-testid="current-mission-text"
            >
              {currentStep
                ? currentStep.missionText
                : '¡Enhorabuena! Has completado las 4 conexiones del armario rack.'}
            </h2>
            <p className="text-sm text-slate-600">
              {currentStep
                ? selectedOriginPort
                  ? `Origen seleccionado: ${originPortObj?.label} (${originPortObj?.deviceLabel}). Haz clic ahora en el otro puerto que parpadea.`
                  : '1) Elige el tipo de cable abajo. 2) Haz clic en los dos puertos que parpadean.'
                : 'Todos los equipos del armario tienen corriente y llevan Internet hacia los ordenadores del aula.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {cables.length > 0 && !phase3Completed && (
              <button
                type="button"
                onClick={() => {
                  onClearCables();
                  setSelectedOriginPort(null);
                  setSelectedCable(null);
                  setFeedback(null);
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Repetir cables</span>
              </button>
            )}

            {phase3Completed && (
              <button
                type="button"
                onClick={onOpenVictory}
                data-testid="phase3-open-summary-btn"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>Ver resumen y captura de entrega</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {GUIDED_WIRING_STEPS.map((step) => {
            const isDone = cables.some((c) => c.stepNumber === step.stepNumber);
            const isCurrent = currentStep?.stepNumber === step.stepNumber;
            return (
              <div
                key={step.stepNumber}
                className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-colors ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                    : isCurrent
                      ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-2 ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    step.stepNumber
                  )}
                </span>
                <span className="truncate">
                  {step.stepNumber}. {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Positive reinforcement or friendly non-blocking mistake message */}
        {feedback && (
          <div
            role="status"
            data-testid="phase3-feedback"
            className={`mt-2.5 p-2.5 sm:p-3 rounded-lg border text-sm font-medium flex items-center gap-2.5 ${
              feedback.kind === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            {feedback.kind === 'success' ? (
              <Sparkles
                className="w-5 h-5 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="w-5 h-5 text-amber-600 shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {!rackValidated && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs sm:text-sm text-amber-950 flex items-center gap-2">
          <AlertTriangle
            className="w-4 h-4 text-amber-700 shrink-0"
            aria-hidden="true"
          />
          <span>
            Recuerda completar también el montaje del armario en la{' '}
            <strong>Fase 2</strong> para conseguir la puntuación máxima de la práctica.
          </span>
        </div>
      )}

      {/* Clean Visual Rack Schematic: Left (Internet) -> Center (19" Rack) -> Right (Classroom PCs) */}
      <div className="technical-grid border border-slate-300 rounded-xl p-3.5 sm:p-4 overflow-x-auto">
        <div ref={stageRef} className="relative min-w-[880px]">
          {/* Curved Cable SVG Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            aria-hidden="true"
          >
            {cables.map((cable) => {
              const p1 = portCoords.get(cable.fromPortId);
              const p2 = portCoords.get(cable.toPortId);
              if (!p1 || !p2) return null;

              const pathD = computeCurvedWirePath(
                p1,
                p2,
                cable.type,
                cable.fromPortId,
                cable.toPortId,
                rackRightEdge
              );
              const stroke = cable.type === 'power' ? '#0F172A' : '#0284C7';

              return (
                <g key={cable.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="9"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {cable.type === 'power' && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="relative grid grid-cols-12 gap-5 items-stretch">
            {/* Left Column: Toma de Internet exterior */}
            <div className="col-span-3 flex flex-col justify-start pt-4">
              <div className="bg-white border-2 border-slate-300 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                    <Cloud
                      className="w-5 h-5 text-sky-700"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Entrada de Internet
                    </h3>
                    <p className="text-xs text-slate-600">
                      Roseta de operadora
                    </p>
                  </div>
                </div>
                <div>{renderPortButton('internet-wan')}</div>
              </div>
            </div>

            {/* Center Column: Clean Mounted 19" Rack with 4 Key Devices */}
            <div className="col-span-6 pr-8">
              <div
                ref={rackBoxRef}
                className="relative bg-slate-800 border-4 border-slate-700 rounded-2xl p-3.5 space-y-2.5 shadow-lg"
                data-tour="p3-rack-area"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pb-1 border-b border-slate-700">
                  <span>ARMARIO RACK 19&quot; · EQUIPOS CLAVE</span>
                  <span>230V EN CANAL DERECHO</span>
                </div>

                {rackOrder.map((deviceId) => {
                  if (deviceId === 'router') {
                    const hasPower = cables.some((c) => c.stepNumber === 1);
                    const hasWan = cables.some((c) => c.stepNumber === 2);
                    return (
                      <div
                        key="router"
                        className="bg-white border-2 border-slate-300 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-sm font-bold text-slate-900">
                            Router de operadora
                          </span>
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              hasPower
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {hasPower
                              ? hasWan
                                ? '● CON INTERNET'
                                : '● ENCENDIDO'
                              : '○ SIN CORRIENTE'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>{renderPortButton('router-wan')}</div>
                          <div>{renderPortButton('router-lan')}</div>
                          <div>{renderPortButton('router-pwr')}</div>
                        </div>
                      </div>
                    );
                  }

                  if (deviceId === 'switch') {
                    const switchActive = cables.some((c) => c.stepNumber === 3);
                    return (
                      <div
                        key="switch"
                        className="bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-sm font-bold">
                            Switch 24 puertos
                          </span>
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              switchActive
                                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {switchActive ? '● ENLAZADO' : '○ ESPERANDO RED'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div aria-hidden="true" />
                          <div>{renderPortButton('switch-uplink')}</div>
                          <div>{renderPortButton('switch-aula')}</div>
                        </div>
                      </div>
                    );
                  }

                  if (deviceId === 'patch_panel') {
                    const patchDone = cables.some((c) => c.stepNumber === 4);
                    return (
                      <div
                        key="patch_panel"
                        className="bg-slate-100 border-2 border-slate-300 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-sm font-bold text-slate-900">
                            Patch Panel
                          </span>
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              patchDone
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-white border-slate-300 text-slate-600'
                            }`}
                          >
                            {patchDone
                              ? '● AULA CONECTADA'
                              : 'Salida hacia el aula'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div aria-hidden="true" />
                          <div aria-hidden="true" />
                          <div>{renderPortButton('patch-panel-aula')}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key="sai"
                      className="bg-slate-950 border-2 border-slate-700 rounded-xl p-3 text-white"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-sm font-bold">
                          SAI (UPS) · Base 2U
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border bg-emerald-950 border-emerald-600 text-emerald-300">
                          ● 230V LISTO
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div aria-hidden="true" />
                        <div aria-hidden="true" />
                        <div>{renderPortButton('sai-out')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Classroom Outcome Card */}
            <div className="col-span-3 flex flex-col justify-center">
              <div
                className={`rounded-xl border-2 p-3.5 transition-colors ${
                  phase3Completed
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {phase3Completed ? (
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Monitor
                      className="w-5 h-5 text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="text-sm font-bold">
                    {phase3Completed
                      ? '¡Aula conectada!'
                      : 'Ordenadores del aula'}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed">
                  {phase3Completed
                    ? 'La señal entra al Router, pasa por el Switch y llega por el Patch Panel a los 4 puestos.'
                    : 'Completa los 4 pasos para encender la red en los puestos del aula.'}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((pc) => (
                    <div
                      key={pc}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                        phase3Completed
                          ? 'bg-white border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>PC {pc}</span>
                      <span>{phase3Completed ? 'ON ●' : 'OFF ○'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Visual Selector with ONLY 2 Cable Types */}
      <div
        className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-xs"
        data-tour="p3-cable-selector"
        data-testid="cable-selector-bottom"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Elige el tipo de cable que vas a conectar:
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {selectedCable
              ? selectedCable === 'power'
                ? 'Seleccionado: Cable Negro (230V)'
                : 'Seleccionado: Cable Azul (RJ45)'
              : 'Ningún cable seleccionado aún'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelectCable('power')}
            aria-pressed={selectedCable === 'power'}
            data-testid="cable-select-power"
            className={`p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
              selectedCable === 'power'
                ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-slate-900/20 shadow-sm'
                : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-500'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                selectedCable === 'power'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900 text-amber-400'
              }`}
            >
              <PlugZap className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-amber-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-base font-bold">
                  Cable de Alimentación (Negro - 230V)
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  selectedCable === 'power' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Lleva corriente eléctrica desde el SAI hasta el Router.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectCable('ethernet')}
            aria-pressed={selectedCable === 'ethernet'}
            data-testid="cable-select-ethernet"
            className={`p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
              selectedCable === 'ethernet'
                ? 'bg-sky-600 border-sky-700 text-white ring-4 ring-sky-600/25 shadow-sm'
                : 'bg-sky-50/70 border-sky-300 text-slate-900 hover:border-sky-500'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                selectedCable === 'ethernet'
                  ? 'bg-white text-sky-700'
                  : 'bg-sky-600 text-white'
              }`}
            >
              <Cable className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full bg-sky-500 border border-white shrink-0"
                  aria-hidden="true"
                />
                <span className="text-base font-bold">
                  Cable de Red UTP RJ45 (Azul - Datos)
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  selectedCable === 'ethernet'
                    ? 'text-sky-100'
                    : 'text-slate-600'
                }`}
              >
                Conecta Internet, Router, Switch y Patch Panel para llevar datos.
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
