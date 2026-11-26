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
      id: 'p3-mission',
      phase: 3,
      targetTourId: 'p3-mission-banner',
      title: 'Sigue la misión paso a paso (solo 4 pasos)',
      body: 'Aquí arriba verás siempre el paso actual. Completa las 4 conexiones en orden para terminar la práctica.',
      solutionChecklist: [
        'Paso 1: SAI → Router (230V)',
        'Paso 2: Toma Internet → WAN Router',
        'Paso 3: LAN Router → Uplink Switch',
        'Paso 4: Switch → Patch Panel',
      ],
      preferredPlacement: 'bottom',
    },
    {
      id: 'p3-cable-selector',
      phase: 3,
      targetTourId: 'p3-cable-selector',
      title: 'Elige primero el cable abajo',
      body: 'Solo hay 2 cables: Negro (230V) para electricidad en el Paso 1, y Azul (UTP RJ45) para datos de red en los Pasos 2, 3 y 4.',
      preferredPlacement: 'top',
    },
    {
      id: 'p3-rack-ports',
      phase: 3,
      targetTourId: 'p3-rack-area',
      title: 'Pulsa origen y destino (los puertos parpadean)',
      body: 'Los dos puertos del paso actual parpadean suavemente como ayuda. Haz clic en el origen y luego en el destino para dibujar el cable.',
      preferredPlacement: 'right',
    },
  ],
};

export const TECHNICAL_TUTORIAL_STEPS_BY_PHASE: Record<
  TutorialPhaseId,
  TutorialStep[]
> = {
  1: [
    {
      id: 'tech-p1-quiz',
      phase: 1,
      targetTourId: 'p1-card-sai',
      title: 'Modo Técnico · Identifica cada equipo',
      body: 'En este nivel, al pulsar un aparato se abre un reto rápido con 3 opciones. Elige su función correcta a la primera para sumar los puntos completos y desbloquear su ficha.',
      solutionChecklist: [
        'Identifica los 7 componentes para completar la Fase 1.',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'tech-p1-sheet',
      phase: 1,
      targetTourId: 'p1-detail-sheet',
      title: 'Aquí aparecerán las fichas desbloqueadas',
      body: 'Cada equipo validado desbloquea su ficha técnica completa en este panel derecho. Si fallas una opción, verás una pista para volver a intentarlo.',
      preferredPlacement: 'left',
    },
    {
      id: 'tech-p1-next',
      phase: 1,
      targetTourId: 'p1-next-btn',
      title: 'Pasa a la Fase 2 al terminar',
      body: 'Cuando hayas validado los 7 equipos (7/7), pulsa este botón para montar el armario rack de 12U completo.',
      preferredPlacement: 'bottom',
    },
  ],
  2: [
    {
      id: 'tech-p2-inventory',
      phase: 2,
      targetTourId: 'p2-inventory',
      title: 'Llena por completo el armario de 12U (11 equipos)',
      body: 'En Nivel Técnico debes instalar todos los equipos hasta ocupar de U1 a U12: SAI, PDU, 3 Patch Panels, 3 Switches, Pasahilos, Bandeja y Router.',
      preferredPlacement: 'left',
    },
    {
      id: 'tech-p2-sai-base',
      phase: 2,
      targetTourId: 'p2-slot-u1',
      title: '1) SAI abajo del todo (U1–U2)',
      body: 'El SAI va siempre en la base por su gran peso y sus baterías de plomo: así da estabilidad al armario y evita que vuelque.',
      solutionChecklist: ['SAI (UPS) → U1 (ocupa U1–U2)'],
      preferredPlacement: 'right',
    },
    {
      id: 'tech-p2-alternated',
      phase: 2,
      targetTourId: 'p2-slot-u4',
      title: '2) Patch Panels alternados con Switches',
      body: 'Coloca cada Patch Panel pegado a su Switch (ej. PP1 en U4, SW1 en U5, PP2 en U6, SW2 en U7, PP3 en U8, SW3 en U9). Así los latiguillos de conexión entre ambos son cortos y ordenados.',
      solutionChecklist: [
        'PDU en U3 · Parejas PP+SW en U4–U9 · Pasahilos/Bandeja en U10–U11',
      ],
      preferredPlacement: 'right',
    },
    {
      id: 'tech-p2-router-top',
      phase: 2,
      targetTourId: 'p2-slot-u12',
      title: '3) Router en la parte superior (U10–U12)',
      body: 'El Router de operadora se coloca en la parte alta del rack para recibir cómodamente la acometida externa que entra por el techo o canaleta superior.',
      solutionChecklist: ['Router de operadora → U10, U11 o U12'],
      preferredPlacement: 'right',
    },
    {
      id: 'tech-p2-validate',
      phase: 2,
      targetTourId: 'p2-validate-btn',
      title: 'Comprueba las 5 normas técnicas',
      body: 'Pulsa "Comprobar montaje" cuando hayas llenado las 12 unidades U para pasar al cableado de las aulas.',
      preferredPlacement: 'bottom',
    },
  ],
  3: [
    {
      id: 'tech-p3-mission',
      phase: 3,
      targetTourId: 'p3-mission-banner',
      title: 'Cableado de centro educativo en 8 pasos',
      body: 'Sigue la misión de arriba paso a paso: corriente del SAI a Router y Switches, Internet al Router, troncal entre Switches y salida hacia Aula 1, Aula 2 y Sala de Profesores.',
      preferredPlacement: 'bottom',
    },
    {
      id: 'tech-p3-cable',
      phase: 3,
      targetTourId: 'p3-cable-selector',
      title: 'Elige Negro (230V) o Azul (Datos RJ45)',
      body: 'Pasos 1 y 2 usan el cable Negro (230V). Del Paso 3 al 8 usa el cable Azul de red UTP RJ45.',
      preferredPlacement: 'top',
    },
    {
      id: 'tech-p3-ports',
      phase: 3,
      targetTourId: 'p3-rack-area',
      title: 'Pulsa los puertos que parpadean',
      body: 'Los puertos de cada paso parpadean suavemente como ayuda. En el Paso 5 enlazarás Switch 1 con Switch 2 y con Switch 3.',
      preferredPlacement: 'right',
    },
  ],
};

export function getTutorialSteps(
  phase: TutorialPhaseId,
  difficulty: 'principiante' | 'tecnico' = 'principiante'
): TutorialStep[] {
  return difficulty === 'tecnico'
    ? TECHNICAL_TUTORIAL_STEPS_BY_PHASE[phase]
    : TUTORIAL_STEPS_BY_PHASE[phase];
}

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
