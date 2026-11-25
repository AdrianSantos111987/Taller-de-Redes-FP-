import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Cable,
  Check,
  CheckCircle2,
  Cloud,
  Monitor,
  Plug,
  PlugZap,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  CableConnection,
  CableType,
  canConnectPorts,
  ConnectivityResult,
  getPortById,
  isPortCompatibleWithCable,
  isPortOccupied,
  NETWORK_PORTS,
  NetworkPort,
  validateConnectivity,
} from '../logic/networkValidation';
import { PlacedRackItem } from '../logic/rackValidation';

interface Phase3NetworkWiringProps {
  placedRackItems: PlacedRackItem[];
  rackValidated: boolean;
  cables: CableConnection[];
  pingResult: ConnectivityResult | null;
  onAddCable: (
    type: CableType,
    fromPortId: string,
    toPortId: string
  ) => string | undefined;
  onRemoveCable: (cableId: string) => void;
  onClearCables: () => void;
  onLoadSampleForChallenge: () => void;
  onRunPing: () => void;
  onChallengeExplored?: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface CableOption {
  type: CableType;
  nombre: string;
  colorLabel: string;
  descripcion: string;
  stroke: string;
  badgeBg: string;
  expectedCount: number;
}

const CABLE_OPTIONS: CableOption[] = [
  {
    type: 'power',
    nombre: '1. Alimentación Eléctrica',
    colorLabel: 'Negro/Rojo',
    descripcion: 'SAI → Entrada PDU, y PDU → Router y Switch.',
    stroke: '#1E293B',
    badgeBg: 'bg-slate-800',
    expectedCount: 3,
  },
  {
    type: 'fiber',
    nombre: '2. Fibra Óptica / WAN',
    colorLabel: 'Amarillo',
    descripcion: 'Internet (Fibra Operadora) → puerto WAN del Router.',
    stroke: '#EAB308',
    badgeBg: 'bg-amber-400',
    expectedCount: 1,
  },
  {
    type: 'ethernet',
    nombre: '3. Ethernet UTP RJ45',
    colorLabel: 'Azul',
    descripcion: 'Router → Switch → Patch Panel, y Rosetas → PCs.',
    stroke: '#0284C7',
    badgeBg: 'bg-sky-600',
    expectedCount: 9,
  },
];

function getBezierControls(
  p1: Point,
  p2: Point,
  cableType?: CableType,
  fromPortId?: string,
  toPortId?: string
): [Point, Point, Point, Point] {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);

  // Horizontal same-row connection (Roseta -> PC): gentle downward arc below port labels
  if (dy < 22 && dx > 30) {
    const dip = 22;
    return [
      p1,
      { x: p1.x + (p2.x - p1.x) * 0.28, y: p1.y + dip },
      { x: p1.x + (p2.x - p1.x) * 0.72, y: p2.y + dip },
      p2,
    ];
  }

  // Aligned vertical short patch cord (e.g. Switch P2..P5 <-> Patch Panel PP1..PP4)
  if (dx < 36 && dy > 16 && cableType === 'ethernet') {
    const curveX = p1.x + (p2.x - p1.x) * 0.5;
    return [
      p1,
      { x: curveX, y: p1.y + (p2.y - p1.y) * 0.35 },
      { x: curveX, y: p1.y + (p2.y - p1.y) * 0.65 },
      p2,
    ];
  }

  // Power cables: route cleanly along the right-side electrical channel of the rack
  if (cableType === 'power') {
    const channelX = Math.max(p1.x, p2.x) + 34 + (dy % 18);
    return [p1, { x: channelX, y: p1.y }, { x: channelX, y: p2.y }, p2];
  }

  // Router LAN -> Switch Uplink or Fiber WAN -> Internet: clean left-side channel
  const isLeftChannel =
    cableType === 'fiber' ||
    fromPortId === 'router-lan' ||
    toPortId === 'router-lan';
  if (isLeftChannel && dx < 180) {
    const channelX = Math.min(p1.x, p2.x) - 34;
    return [p1, { x: channelX, y: p1.y }, { x: channelX, y: p2.y }, p2];
  }

  // General rack-internal diagonal ethernet cables
  if (dx < 190 && dy > 24) {
    const channelX = Math.min(p1.x, p2.x) - 30 - (dy % 16);
    return [p1, { x: channelX, y: p1.y }, { x: channelX, y: p2.y }, p2];
  }

