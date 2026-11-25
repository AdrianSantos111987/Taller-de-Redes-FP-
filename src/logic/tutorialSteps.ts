export type TutorialPhaseId = 1 | 2 | 3;

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TutorialStep {
  id: string;
  phase: TutorialPhaseId;
  targetTourId: string;
  title: string;
  body: string;
  solutionChecklist?: string[];
  preferredPlacement?: TooltipPlacement;
}

export interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface TooltipCoords {
  top: number;
  left: number;
  placement: TooltipPlacement;
}

export const TUTORIAL_STEPS_BY_PHASE: Record<TutorialPhaseId, TutorialStep[]> = {
  1: [
    {
      id: 'p1-intro-cards',
      phase: 1,
      targetTourId: 'p1-card-sai',
      title: 'Explora los 7 componentes de la red',
      body: 'Haz clic en cada una de las 7 tarjetas (de la 01 a la 07) para abrir su ficha. Solución para completar esta fase: pulsa las 7 tarjetas hasta ver "Fichas revisadas: 7/7".',
      solutionChecklist: [
        'Revisa SAI, PDU, Router, Switch, Hub, Patch Panel y PCs/Rosetas.',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'p1-hub-note',
      phase: 1,
      targetTourId: 'p1-card-hub',
      title: 'Compara el Hub antiguo frente al Switch',
      body: 'Pulsa la tarjeta "05 · Hub de 8 puertos" para leer la nota educativa amarilla. Explica por qué el Hub provoca colisiones al repetir datos a todos los puertos.',
      preferredPlacement: 'right',
    },
    {
      id: 'p1-detail-sheet',
      phase: 1,
      targetTourId: 'p1-detail-sheet',
      title: 'Lee dónde va colocado cada equipo',
      body: 'En esta ficha tienes la pista clave para montar el rack después: el SAI siempre va en la base (U1–U2) y el Switch va pegado al Patch Panel.',
      preferredPlacement: 'left',
    },
    {
      id: 'p1-next-phase',
      phase: 1,
      targetTourId: 'p1-next-btn',
      title: 'Pasa a la Fase 2 cuando estés listo',
      body: 'Cuando hayas revisado las 7 fichas (o si quieres empezar ya el montaje), pulsa este botón azul para abrir el armario rack de 12U.',
      preferredPlacement: 'bottom',
    },
  ],
  2: [
    {
      id: 'p2-inventory',
      phase: 2,
      targetTourId: 'p2-inventory',
      title: 'Inventario de 6 equipos para el rack',
      body: 'Para instalar un equipo, haz clic sobre su tarjeta (o arrástralo) y luego haz clic en la unidad U del armario donde quieras colocarlo.',
      preferredPlacement: 'left',
    },
    {
      id: 'p2-sai-base',
      phase: 2,
      targetTourId: 'p2-slot-u1',
      title: 'Solución paso 1: SAI en la base (U1–U2)',
      body: 'Selecciona el SAI (UPS) de 2U y haz clic aquí en la guía U1. Ocupará U1 y U2 automáticamente para soportar su peso y dar estabilidad al rack.',
      solutionChecklist: ['SAI (UPS) → U1 (ocupa U1–U2)'],
      preferredPlacement: 'right',
    },
    {
      id: 'p2-pdu-accessible',
      phase: 2,
      targetTourId: 'p2-slot-u3',
      title: 'Solución paso 2: Regleta PDU accesible',
      body: 'Selecciona la Regleta PDU (1U) y colócala justo encima en U3 (o en cualquier unidad superior libre como U12) para poder enchufar todos los equipos.',
      solutionChecklist: ['Regleta PDU → U3'],
      preferredPlacement: 'right',
    },
    {
      id: 'p2-bandeja-router',
      phase: 2,
      targetTourId: 'p2-slot-u6',
      title: 'Solución paso 3: Bandeja metálica y Router',
      body: 'Coloca la Bandeja metálica en U5 y el Router de operadora encima en U6 (o en otra pareja de unidades libres sin solapar otros equipos).',
      solutionChecklist: [
        'Bandeja metálica → U5',
        'Router de operadora → U6',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'p2-patch-switch',
      phase: 2,
      targetTourId: 'p2-slot-u8',
      title: 'Solución paso 4: Patch Panel y Switch juntos',
      body: 'Coloca el Patch Panel 24p en U8 y el Switch 24p justo pegado encima en U9 (adyacentes). Así usarás latiguillos cortos y ordenados.',
      solutionChecklist: [
        'Patch Panel 24p → U8',
        'Switch 24p → U9 (pegados entre sí)',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'p2-validate',
      phase: 2,
      targetTourId: 'p2-validate-btn',
      title: 'Comprueba las 5 normas de taller',
      body: 'Pulsa "Comprobar montaje". Cuando las 5 reglas salgan en verde, la fase quedará superada y aparecerá el botón para ir a cablear la red.',
      preferredPlacement: 'bottom',
    },
  ],
  3: [
    {
      id: 'p3-cable-power',
      phase: 3,
      targetTourId: 'p3-cable-power',
      title: 'Solución 1: Conecta la corriente (Negro/Rojo)',
      body: 'Selecciona "Alimentación Eléctrica" y haz clic en puerto origen → puerto destino para realizar estas 3 conexiones:',
      solutionChecklist: [
        'Salida SAI 1 → Entrada PDU',
        'Toma 1 (PDU) → 230V (Router)',
        'Toma 2 (PDU) → 230V (Switch)',
      ],
      preferredPlacement: 'bottom',
    },
    {
      id: 'p3-cable-fiber',
      phase: 3,
      targetTourId: 'p3-cable-fiber',
      title: 'Solución 2: Entrada de Internet (Amarillo)',
      body: 'Selecciona "Fibra Óptica / WAN (Amarillo)" y conecta la acometida exterior con el Router:',
      solutionChecklist: ['Fibra Operadora (Internet) → WAN (Router)'],
      preferredPlacement: 'bottom',
    },
    {
      id: 'p3-cable-ethernet',
      phase: 3,
      targetTourId: 'p3-cable-ethernet',
      title: 'Solución 3: Une el Router con el Switch (Azul)',
      body: 'Selecciona "Ethernet UTP RJ45 (Azul)" y une la salida LAN del Router con el primer puerto del Switch:',
      solutionChecklist: ['LAN 1 (Router) → P1 (Uplink) (Switch)'],
      preferredPlacement: 'bottom',
    },
    {
      id: 'p3-rack-patch',
      phase: 3,
      targetTourId: 'p3-rack-area',
      title: 'Solución 4: Parchea Switch y Patch Panel (Azul)',
      body: 'Con cable Ethernet azul, lleva la red desde los puertos del Switch hasta los 4 puertos del Patch Panel:',
      solutionChecklist: [
        'P2 → PP 1 · P3 → PP 2',
        'P4 → PP 3 · P5 → PP 4',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'p3-classroom-pcs',
      phase: 3,
      targetTourId: 'p3-classroom-area',
      title: 'Solución 5: Conecta las Rosetas con los 4 PCs',
      body: 'Por la canaleta de pared ya llega cada PP a su Roseta. Con cable Ethernet azul, conecta cada roseta de pared con su ordenador:',
      solutionChecklist: [
        'Roseta 1 → RJ45 PC 1 · Roseta 2 → RJ45 PC 2',
        'Roseta 3 → RJ45 PC 3 · Roseta 4 → RJ45 PC 4',
      ],
      preferredPlacement: 'left',
    },
    {
      id: 'p3-ping',
      phase: 3,
      targetTourId: 'p3-ping-btn',
      title: 'Comprueba la red con el Test Ping',
      body: 'Pulsa "Test de Conectividad (Ping)". Si las 13 conexiones están bien, se encenderán los LEDs verdes del Switch y los 4 PCs tendrán Internet activo.',
      preferredPlacement: 'bottom',
    },
    {
      id: 'p3-challenge',
      phase: 3,
      targetTourId: 'p3-challenge-btn',
      title: 'Reto opcional: Switch frente a Hub',
      body: 'Pulsa este botón para ver viajar paquetes de datos animados: directos al PC destino en el Switch o repetidos con colisiones en el Hub.',
      preferredPlacement: 'bottom',
    },
  ],
};

export function computeTooltipPosition(
  target: RectBox,
  tooltipSize: { width: number; height: number },
  viewport: { width: number; height: number },
  preferred: TooltipPlacement = 'bottom',
  margin = 14
): TooltipCoords {
  const gap = 14;
  const candidates: TooltipPlacement[] = [
    preferred,
    preferred === 'bottom'
      ? 'top'
      : preferred === 'top'
        ? 'bottom'
        : preferred === 'right'
          ? 'left'
          : 'right',
    'bottom',
    'top',
    'right',
    'left',
  ];

  const fits = (pos: TooltipPlacement): { ok: boolean; top: number; left: number } => {
    let top = 0;
    let left = 0;

    if (pos === 'bottom') {
      top = target.bottom + gap;
      left = target.left + target.width / 2 - tooltipSize.width / 2;
    } else if (pos === 'top') {
      top = target.top - tooltipSize.height - gap;
      left = target.left + target.width / 2 - tooltipSize.width / 2;
    } else if (pos === 'right') {
      top = target.top + target.height / 2 - tooltipSize.height / 2;
      left = target.right + gap;
    } else {
      top = target.top + target.height / 2 - tooltipSize.height / 2;
      left = target.left - tooltipSize.width - gap;
    }

    const ok =
      top >= margin &&
      left >= margin &&
      top + tooltipSize.height <= viewport.height - margin &&
      left + tooltipSize.width <= viewport.width - margin;

    return { ok, top, left };
  };

  for (const candidate of candidates) {
    const res = fits(candidate);
    if (res.ok) {
      return {
        top: Math.round(res.top),
        left: Math.round(res.left),
        placement: candidate,
      };
    }
  }

  // Fallback: clamp inside viewport safely
  const fallback = fits(preferred);
  const clampedTop = Math.max(
    margin,
    Math.min(viewport.height - tooltipSize.height - margin, fallback.top)
  );
  const clampedLeft = Math.max(
    margin,
    Math.min(viewport.width - tooltipSize.width - margin, fallback.left)
  );

  return {
    top: Math.round(clampedTop),
    left: Math.round(clampedLeft),
    placement: preferred,
  };
}
