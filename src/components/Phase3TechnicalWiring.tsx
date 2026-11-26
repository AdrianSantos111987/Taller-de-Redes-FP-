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
  Building2,
  Cable,
  Check,
  CheckCircle2,
  Cloud,
  PlugZap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  attemptTechnicalStepConnection,
  CableType,
  getActiveTechnicalStepPortIds,
  getCurrentTechnicalWiringStep,
  getTechnicalPortById,
  isTechnicalPortOccupied,
  isTechnicalStepDone,
  TECHNICAL_WIRING_STEPS,
  TechnicalCableConnection,
  TOTAL_TECHNICAL_EXPECTED_CABLES,
  validateTechnicalStepPortSelection,
} from '../logic/networkValidation';

interface Phase3TechnicalWiringProps {
  rackValidated: boolean;
  cables: TechnicalCableConnection[];
  phase3Completed: boolean;
  onStepSuccess: (nextCables: TechnicalCableConnection[]) => void;
  onStepMistake: () => void;
  onClearCables: () => void;
  onOpenVictory: () => void;
}

interface Point {
  x: number;
  y: number;
}

function playTechnicalTone(isFinalStep: boolean): void {
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

function computeTechnicalWirePath(
  p1: Point,
  p2: Point,
  cableType: CableType,
  fromPortId: string,
  toPortId: string,
  rackLeftEdge?: number
): string {
  const pair = new Set([fromPortId, toPortId]);

  // 230V Negro power lines routed through dedicated dual left ducts outside rack
  if (cableType === 'power') {
    const baseLeft = rackLeftEdge ?? Math.min(p1.x, p2.x) - 20;
    const isRouterPower = pair.has('tech-sai-router');
    // Outer duct for SAI->Router (starts lower on SAI, goes higher to Router),
    // Inner duct for SAI->Switches (starts higher on SAI, stops lower at Switches).
    // This makes the two power paths 100% planar with zero intersections.
    const channelX = isRouterPower ? baseLeft - 36 : baseLeft - 18;
    const dy = Math.abs(p2.y - p1.y);
    const r = Math.min(14, Math.max(6, dy / 2));
    const dirY = p2.y >= p1.y ? 1 : -1;
    return `M ${p1.x} ${p1.y} L ${channelX + r} ${p1.y} Q ${channelX} ${p1.y} ${channelX} ${p1.y + r * dirY} L ${channelX} ${p2.y - r * dirY} Q ${channelX} ${p2.y} ${channelX + r} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  // Vertical intra-rack links (Router LAN -> SW1 Uplink, SW1 -> SW2, SW1 -> SW3)
  if (
    pair.has('tech-router-lan') ||
    pair.has('tech-sw1-to-sw2') ||
    pair.has('tech-sw1-to-sw3')
  ) {
    const midY = (p1.y + p2.y) / 2;
    return `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
  }

  // Horizontal links (Internet -> Router WAN, and Switches -> Patch Panel rooms)
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const offset = Math.max(36, Math.min(90, dx * 0.42 + dy * 0.08));
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

export const Phase3TechnicalWiring: React.FC<Phase3TechnicalWiringProps> = ({
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
  const [rackLeftEdge, setRackLeftEdge] = useState<number | undefined>(
    undefined
  );

  const currentStep = useMemo(
    () => getCurrentTechnicalWiringStep(cables),
    [cables]
  );

  const activeStepPorts = useMemo(
    () => getActiveTechnicalStepPortIds(currentStep, cables),
    [currentStep, cables]
  );

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
      const nextLeft = rr.left - containerRect.left;
      setRackLeftEdge((prev) =>
        prev !== undefined && Math.abs(prev - nextLeft) < 0.75 ? prev : nextLeft
      );
    }

    if (!coordsEqual(portCoordsRef.current, next)) {
      portCoordsRef.current = next;
      setPortCoords(next);
    }
  }, []);

  useLayoutEffect(() => {
    measurePorts();
  }, [measurePorts, cables.length, phase3Completed]);

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

    const check = validateTechnicalStepPortSelection({
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

    if (!selectedOriginPort) {
      setSelectedOriginPort(portId);
      setFeedback(null);
      return;
    }

    if (selectedOriginPort === portId) {
      setSelectedOriginPort(null);
      return;
    }

    const result = attemptTechnicalStepConnection({
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

    const isFinal = result.cables.length >= TOTAL_TECHNICAL_EXPECTED_CABLES;
    playTechnicalTone(isFinal);
    setSelectedOriginPort(null);
    setFeedback({
      kind: 'success',
      text: result.message ?? result.completedStep.successMessage,
    });
    onStepSuccess(result.cables);
  };

  const renderPortButton = (portId: string, compact = false) => {
    const port = getTechnicalPortById(portId);
    if (!port) return null;

    const occupied = isTechnicalPortOccupied(cables, portId);
    const isOrigin = selectedOriginPort === portId;
    const isCurrentStepPort = activeStepPorts.has(portId);
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
        ? 'bg-slate-900 border-amber-400 text-white ring-4 ring-amber-400/50 scale-[1.03] shadow-md'
        : 'bg-sky-600 border-sky-800 text-white ring-4 ring-sky-400/50 scale-[1.03] shadow-md';
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
        className={`relative z-30 w-full ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } rounded-xl border-2 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 flex items-center gap-2 ${styleClass}`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
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
          <span className="block text-xs font-bold leading-tight truncate">
            {port.label}
          </span>
          <span className="block text-[10px] font-mono opacity-80 leading-tight truncate">
            {occupied ? 'Conectado ✓' : port.sublabel}
          </span>
        </span>
      </button>
    );
  };

  const originPortObj = selectedOriginPort
    ? getTechnicalPortById(selectedOriginPort)
    : undefined;

  const routerPowerOk = cables.some(
    (c) => c.fromPortId === 'tech-sai-router' || c.toPortId === 'tech-sai-router'
  );
  const switchesPowerOk = cables.some(
    (c) =>
      c.fromPortId === 'tech-sai-switches' || c.toPortId === 'tech-sai-switches'
  );
  const wanOk = cables.some(
    (c) =>
      c.fromPortId === 'tech-internet-wan' || c.toPortId === 'tech-internet-wan'
  );
  const sw1Linked = cables.some(
    (c) => c.fromPortId === 'tech-router-lan' || c.toPortId === 'tech-router-lan'
  );
  const sw2Linked = cables.some(
    (c) => c.fromPortId === 'tech-sw1-to-sw2' || c.toPortId === 'tech-sw1-to-sw2'
  );
  const sw3Linked = cables.some(
    (c) => c.fromPortId === 'tech-sw1-to-sw3' || c.toPortId === 'tech-sw1-to-sw3'
  );
  const aula1On = cables.some(
    (c) => c.fromPortId === 'tech-pp-aula1' || c.toPortId === 'tech-pp-aula1'
  );
  const aula2On = cables.some(
    (c) => c.fromPortId === 'tech-pp-aula2' || c.toPortId === 'tech-pp-aula2'
  );
  const profOn = cables.some(
    (c) => c.fromPortId === 'tech-pp-prof' || c.toPortId === 'tech-pp-prof'
  );

  return (
    <section
      aria-labelledby="phase3-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 space-y-3"
    >
      {/* Top Big Mission Banner */}
      <div
        className="bg-white border-2 border-indigo-200 rounded-xl p-3.5 sm:p-4 shadow-xs"
        data-tour="p3-mission-banner"
        data-testid="mission-banner"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-indigo-700">
              FASE 3 · CABLEADO TÉCNICO GUIADO EN 8 PASOS
            </p>
            <h2
              id="phase3-heading"
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
              data-testid="current-mission-text"
            >
              {currentStep
                ? currentStep.missionText
                : '¡Enhorabuena! Nivel Técnico superado: las 3 zonas tienen red.'}
            </h2>
            <p className="text-sm text-slate-600">
              {currentStep
                ? selectedOriginPort
                  ? `Origen seleccionado: ${originPortObj?.label} (${originPortObj?.deviceLabel}). Haz clic ahora en su pareja que parpadea.`
                  : '1) Elige el tipo de cable abajo. 2) Haz clic en los puertos que parpadean.'
                : 'Has alimentado el armario desde el SAI, conectado Internet al Router, enlazado los 3 Switches y repartido red a Aula 1, Aula 2 y Sala de Profesores.'}
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
                <span>Ver certificado Nivel Técnico</span>
              </button>
            )}
          </div>
        </div>

        {/* 8-Step Progress Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TECHNICAL_WIRING_STEPS.map((step) => {
            const isDone = isTechnicalStepDone(cables, step);
            const isCurrent = currentStep?.stepNumber === step.stepNumber;
            return (
              <div
                key={step.stepNumber}
                className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-colors ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                    : isCurrent
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-indigo-600 text-white'
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
            Recuerda completar también las 12U del armario en la{' '}
            <strong>Fase 2</strong> para conseguir la puntuación máxima de
            Nivel Técnico.
          </span>
        </div>
      )}

      {/* Zero-Crossing Technical Schematic: Internet (Left) -> Full Rack (Center) -> Patch Panel Zones (Right) */}
      <div className="technical-grid border border-slate-300 rounded-xl p-3.5 sm:p-4 overflow-x-auto">
        <div ref={stageRef} className="relative min-w-[960px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            aria-hidden="true"
          >
            {cables.map((cable) => {
              const p1 = portCoords.get(cable.fromPortId);
              const p2 = portCoords.get(cable.toPortId);
              if (!p1 || !p2) return null;

              const pathD = computeTechnicalWirePath(
                p1,
                p2,
                cable.type,
                cable.fromPortId,
                cable.toPortId,
                rackLeftEdge
              );
              const stroke = cable.type === 'power' ? '#0F172A' : '#0284C7';

              return (
                <g key={cable.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="4.5"
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
            {/* Left Column: External Internet Jack */}
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
                      Acometida de fibra
                    </p>
                  </div>
                </div>
                <div>{renderPortButton('tech-internet-wan')}</div>
              </div>
            </div>

            {/* Center Column: Mounted 19" Rack with left dual 230V duct gutter */}
            <div className="col-span-6 pl-12">
              <div
                ref={rackBoxRef}
                className="relative bg-slate-800 border-4 border-slate-700 rounded-2xl p-2.5 space-y-1.5 shadow-lg"
                data-tour="p3-rack-area"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pb-1 border-b border-slate-700">
                  <span>ARMARIO RACK 19&quot; · NIVEL TÉCNICO</span>
                  <span>230V EN CANAL IZQUIERDO</span>
                </div>

                {/* Router: WAN in row 1 (above power), Power + LAN in row 2 */}
                <div className="bg-white border-2 border-slate-300 rounded-xl p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Router de operadora (Zona alta)
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        routerPowerOk
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {routerPowerOk
                        ? wanOk
                          ? '● CON INTERNET'
                          : '● ENCENDIDO'
                        : '○ SIN CORRIENTE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-router-wan', true)}</div>
                    <div aria-hidden="true" />
                    <div aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-router-pwr', true)}</div>
                    <div>{renderPortButton('tech-router-lan', true)}</div>
                    <div aria-hidden="true" />
                  </div>
                </div>

                {/* Switch 1 (Principal): Title left, empty center gap for Router->SW1 wire, badge right */}
                <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-2 text-white space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs sm:text-sm font-bold truncate">
                      Switch 1 · Principal
                    </span>
                    <div aria-hidden="true" />
                    <div className="flex justify-end">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          sw1Linked && switchesPowerOk
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : sw1Linked
                              ? 'bg-sky-950 border-sky-500 text-sky-300'
                              : switchesPowerOk
                                ? 'bg-amber-950 border-amber-500 text-amber-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {sw1Linked
                          ? '● ENLAZADO'
                          : switchesPowerOk
                            ? '● 230V OK'
                            : '○ SIN CORRIENTE'}
                      </span>
                    </div>
                  </div>
                  {/* Top row: 230V Switches in Col 1, Uplink Router in Col 2 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-switches-pwr', true)}</div>
                    <div>{renderPortButton('tech-sw1-uplink', true)}</div>
                    <div aria-hidden="true" />
                  </div>
                  {/* Bottom row: Col 1 -> SW3, Col 2 -> SW2, Col 3 -> Aula 1 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-sw1-to-sw3', true)}</div>
                    <div>{renderPortButton('tech-sw1-to-sw2', true)}</div>
                    <div>{renderPortButton('tech-sw1-aula1', true)}</div>
                  </div>
                </div>

                {/* Switch 2 (Aula 2) — Col 1 & Col 2 header stay empty so SW1->SW3 and SW1->SW2 pass cleanly */}
                <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-2 text-white space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div aria-hidden="true" />
                    <div aria-hidden="true" />
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        Switch 2 · Aula 2
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          sw2Linked
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {sw2Linked ? '● OK' : '○ RED'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div aria-hidden="true" />
                    <div>{renderPortButton('tech-sw2-uplink', true)}</div>
                    <div>{renderPortButton('tech-sw2-aula2', true)}</div>
                  </div>
                </div>

                {/* Switch 3 (Sala de Profesores) — Col 1 header stays empty for SW1->SW3 drop */}
                <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-2 text-white space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-bold truncate">
                      Switch 3 · Profesores
                    </span>
                    <div className="flex justify-end">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          sw3Linked
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {sw3Linked ? '● TRONCAL OK' : '○ SIN TRONCAL'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-sw3-uplink', true)}</div>
                    <div aria-hidden="true" />
                    <div>{renderPortButton('tech-sw3-prof', true)}</div>
                  </div>
                </div>

                {/* SAI (Base 2U): Upper port -> Switches (inner duct), Lower port -> Router (outer duct) */}
                <div className="bg-slate-950 border-2 border-slate-700 rounded-xl p-2 text-white space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div>{renderPortButton('tech-sai-switches', true)}</div>
                    <div className="flex flex-col justify-center">
                      <span className="text-xs sm:text-sm font-bold">
                        SAI (UPS) · Base 2U
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Batería respaldo 230V
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border bg-emerald-950 border-emerald-600 text-emerald-300">
                        ● 230V LISTO
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>{renderPortButton('tech-sai-router', true)}</div>
                    <div aria-hidden="true" />
                    <div aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Patch Panel Estructurado (Aula 1, Aula 2, Sala de Profesores) */}
            <div className="col-span-3 flex flex-col justify-center">
              <div className="bg-white border-2 border-slate-300 rounded-xl p-3.5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                    <Building2
                      className="w-4 h-4 text-indigo-700"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Patch Panels por Zonas
                    </h3>
                    <p className="text-xs text-slate-600">
                      Distribución al centro
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div
                    className={`p-2 rounded-xl border ${
                      aula1On
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="font-bold text-slate-700">PP1</span>
                      <span
                        className={
                          aula1On
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-500'
                        }
                      >
                        {aula1On ? 'ON ●' : 'OFF ○'}
                      </span>
                    </div>
                    {renderPortButton('tech-pp-aula1', true)}
                  </div>

                  <div
                    className={`p-2 rounded-xl border ${
                      aula2On
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="font-bold text-slate-700">PP2</span>
                      <span
                        className={
                          aula2On
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-500'
                        }
                      >
                        {aula2On ? 'ON ●' : 'OFF ○'}
                      </span>
                    </div>
                    {renderPortButton('tech-pp-aula2', true)}
                  </div>

                  <div
                    className={`p-2 rounded-xl border ${
                      profOn
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="font-bold text-slate-700">PP3</span>
                      <span
                        className={
                          profOn
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-500'
                        }
                      >
                        {profOn ? 'ON ●' : 'OFF ○'}
                      </span>
                    </div>
                    {renderPortButton('tech-pp-prof', true)}
                  </div>
                </div>

                {phase3Completed && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>¡Todo el centro educativo conectado!</span>
                  </div>
                )}
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
                Lleva corriente eléctrica desde el SAI al Router y a los Switches.
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
                Conecta Internet, Router, los 3 Switches y los Patch Panels de aulas.
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