  const offset = Math.max(40, Math.min(120, dx * 0.45 + dy * 0.1));
  return [
    p1,
    { x: p1.x + (p2.x >= p1.x ? offset : -offset * 0.6), y: p1.y },
    { x: p2.x - (p2.x >= p1.x ? offset : -offset * 0.6), y: p2.y },
    p2,
  ];
}

function computeBezierPath(
  p1: Point,
  p2: Point,
  cableType?: CableType,
  fromPortId?: string,
  toPortId?: string
): string {
  const [a, b, c, d] = getBezierControls(p1, p2, cableType, fromPortId, toPortId);
  return `M ${a.x} ${a.y} C ${b.x} ${b.y}, ${c.x} ${c.y}, ${d.x} ${d.y}`;
}

function evalCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x:
      mt2 * mt * p0.x +
      3 * mt2 * t * p1.x +
      3 * mt * t2 * p2.x +
      t2 * t * p3.x,
    y:
      mt2 * mt * p0.y +
      3 * mt2 * t * p1.y +
      3 * mt * t2 * p2.y +
      t2 * t * p3.y,
  };
}

export const Phase3NetworkWiring: React.FC<Phase3NetworkWiringProps> = ({
  placedRackItems,
  rackValidated,
  cables,
  pingResult,
  onAddCable,
  onRemoveCable,
  onClearCables,
  onLoadSampleForChallenge,
  onRunPing,
  onChallengeExplored,
}) => {
  const [selectedCableType, setSelectedCableType] =
    useState<CableType>('power');
  const [selectedOriginPort, setSelectedOriginPort] = useState<string | null>(
    null
  );
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [wiringFeedback, setWiringFeedback] = useState<string | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeDevice, setChallengeDevice] = useState<'switch' | 'hub'>(
    'switch'
  );
  const [targetPc, setTargetPc] = useState<1 | 2 | 3 | 4>(2);
  const [packetDemoTick, setPacketDemoTick] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const portRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [portCoords, setPortCoords] = useState<Map<string, Point>>(new Map());
  const packetLayerRef = useRef<SVGGElement | null>(null);

  // Live connectivity progress so students see step-by-step completion
  const liveDiag = useMemo(() => validateConnectivity(cables), [cables]);

  const cableCounts = useMemo(
    () => ({
      power: cables.filter((c) => c.type === 'power').length,
      fiber: cables.filter((c) => c.type === 'fiber').length,
      ethernet: cables.filter((c) => c.type === 'ethernet').length,
    }),
    [cables]
  );

  // Valid destinations when an origin port is selected
  const validTargetPorts = useMemo(() => {
    const valid = new Set<string>();
    if (!selectedOriginPort) return valid;
    for (const p of NETWORK_PORTS) {
      if (canConnectPorts(cables, selectedCableType, selectedOriginPort, p.id).ok) {
        valid.add(p.id);
      }
    }
    return valid;
  }, [cables, selectedCableType, selectedOriginPort]);

  // Order rack devices top-to-bottom from Fase 2 placement, or standard clean order
  const rackOrder = useMemo(() => {
    const defaultOrder: ('router' | 'switch' | 'patch_panel' | 'pdu' | 'sai')[] =
      ['router', 'switch', 'patch_panel', 'pdu', 'sai'];
    if (placedRackItems.length < 4) return defaultOrder;

    const sorted = [...placedRackItems]
      .filter((i) => i.id !== 'bandeja')
      .sort((a, b) => b.bottomU - a.bottomU)
      .map((i) => i.id as 'router' | 'switch' | 'patch_panel' | 'pdu' | 'sai');

    for (const d of defaultOrder) {
      if (!sorted.includes(d)) sorted.push(d);
    }
    return sorted;
  }, [placedRackItems]);

  const measurePorts = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const next = new Map<string, Point>();
    portRefs.current.forEach((el, portId) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      next.set(portId, {
        x: r.left - stageRect.left + r.width / 2,
        y: r.top - stageRect.top + r.height / 2,
      });
    });
    setPortCoords(next);
  }, []);

  useLayoutEffect(() => {
    measurePorts();
  }, [measurePorts, rackOrder, cables, challengeOpen, pingResult]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => measurePorts());
    observer.observe(stage);
    window.addEventListener('resize', measurePorts);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measurePorts);
    };
  }, [measurePorts]);

  // Animate packet simulation in Challenge Mode
  useEffect(() => {
    if (!challengeOpen) return;
    const svgGroup = packetLayerRef.current;
    if (!svgGroup) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - start) % 2800;
      const progress = elapsed / 2800;

      const dots = svgGroup.querySelectorAll<SVGCircleElement>('[data-packet-seg]');
      dots.forEach((dot) => {
        const fromId = dot.getAttribute('data-from');
        const toId = dot.getAttribute('data-to');
        const phaseOffset = Number(dot.getAttribute('data-phase') ?? '0');
        const span = Number(dot.getAttribute('data-span') ?? '0.33');
        if (!fromId || !toId) return;

        const p1 = portCoords.get(fromId);
        const p2 = portCoords.get(toId);
        if (!p1 || !p2) {
          dot.setAttribute('opacity', '0');
          return;
        }

        const localT = (progress - phaseOffset) / span;
        if (localT < 0 || localT > 1) {
          dot.setAttribute('opacity', '0');
          return;
        }

        const segType = dot.getAttribute('data-ctype') as CableType | null;
        const [a, b, c, d] = getBezierControls(
          p1,
          p2,
          segType ?? 'ethernet',
          fromId,
          toId
        );
        const pos = evalCubicBezier(a, b, c, d, localT);
        dot.setAttribute('cx', String(pos.x));
        dot.setAttribute('cy', String(pos.y));
        dot.setAttribute('opacity', '1');
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [challengeOpen, challengeDevice, targetPc, portCoords, packetDemoTick]);

  const registerPortRef = useCallback(
    (portId: string) => (el: HTMLButtonElement | null) => {
      if (el) portRefs.current.set(portId, el);
      else portRefs.current.delete(portId);
    },
    []
  );

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedOriginPort || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    });
  };

  const handlePortClick = (port: NetworkPort) => {
    setWiringFeedback(null);

    if (!selectedOriginPort) {
      if (isPortOccupied(cables, port.id)) {
        const existing = cables.find(
          (c) => c.fromPortId === port.id || c.toPortId === port.id
        );
        if (existing) {
          onRemoveCable(existing.id);
          setWiringFeedback(
            `Cable desconectado de ${port.label} (${port.deviceLabel}).`
          );
        }
        return;
      }

      // Auto-help: if the student clicks a port of a different cable type, automatically switch to that cable type so they never get stuck!
      if (!isPortCompatibleWithCable(port, selectedCableType)) {
        const autoType: CableType =
          port.category === 'fiber'
            ? 'fiber'
            : port.category === 'ethernet'
              ? 'ethernet'
              : 'power';
        setSelectedCableType(autoType);
      }

      setSelectedOriginPort(port.id);
      return;
    }

    if (selectedOriginPort === port.id) {
      setSelectedOriginPort(null);
      setMousePos(null);
      return;
    }

    const err = onAddCable(selectedCableType, selectedOriginPort, port.id);
    if (err) {
      setWiringFeedback(err);
      setSelectedOriginPort(null);
      setMousePos(null);
      return;
    }

    setSelectedOriginPort(null);
    setMousePos(null);
    setWiringFeedback(null);
  };

  const originPortObj = selectedOriginPort
    ? getPortById(selectedOriginPort)
    : undefined;

  const renderPortButton = (portId: string, compact = false) => {
    const port = getPortById(portId);
    if (!port) return null;

    const occupied = isPortOccupied(cables, portId);
    const isOrigin = selectedOriginPort === portId;
    const isValidTarget = validTargetPorts.has(portId);
    const isDimmed =
      Boolean(selectedOriginPort) && !isOrigin && !isValidTarget;
    const isSwitchLedOn =
      pingResult?.activeSwitchPorts.includes(portId) ?? false;

    const baseStyle =
      port.category === 'fiber'
        ? 'border-amber-500 bg-amber-50 text-amber-950 hover:bg-amber-100'
        : port.category === 'ethernet'
          ? 'border-sky-600 bg-sky-50 text-sky-950 hover:bg-sky-100'
          : 'border-slate-600 bg-slate-100 text-slate-900 hover:bg-slate-200';

    const stateClass = isOrigin
      ? 'ring-3 ring-sky-500 border-sky-700 bg-sky-100 scale-105 shadow-sm'
      : isValidTarget
        ? 'ring-3 ring-emerald-500 border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
        : occupied
          ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
          : isDimmed
            ? `${baseStyle} opacity-45`
            : baseStyle;

    return (
      <button
        key={portId}
        ref={registerPortRef(portId)}
        type="button"
        onClick={() => handlePortClick(port)}
        aria-label={`Puerto ${port.label} de ${port.deviceLabel}${
          occupied
            ? ' (conectado, clic para desconectar)'
            : isValidTarget
              ? ' (destino válido, clic para conectar)'
              : ''
        }`}
        data-testid={`port-${portId}`}
        className={`relative z-30 px-2.5 py-1.5 rounded-md border text-[11px] font-mono font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 flex items-center justify-center gap-1.5 ${
          compact ? 'min-h-[38px]' : 'min-h-[42px]'
        } ${stateClass}`}
        title={
          occupied
            ? `${port.label} conectado (haz clic para quitar el cable)`
            : isValidTarget
              ? `Haz clic para conectar aquí (${port.label})`
              : `Conectar ${port.label} (${port.deviceLabel})`
        }
      >
        {port.deviceId === 'switch' && port.category === 'ethernet' && (
          <span
            data-testid={`led-${portId}`}
            className={`w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 ${
              isSwitchLedOn ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            aria-hidden="true"
          />
        )}
        {(port.category === 'power_in' || port.category === 'power_source') && (
          <Plug className="w-3 h-3 shrink-0 opacity-75" aria-hidden="true" />
        )}
        <span className="whitespace-nowrap">{port.label}</span>
      </button>
    );
  };

  // Packet animation paths for Challenge mode
  const packetSegments = useMemo(() => {
    if (!challengeOpen) return [];
    const segs: {
      id: string;
      from: string;
      to: string;
      phase: number;
      span: number;
      isCollision?: boolean;
    }[] = [
      { id: 'wan', from: 'internet-fiber', to: 'router-wan', phase: 0, span: 0.25 },
      { id: 'r-sw', from: 'router-lan', to: 'switch-p1', phase: 0.25, span: 0.25 },
    ];

    const targets: (1 | 2 | 3 | 4)[] =
      challengeDevice === 'switch' ? [targetPc] : [1, 2, 3, 4];

    for (const pcIdx of targets) {
      const switchPort = `switch-p${pcIdx + 1}`;
      const ppPort = `pp-${pcIdx}`;
      const rosetaPort = `roseta-${pcIdx}`;
      const pcPort = `pc-${pcIdx}`;
      const isCollision = challengeDevice === 'hub' && pcIdx !== targetPc;

      segs.push({
        id: `sw-pp-${pcIdx}`,
        from: switchPort,
        to: ppPort,
        phase: 0.5,
        span: 0.25,
        isCollision,
      });
      segs.push({
        id: `ros-pc-${pcIdx}`,
        from: rosetaPort,
        to: pcPort,
        phase: 0.75,
        span: 0.25,
        isCollision,
      });
    }
    return segs;
  }, [challengeOpen, challengeDevice, targetPc]);

  const allCablesReadyForPing = cables.length >= 13;

  const guidedChecklist = [
    {
      id: 'chk-power',
      label: 'Corriente (Negro/Rojo): SAI → PDU → Router y Switch',
      done: liveDiag.pduPowered && liveDiag.routerPowered && liveDiag.switchPowered,
      cableType: 'power' as CableType,
    },
    {
      id: 'chk-fiber',
      label: 'Fibra (Amarillo): Internet → Router WAN',
      done: liveDiag.wanConnected,
      cableType: 'fiber' as CableType,
    },
    {
      id: 'chk-uplink',
      label: 'Ethernet (Azul): Router LAN 1 → Switch P1',
      done: liveDiag.routerToSwitchConnected,
      cableType: 'ethernet' as CableType,
    },
    {
      id: 'chk-patch',
      label: 'Ethernet (Azul): Switch P2..P5 → Patch Panel PP 1..4',
      done: liveDiag.pcStatuses.every((s) => s.patchConnected),
      cableType: 'ethernet' as CableType,
    },
    {
      id: 'chk-aula',
      label: 'Ethernet (Azul): Rosetas 1..4 → PCs 1..4',
      done: liveDiag.pcStatuses.every((s) => s.wallToPcConnected),
      cableType: 'ethernet' as CableType,
    },
  ];

  const originCoord = selectedOriginPort
    ? portCoords.get(selectedOriginPort)
    : undefined;

  return (
    <section
      aria-labelledby="phase3-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5"
    >
      {/* Header & Primary Action Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-mono text-sky-700 font-semibold mb-1">
            FASE 3 · SIMULADOR DE CABLEADO
          </p>
          <h2
            id="phase3-heading"
            className="text-2xl font-bold text-slate-900 tracking-tight"
          >
            Conecta la corriente y los cables de red del aula
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Haz clic en un puerto de origen: los destinos válidos se iluminarán en verde al instante. Haz clic en el destino para tender el cable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setChallengeOpen((v) => !v);
              setPacketDemoTick((t) => t + 1);
            }}
            aria-expanded={challengeOpen}
            data-tour="p3-challenge-btn"
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              challengeOpen
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Reto: ¿Qué pasa si usamos un Hub en vez de un Switch?</span>
          </button>

          <button
            type="button"
            onClick={onRunPing}
            data-tour="p3-ping-btn"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <Activity className="w-4 h-4" aria-hidden="true" />
            <span>Test de Conectividad (Ping)</span>
          </button>
        </div>
      </div>

      {!rackValidated && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-950 flex items-center gap-2">
          <AlertTriangle
            className="w-4 h-4 text-amber-700 shrink-0"
            aria-hidden="true"
          />
          <span>
            Nota: Puedes cablear ya, pero te recomendamos completar y comprobar el montaje del armario en la{' '}
            <strong>Fase 2</strong> para usar tu propia distribución.
          </span>
        </div>
      )}

      {/* Cable Type Selector + Live Step Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cable className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>Elige el cable o haz clic directo en cualquier puerto para conectarlo</span>
          </h3>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
            <span>Cables tendidos: {cables.length}/13</span>
            {cables.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearCables();
                  setSelectedOriginPort(null);
                  setMousePos(null);
                  setWiringFeedback(null);
                }}
                className="text-rose-700 hover:underline font-sans font-semibold cursor-pointer"
              >
                Quitar todos
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CABLE_OPTIONS.map((opt) => {
            const active = selectedCableType === opt.type;
            const count = cableCounts[opt.type];
            const complete = count >= opt.expectedCount;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setSelectedCableType(opt.type);
                  setSelectedOriginPort(null);
                  setMousePos(null);
                  setWiringFeedback(null);
                }}
                aria-pressed={active}
                data-testid={`cable-select-${opt.type}`}
                data-tour={`p3-cable-${opt.type}`}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 flex items-start gap-2.5 ${
                  active
                    ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-600/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border border-black/10 ${opt.badgeBg}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 leading-snug">
                      {opt.nombre} ({opt.colorLabel})
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold shrink-0 ${
                        complete ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {count}/{opt.expectedCount}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                    {opt.descripcion}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Checklist Strip so students always know what remains */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {guidedChecklist.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setSelectedCableType(step.cableType);
                setSelectedOriginPort(null);
                setMousePos(null);
              }}
              className={`text-left px-2.5 py-2 rounded-lg border text-xs flex items-start gap-2 transition-colors cursor-pointer ${
                step.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-400'
              }`}
            >
              {step.done ? (
                <Check
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <span className="leading-tight font-medium">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Live Selection / Error Prompt */}
        {(selectedOriginPort || wiringFeedback) && (
          <div
            role="status"
            className={`mt-3 p-3 rounded-lg border text-sm flex items-center justify-between gap-2 ${
              wiringFeedback
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {wiringFeedback ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
              )}
              <span>
                {wiringFeedback ??
                  `Origen: ${originPortObj?.label} (${originPortObj?.deviceLabel}). Haz clic en uno de los puertos iluminados en verde para conectar.`}
              </span>
            </div>
            {selectedOriginPort && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOriginPort(null);
                  setMousePos(null);
                }}
                className="text-xs font-semibold underline cursor-pointer shrink-0"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional Challenge Drawer: Switch vs Hub Packet Simulation */}
      {challengeOpen && (
        <div
          className="mb-4 bg-white border border-amber-300 rounded-xl p-4"
          data-testid="hub-switch-challenge"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reto interactivo: Switch (actual) frente a Hub (antiguo)
              </h3>
              <p className="text-sm text-slate-600">
                Observa las bolitas de datos viajando por los cables al enviar un archivo desde Internet hasta un PC concreto.
              </p>
            </div>

            {!allCablesReadyForPing && (
              <button
                type="button"
                onClick={onLoadSampleForChallenge}
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-semibold rounded-lg border border-amber-300 cursor-pointer"
              >
                Cargar cableado completo para ver la animación
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setChallengeDevice('switch');
                  setPacketDemoTick((t) => t + 1);
                }}
                aria-pressed={challengeDevice === 'switch'}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                  challengeDevice === 'switch'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Modo Switch (Inteligente)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChallengeDevice('hub');
                  setPacketDemoTick((t) => t + 1);
                  onChallengeExplored?.();
                }}
                aria-pressed={challengeDevice === 'hub'}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                  challengeDevice === 'hub'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Modo Hub (Repetidor antiguo)
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span>Destino del paquete:</span>
              {([1, 2, 3, 4] as const).map((pc) => (
                <button
                  key={pc}
                  type="button"
                  onClick={() => {
                    setTargetPc(pc);
                    setPacketDemoTick((t) => t + 1);
                  }}
                  aria-pressed={targetPc === pc}
                  className={`px-3 py-1.5 rounded-md border font-mono cursor-pointer ${
                    targetPc === pc
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  PC {pc}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`mt-2.5 p-2.5 rounded-lg border text-sm flex items-center gap-2.5 ${
              challengeDevice === 'switch'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            {challengeDevice === 'switch' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>
              {challengeDevice === 'switch'
                ? `Con el Switch, el paquete destinado a PC ${targetPc} va directo únicamente por el puerto P${targetPc + 1} hacia la Roseta ${targetPc}. Sin colisiones.`
                : `¡Colisión y saturación con el Hub! Aunque el mensaje era solo para PC ${targetPc}, el Hub lo copia y lo repite a los 4 PCs a la vez.`}
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Schematic Stage */}
      <div
        ref={stageRef}
        onMouseMove={handleStageMouseMove}
        className="relative technical-grid border border-slate-300 rounded-xl p-4 sm:p-6 overflow-x-auto"
        data-testid="wiring-stage"
      >
        {/* Background SVG Layer for Structural Wall Conduits */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          aria-hidden="true"
        >
          {[1, 2, 3, 4].map((idx) => {
            const p1 = portCoords.get(`pp-${idx}`);
            const p2 = portCoords.get(`roseta-${idx}`);
            if (!p1 || !p2) return null;
            return (
              <path
                key={`wall-${idx}`}
                d={computeBezierPath(p1, p2, 'ethernet', `pp-${idx}`, `roseta-${idx}`)}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="6 6"
                opacity="0.55"
              />
            );
          })}
        </svg>

        {/* Middle SVG Layer for Cables & Ghost Wire (behind port buttons z-30, over rack cards z-15) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          aria-hidden="true"
        >
          {/* Live Ghost Cable Preview following cursor */}
          {selectedOriginPort && originCoord && mousePos && (
            <path
              d={computeBezierPath(
                originCoord,
                mousePos,
                selectedCableType,
                selectedOriginPort
              )}
              fill="none"
              stroke={
                selectedCableType === 'fiber'
                  ? '#EAB308'
                  : selectedCableType === 'ethernet'
                    ? '#0284C7'
                    : '#1E293B'
              }
              strokeWidth="3.5"
              strokeDasharray="7 6"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {cables.map((cable) => {
            const p1 = portCoords.get(cable.fromPortId);
            const p2 = portCoords.get(cable.toPortId);
            if (!p1 || !p2) return null;

            const pathD = computeBezierPath(
              p1,
              p2,
              cable.type,
              cable.fromPortId,
              cable.toPortId
            );
            const strokeColor =
              cable.type === 'fiber'
                ? '#EAB308'
                : cable.type === 'ethernet'
                  ? '#0284C7'
                  : '#1E293B';

            return (
              <g key={cable.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {cable.type === 'power' && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="1.75"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {challengeOpen && (
            <g ref={packetLayerRef}>
              {packetSegments.map((seg) => (
                <circle
                  key={`${seg.id}-${challengeDevice}-${targetPc}`}
                  data-packet-seg={seg.id}
                  data-from={seg.from}
                  data-to={seg.to}
                  data-ctype={seg.id === 'wan' ? 'fiber' : 'ethernet'}
                  data-phase={seg.phase}
                  data-span={seg.span}
                  r={seg.isCollision ? '7' : '6'}
                  fill={seg.isCollision ? '#DC2626' : '#10B981'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0"
                />
              ))}
            </g>
          )}
        </svg>

        {/* Three-Column Schematic Grid with generous cable gutters */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-[820px]">
          {/* Left Column: Internet Cloud + Mounted Rack with left/right cable margins */}
          <div className="lg:col-span-6 space-y-4 px-8">
            {/* Internet Operadora Box */}
            <div className="relative bg-white border border-slate-300 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center">
                  <Cloud
                    className="w-5 h-5 text-amber-600"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Internet (Fibra de Operadora)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Acometida exterior · Conectar al puerto WAN del Router
                  </p>
                </div>
              </div>
              {renderPortButton('internet-fiber')}
            </div>

            {/* Mounted 19" Rack */}
            <div
              className="relative bg-slate-800 border-4 border-slate-700 rounded-xl p-4 space-y-4"
              data-tour="p3-rack-area"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>ARMARIO RACK 19&quot; · LADO DATOS (IZQ/CENTRO)</span>
                <span>ALIMENTACIÓN 230V (DER)</span>
              </div>

              {rackOrder.map((deviceId) => {
                if (deviceId === 'router') {
                  return (
                    <div
                      key="router"
                      className="bg-white border border-slate-300 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          Router de operadora
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            pingResult
                              ? pingResult.routerPowered
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {pingResult
                            ? pingResult.routerPowered
                              ? '● ENCENDIDO'
                              : '○ SIN CORRIENTE'
                            : '1U'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {renderPortButton('router-wan', true)}
                          {renderPortButton('router-lan', true)}
                        </div>
                        {renderPortButton('router-pwr', true)}
                      </div>
                    </div>
                  );
                }

                if (deviceId === 'switch') {
                  const isHub = challengeOpen && challengeDevice === 'hub';
                  return (
                    <div
                      key="switch"
                      className={`border rounded-lg p-3 transition-colors ${
                        isHub
                          ? 'bg-rose-50 border-rose-400'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-bold ${
                            isHub ? 'text-rose-950' : 'text-white'
                          }`}
                        >
                          {isHub
                            ? 'Hub 8 puertos (Modo Reto Antiguo)'
                            : 'Switch 24 puertos (Conmutador)'}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            pingResult
                              ? pingResult.switchPowered
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                              : isHub
                                ? 'text-rose-700'
                                : 'text-slate-400'
                          }`}
                        >
                          {pingResult
                            ? pingResult.switchPowered
                              ? '● ACTIVO'
                              : '○ SIN CORRIENTE'
                            : '1U'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {renderPortButton('switch-p1', true)}
                          <div className="grid grid-cols-4 gap-1.5 pl-1 border-l border-slate-700">
                            {renderPortButton('switch-p2', true)}
                            {renderPortButton('switch-p3', true)}
                            {renderPortButton('switch-p4', true)}
                            {renderPortButton('switch-p5', true)}
                          </div>
                        </div>
                        {renderPortButton('switch-pwr', true)}
                      </div>
                    </div>
                  );
                }

                if (deviceId === 'patch_panel') {
                  return (
                    <div
                      key="patch_panel"
                      className="bg-slate-100 border border-slate-300 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          Patch Panel 24p (Conectado por pared a Rosetas 1–4)
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Pasivo · 1U
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500 w-[88px] shrink-0">
                            AULA 1–4 →
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {renderPortButton('pp-1', true)}
                            {renderPortButton('pp-2', true)}
                            {renderPortButton('pp-3', true)}
                            {renderPortButton('pp-4', true)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (deviceId === 'pdu') {
                  return (
                    <div
                      key="pdu"
                      className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <PlugZap
                            className="w-3.5 h-3.5 text-rose-400"
                            aria-hidden="true"
                          />
                          <span>Regleta PDU (Distribución 230V)</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-300">
                          1U
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {renderPortButton('pdu-in', true)}
                        {renderPortButton('pdu-out-1', true)}
                        {renderPortButton('pdu-out-2', true)}
                        {renderPortButton('pdu-out-3', true)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key="sai"
                    className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">
                        SAI (UPS) · Base 2U (Enchufado a pared 230V)
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        230V OK
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {renderPortButton('sai-out-1', true)}
                      {renderPortButton('sai-out-2', true)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Wall Conduit Label */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center self-stretch text-center">
            <div className="relative bg-white/95 border border-slate-300 rounded-lg px-2 py-3 text-[11px] font-mono text-slate-600 shadow-xs">
              Canaleta fija de pared (PP1–4 ↔ Rosetas 1–4)
            </div>
          </div>

          {/* Right Column: 4 Classroom PCs + Wall Sockets */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className="relative bg-white border border-slate-300 rounded-xl p-4"
              data-tour="p3-classroom-area"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Puestos del Aula (Une cada Roseta con su PC)
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  4 equipos
                </span>
              </div>

              <div className="space-y-4">
                {([1, 2, 3, 4] as const).map((idx) => {
                  const pcStatus = pingResult?.pcStatuses.find(
                    (s) => s.pcIndex === idx
                  );
                  const isPcOnline = pcStatus?.connectedToInternet ?? false;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 pb-6 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                        isPcOnline
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                      data-testid={`classroom-pc-${idx}`}
                    >
                      {/* Wall Socket (Roseta) */}
                      <div className="shrink-0">
                        {renderPortButton(`roseta-${idx}`, true)}
                      </div>

                      {/* Desk PC info centered */}
                      <div className="text-center flex-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                          <Monitor
                            className="w-4 h-4 text-slate-700"
                            aria-hidden="true"
                          />
                          <span>PC {idx}</span>
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            pingResult
                              ? isPcOnline
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {pingResult
                            ? isPcOnline
                              ? 'Internet activo'
                              : 'Sin conexión'
                            : 'Enchufado en aula'}
                        </div>
                      </div>

                      {/* PC RJ45 Socket */}
                      <div className="shrink-0">
                        {renderPortButton(`pc-${idx}`, true)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ping Diagnostic Result Card */}
            <div
              className="relative bg-white border border-slate-200 rounded-xl p-4"
              data-testid="ping-diagnostic-panel"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Diagnóstico del Test de Conectividad (Ping)
              </h3>

              {!pingResult ? (
                <p className="text-sm text-slate-600">
                  Cuando completes las conexiones de arriba, pulsa{' '}
                  <strong className="text-slate-900">
                    &quot;Test de Conectividad (Ping)&quot;
                  </strong>{' '}
                  para verificar si los 4 PCs salen a Internet.
                </p>
              ) : pingResult.allConnected ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-sm font-bold">
                      Conexión a Internet activa en los 4 PCs
                    </div>
                    <p className="text-xs text-emerald-900 mt-1">
                      Todos los puertos del Switch muestran LED verde, la alimentación pasa por el SAI y la PDU, y el aula navega correctamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-950 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle
                      className="w-4 h-4 text-rose-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Fallo en el test Ping: revisa las siguientes conexiones pendientes:
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {pingResult.issues.map((issue) => (
                      <li
                        key={issue.code}
                        className="text-xs text-rose-900 bg-rose-50/60 border border-rose-200 rounded-md px-3 py-2 flex items-center gap-2"
                      >
                        <span className="font-mono font-bold text-rose-700">
                          [!]
                        </span>
                        <span>{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Connected Cables List */}
            {cables.length > 0 && (
              <div className="relative bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-700 mb-2">
                  Cables conectados ({cables.length})
                </h3>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {cables.map((c) => {
                    const p1 = getPortById(c.fromPortId);
                    const p2 = getPortById(c.toPortId);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded bg-slate-50 border border-slate-200"
                      >
                        <span className="text-slate-700 truncate">
                          <strong className="font-mono">
                            {c.type === 'fiber'
                              ? 'Fibra'
                              : c.type === 'ethernet'
                                ? 'UTP'
                                : '230V'}
                          </strong>
                          {' · '}
                          {p1?.deviceLabel} ({p1?.label}) ↔ {p2?.deviceLabel} (
                          {p2?.label})
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveCable(c.id)}
                          aria-label={`Desconectar cable entre ${p1?.label} y ${p2?.label}`}
                          className="p-1 text-slate-500 hover:text-rose-700 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
