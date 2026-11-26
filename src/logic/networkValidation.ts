export type CableType = 'power' | 'ethernet';

export interface NetworkPort {
  id: string;
  label: string;
  sublabel: string;
  deviceId: 'internet' | 'router' | 'switch' | 'patch_panel' | 'sai';
  deviceLabel: string;
  expectedCable: CableType;
}

export interface CableConnection {
  id: string;
  type: CableType;
  fromPortId: string;
  toPortId: string;
  stepNumber: 1 | 2 | 3 | 4;
}

export interface GuidedWiringStep {
  stepNumber: 1 | 2 | 3 | 4;
  title: string;
  missionText: string;
  requiredCable: CableType;
  fromPortId: string;
  toPortId: string;
  successMessage: string;
}

export const TOTAL_EXPECTED_CABLES = 4;

export const NETWORK_PORTS: NetworkPort[] = [
  {
    id: 'sai-out',
    label: 'Salida 230V',
    sublabel: 'Corriente SAI',
    deviceId: 'sai',
    deviceLabel: 'SAI (UPS)',
    expectedCable: 'power',
  },
  {
    id: 'router-pwr',
    label: 'Entrada 230V',
    sublabel: 'Alimentación',
    deviceId: 'router',
    deviceLabel: 'Router',
    expectedCable: 'power',
  },
  {
    id: 'internet-wan',
    label: 'Toma Internet',
    sublabel: 'Operadora',
    deviceId: 'internet',
    deviceLabel: 'Internet',
    expectedCable: 'ethernet',
  },
  {
    id: 'router-wan',
    label: 'Puerto WAN',
    sublabel: 'Entrada Internet',
    deviceId: 'router',
    deviceLabel: 'Router',
    expectedCable: 'ethernet',
  },
  {
    id: 'router-lan',
    label: 'Puerto LAN',
    sublabel: 'Red local',
    deviceId: 'router',
    deviceLabel: 'Router',
    expectedCable: 'ethernet',
  },
  {
    id: 'switch-uplink',
    label: 'Puerto Uplink',
    sublabel: 'Entrada Switch',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    expectedCable: 'ethernet',
  },
  {
    id: 'switch-aula',
    label: 'Puerto Aula',
    sublabel: 'Salida Switch',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    expectedCable: 'ethernet',
  },
  {
    id: 'patch-panel-aula',
    label: 'Puerto Patch Panel',
    sublabel: 'Distribución aula',
    deviceId: 'patch_panel',
    deviceLabel: 'Patch Panel',
    expectedCable: 'ethernet',
  },
];

export const GUIDED_WIRING_STEPS: GuidedWiringStep[] = [
  {
    stepNumber: 1,
    title: 'Corriente eléctrica',
    missionText:
      'Paso 1 de 4: Conecta la alimentación eléctrica al Router desde el SAI.',
    requiredCable: 'power',
    fromPortId: 'sai-out',
    toPortId: 'router-pwr',
    successMessage:
      '¡Genial! +100 pts · El Router ya recibe corriente eléctrica protegida del SAI.',
  },
  {
    stepNumber: 2,
    title: 'Internet → WAN',
    missionText:
      'Paso 2 de 4: Conecta la Toma de Internet al puerto WAN del Router.',
    requiredCable: 'ethernet',
    fromPortId: 'internet-wan',
    toPortId: 'router-wan',
    successMessage:
      '¡Muy bien! +100 pts · La señal de Internet ya entra en el puerto WAN del Router.',
  },
  {
    stepNumber: 3,
    title: 'Router LAN → Switch',
    missionText:
      'Paso 3 de 4: Conecta el puerto LAN del Router con el puerto Uplink del Switch.',
    requiredCable: 'ethernet',
    fromPortId: 'router-lan',
    toPortId: 'switch-uplink',
    successMessage:
      '¡Perfecto! +100 pts · La red local ya conecta el Router con el Switch.',
  },
  {
    stepNumber: 4,
    title: 'Switch → Patch Panel',
    missionText:
      'Paso 4 de 4: Conecta el puerto del Switch con el Patch Panel para repartir la red al aula.',
    requiredCable: 'ethernet',
    fromPortId: 'switch-aula',
    toPortId: 'patch-panel-aula',
    successMessage:
      '¡Misión completada! +100 pts · Toda la red del armario rack está conectada al aula.',
  },
];

export function getPortById(portId: string): NetworkPort | undefined {
  return NETWORK_PORTS.find((p) => p.id === portId);
}

export function getCurrentWiringStep(
  cables: CableConnection[]
): GuidedWiringStep | null {
  const completedSteps = new Set(cables.map((c) => c.stepNumber));
  return (
    GUIDED_WIRING_STEPS.find((step) => !completedSteps.has(step.stepNumber)) ??
    null
  );
}

export function isPortOccupied(
  cables: CableConnection[],
  portId: string
): boolean {
  return cables.some(
    (c) => c.fromPortId === portId || c.toPortId === portId
  );
}

export function validateStepPortSelection(params: {
  step: GuidedWiringStep;
  selectedCable: CableType | null;
  portId: string;
  cables: CableConnection[];
}): { ok: boolean; reason?: string } {
  const { step, selectedCable, portId, cables } = params;
  const port = getPortById(portId);
  if (!port) {
    return { ok: false, reason: 'Puerto no reconocido.' };
  }

  if (!selectedCable) {
    return {
      ok: false,
      reason:
        step.requiredCable === 'power'
          ? 'Primero selecciona abajo el Cable de Alimentación (Negro - 230V).'
          : 'Primero selecciona abajo el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (selectedCable === 'power' && port.expectedCable === 'ethernet') {
    return {
      ok: false,
      reason:
        '¡Cuidado! No puedes meter corriente eléctrica en un puerto de red RJ45. Elige abajo el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (selectedCable === 'ethernet' && port.expectedCable === 'power') {
    return {
      ok: false,
      reason:
        '¡Cuidado! Ese es un puerto eléctrico de 230V y llevas un cable de datos RJ45. Elige abajo el Cable de Alimentación (Negro - 230V).',
    };
  }

  if (selectedCable !== step.requiredCable) {
    return {
      ok: false,
      reason:
        step.requiredCable === 'power'
          ? 'En este paso necesitas corriente eléctrica: selecciona el Cable de Alimentación (Negro - 230V).'
          : 'En este paso necesitas transmitir datos: selecciona el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (isPortOccupied(cables, portId)) {
    return {
      ok: false,
      reason: `El puerto "${port.label}" de ${port.deviceLabel} ya está conectado. Haz clic en los puertos que parpadean.`,
    };
  }

  if (portId !== step.fromPortId && portId !== step.toPortId) {
    const expectedFrom = getPortById(step.fromPortId);
    const expectedTo = getPortById(step.toPortId);
    return {
      ok: false,
      reason: `¡Casi! En este paso toca conectar "${expectedFrom?.label}" (${expectedFrom?.deviceLabel}) con "${expectedTo?.label}" (${expectedTo?.deviceLabel}).`,
    };
  }

  return { ok: true };
}

export function attemptStepConnection(params: {
  cables: CableConnection[];
  selectedCable: CableType | null;
  fromPortId: string;
  toPortId: string;
}): {
  cables: CableConnection[];
  completedStep?: GuidedWiringStep;
  error?: string;
} {
  const step = getCurrentWiringStep(params.cables);
  if (!step) {
    return {
      cables: params.cables,
      error: 'Ya has completado las 4 conexiones de la Fase 3.',
    };
  }

  if (params.fromPortId === params.toPortId) {
    return {
      cables: params.cables,
      error: 'Has pulsado el mismo puerto dos veces. Haz clic en el otro puerto que parpadea.',
    };
  }

  const checkFrom = validateStepPortSelection({
    step,
    selectedCable: params.selectedCable,
    portId: params.fromPortId,
    cables: params.cables,
  });
  if (!checkFrom.ok) {
    return { cables: params.cables, error: checkFrom.reason };
  }

  const checkTo = validateStepPortSelection({
    step,
    selectedCable: params.selectedCable,
    portId: params.toPortId,
    cables: params.cables,
  });
  if (!checkTo.ok) {
    return { cables: params.cables, error: checkTo.reason };
  }

  const pair = new Set([params.fromPortId, params.toPortId]);
  if (!pair.has(step.fromPortId) || !pair.has(step.toPortId)) {
    return {
      cables: params.cables,
      error: 'Elige los dos puertos resaltados para completar este paso.',
    };
  }

  const newCable: CableConnection = {
    id: `step-${step.stepNumber}-${step.fromPortId}-${step.toPortId}`,
    type: step.requiredCable,
    fromPortId: step.fromPortId,
    toPortId: step.toPortId,
    stepNumber: step.stepNumber,
  };

  return {
    cables: [...params.cables, newCable],
    completedStep: step,
  };
}

// =============================================================================
// NIVEL TÉCNICO: Cableado guiado en 8 pasos para centro educativo (9 enlaces)
// =============================================================================

export interface TechnicalNetworkPort {
  id: string;
  label: string;
  sublabel: string;
  deviceLabel: string;
  expectedCable: CableType;
}

export interface TechnicalStepLink {
  fromPortId: string;
  toPortId: string;
}

export interface TechnicalWiringStep {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  missionText: string;
  requiredCable: CableType;
  links: TechnicalStepLink[];
  partialSuccessMessage?: string;
  successMessage: string;
}

export interface TechnicalCableConnection {
  id: string;
  type: CableType;
  fromPortId: string;
  toPortId: string;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export const TOTAL_TECHNICAL_EXPECTED_CABLES = 9;

export const TECHNICAL_NETWORK_PORTS: TechnicalNetworkPort[] = [
  // SAI outputs (230V)
  {
    id: 'tech-sai-router',
    label: 'Salida 230V · Router',
    sublabel: 'Corriente SAI',
    deviceLabel: 'SAI (UPS)',
    expectedCable: 'power',
  },
  {
    id: 'tech-sai-switches',
    label: 'Salida 230V · Switches',
    sublabel: 'Corriente SAI',
    deviceLabel: 'SAI (UPS)',
    expectedCable: 'power',
  },
  // Router ports
  {
    id: 'tech-router-pwr',
    label: 'Entrada 230V',
    sublabel: 'Alimentación',
    deviceLabel: 'Router',
    expectedCable: 'power',
  },
  {
    id: 'tech-router-wan',
    label: 'Puerto WAN',
    sublabel: 'Entrada Internet',
    deviceLabel: 'Router',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-router-lan',
    label: 'Puerto LAN',
    sublabel: 'Red local',
    deviceLabel: 'Router',
    expectedCable: 'ethernet',
  },
  // Internet external jack
  {
    id: 'tech-internet-wan',
    label: 'Toma Internet',
    sublabel: 'Operadora',
    deviceLabel: 'Internet',
    expectedCable: 'ethernet',
  },
  // Switch block 230V + Switch 1 (Principal)
  {
    id: 'tech-switches-pwr',
    label: 'Entrada 230V Switches',
    sublabel: 'Regleta Switches',
    deviceLabel: 'Switches 1–3',
    expectedCable: 'power',
  },
  {
    id: 'tech-sw1-uplink',
    label: 'Uplink Router',
    sublabel: 'Entrada SW1',
    deviceLabel: 'Switch 1 (Principal)',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-sw1-to-sw2',
    label: 'Troncal → SW2',
    sublabel: 'Puerto 22 SW1',
    deviceLabel: 'Switch 1 (Principal)',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-sw1-to-sw3',
    label: 'Troncal → SW3',
    sublabel: 'Puerto 23 SW1',
    deviceLabel: 'Switch 1 (Principal)',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-sw1-aula1',
    label: 'Salida Aula 1',
    sublabel: 'Puerto 24 SW1',
    deviceLabel: 'Switch 1 (Principal)',
    expectedCable: 'ethernet',
  },
  // Switch 2 (Aula 2)
  {
    id: 'tech-sw2-uplink',
    label: 'Uplink SW1',
    sublabel: 'Entrada SW2',
    deviceLabel: 'Switch 2 (Aula 2)',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-sw2-aula2',
    label: 'Salida Aula 2',
    sublabel: 'Puerto 24 SW2',
    deviceLabel: 'Switch 2 (Aula 2)',
    expectedCable: 'ethernet',
  },
  // Switch 3 (Sala de Profesores)
  {
    id: 'tech-sw3-uplink',
    label: 'Uplink SW1',
    sublabel: 'Entrada SW3',
    deviceLabel: 'Switch 3 (Prof.)',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-sw3-prof',
    label: 'Salida Prof.',
    sublabel: 'Puerto 24 SW3',
    deviceLabel: 'Switch 3 (Prof.)',
    expectedCable: 'ethernet',
  },
  // Patch Panel zones
  {
    id: 'tech-pp-aula1',
    label: 'Aula 1',
    sublabel: 'Patch Panel',
    deviceLabel: 'Patch Panel · Aula 1',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-pp-aula2',
    label: 'Aula 2',
    sublabel: 'Patch Panel',
    deviceLabel: 'Patch Panel · Aula 2',
    expectedCable: 'ethernet',
  },
  {
    id: 'tech-pp-prof',
    label: 'Sala de Profesores',
    sublabel: 'Patch Panel',
    deviceLabel: 'Patch Panel · Prof.',
    expectedCable: 'ethernet',
  },
];

export const TECHNICAL_WIRING_STEPS: TechnicalWiringStep[] = [
  {
    stepNumber: 1,
    title: 'SAI → Router 230V',
    missionText:
      'Paso 1 de 8: Conecta la alimentación eléctrica (Negro) desde el SAI al Router.',
    requiredCable: 'power',
    links: [{ fromPortId: 'tech-sai-router', toPortId: 'tech-router-pwr' }],
    successMessage:
      '¡Bien! El Router ya recibe corriente eléctrica protegida del SAI.',
  },
  {
    stepNumber: 2,
    title: 'SAI → Switches 230V',
    missionText:
      'Paso 2 de 8: Conecta la alimentación eléctrica (Negro) desde el SAI hacia los Switches.',
    requiredCable: 'power',
    links: [{ fromPortId: 'tech-sai-switches', toPortId: 'tech-switches-pwr' }],
    successMessage:
      '¡Genial! Los tres Switches del armario ya tienen corriente eléctrica de 230V.',
  },
  {
    stepNumber: 3,
    title: 'Internet → WAN Router',
    missionText:
      'Paso 3 de 8: Conecta la Toma de Internet (Azul) al puerto WAN del Router.',
    requiredCable: 'ethernet',
    links: [{ fromPortId: 'tech-internet-wan', toPortId: 'tech-router-wan' }],
    successMessage:
      '¡Correcto! La línea de Internet exterior ya entra en el puerto WAN del Router.',
  },
  {
    stepNumber: 4,
    title: 'Router LAN → Switch 1',
    missionText:
      'Paso 4 de 8: Enlaza el puerto LAN del Router (Azul) con el Switch Principal (Switch 1).',
    requiredCable: 'ethernet',
    links: [{ fromPortId: 'tech-router-lan', toPortId: 'tech-sw1-uplink' }],
    successMessage:
      '¡Perfecto! El Switch 1 (Principal) ya recibe la red local desde el Router.',
  },
  {
    stepNumber: 5,
    title: 'Switch 1 → SW2 y SW3',
    missionText:
      'Paso 5 de 8: Interconecta Switch 1 con Switch 2 y también Switch 1 con Switch 3 (2 enlaces).',
    requiredCable: 'ethernet',
    links: [
      { fromPortId: 'tech-sw1-to-sw2', toPortId: 'tech-sw2-uplink' },
      { fromPortId: 'tech-sw1-to-sw3', toPortId: 'tech-sw3-uplink' },
    ],
    partialSuccessMessage:
      '¡Primer troncal listo! Ahora conecta la otra pareja que parpadea entre Switch 1 y el otro Switch.',
    successMessage:
      '¡Excelente! Switch 1, Switch 2 y Switch 3 ya están interconectados entre sí.',
  },
  {
    stepNumber: 6,
    title: 'Switch 1 → Aula 1',
    missionText:
      'Paso 6 de 8: Conecta Switch 1 con el puerto "Aula 1" del Patch Panel.',
    requiredCable: 'ethernet',
    links: [{ fromPortId: 'tech-sw1-aula1', toPortId: 'tech-pp-aula1' }],
    successMessage:
      '¡Aula 1 conectada! Ya hay red en los puestos de Aula 1.',
  },
  {
    stepNumber: 7,
    title: 'Switch 2 → Aula 2',
    missionText:
      'Paso 7 de 8: Conecta Switch 2 con el puerto "Aula 2" del Patch Panel.',
    requiredCable: 'ethernet',
    links: [{ fromPortId: 'tech-sw2-aula2', toPortId: 'tech-pp-aula2' }],
    successMessage:
      '¡Aula 2 conectada! Solo queda la Sala de Profesores.',
  },
  {
    stepNumber: 8,
    title: 'Switch 3 → Sala Prof.',
    missionText:
      'Paso 8 de 8: Conecta Switch 3 con el puerto "Sala de Profesores" del Patch Panel.',
    requiredCable: 'ethernet',
    links: [{ fromPortId: 'tech-sw3-prof', toPortId: 'tech-pp-prof' }],
    successMessage:
      '¡Instalación técnica completada! Aula 1, Aula 2 y Sala de Profesores tienen red e Internet.',
  },
];

export function getTechnicalPortById(
  portId: string
): TechnicalNetworkPort | undefined {
  return TECHNICAL_NETWORK_PORTS.find((p) => p.id === portId);
}

export function isTechnicalLinkDone(
  cables: TechnicalCableConnection[],
  link: TechnicalStepLink
): boolean {
  return cables.some(
    (c) =>
      (c.fromPortId === link.fromPortId && c.toPortId === link.toPortId) ||
      (c.fromPortId === link.toPortId && c.toPortId === link.fromPortId)
  );
}

export function isTechnicalStepDone(
  cables: TechnicalCableConnection[],
  step: TechnicalWiringStep
): boolean {
  return step.links.every((link) => isTechnicalLinkDone(cables, link));
}

export function getCurrentTechnicalWiringStep(
  cables: TechnicalCableConnection[]
): TechnicalWiringStep | null {
  return (
    TECHNICAL_WIRING_STEPS.find((step) => !isTechnicalStepDone(cables, step)) ??
    null
  );
}

export function isTechnicalPortOccupied(
  cables: TechnicalCableConnection[],
  portId: string
): boolean {
  return cables.some(
    (c) => c.fromPortId === portId || c.toPortId === portId
  );
}

export function getActiveTechnicalStepPortIds(
  step: TechnicalWiringStep | null,
  cables: TechnicalCableConnection[]
): Set<string> {
  const active = new Set<string>();
  if (!step) return active;
  for (const link of step.links) {
    if (!isTechnicalLinkDone(cables, link)) {
      active.add(link.fromPortId);
      active.add(link.toPortId);
    }
  }
  return active;
}

export function validateTechnicalStepPortSelection(params: {
  step: TechnicalWiringStep;
  selectedCable: CableType | null;
  portId: string;
  cables: TechnicalCableConnection[];
}): { ok: boolean; reason?: string } {
  const { step, selectedCable, portId, cables } = params;
  const port = getTechnicalPortById(portId);
  if (!port) {
    return { ok: false, reason: 'Puerto no reconocido.' };
  }

  if (!selectedCable) {
    return {
      ok: false,
      reason:
        step.requiredCable === 'power'
          ? 'Primero selecciona abajo el Cable de Alimentación (Negro - 230V).'
          : 'Primero selecciona abajo el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (selectedCable === 'power' && port.expectedCable === 'ethernet') {
    return {
      ok: false,
      reason:
        '¡Cuidado! No puedes meter corriente eléctrica en un puerto de red RJ45. Elige abajo el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (selectedCable === 'ethernet' && port.expectedCable === 'power') {
    return {
      ok: false,
      reason:
        '¡Cuidado! Ese es un puerto eléctrico de 230V y llevas un cable de datos RJ45. Elige abajo el Cable de Alimentación (Negro - 230V).',
    };
  }

  if (selectedCable !== step.requiredCable) {
    return {
      ok: false,
      reason:
        step.requiredCable === 'power'
          ? 'En este paso necesitas corriente eléctrica: selecciona el Cable de Alimentación (Negro - 230V).'
          : 'En este paso necesitas transmitir datos: selecciona el Cable de Red UTP RJ45 (Azul - Datos).',
    };
  }

  if (isTechnicalPortOccupied(cables, portId)) {
    return {
      ok: false,
      reason: `El puerto "${port.label}" de ${port.deviceLabel} ya está conectado. Haz clic en los puertos que parpadean.`,
    };
  }

  const activePorts = getActiveTechnicalStepPortIds(step, cables);
  if (!activePorts.has(portId)) {
    const pendingLink = step.links.find(
      (l) => !isTechnicalLinkDone(cables, l)
    );
    const expectedFrom = pendingLink
      ? getTechnicalPortById(pendingLink.fromPortId)
      : undefined;
    const expectedTo = pendingLink
      ? getTechnicalPortById(pendingLink.toPortId)
      : undefined;
    return {
      ok: false,
      reason: `¡Casi! En este paso toca conectar "${expectedFrom?.label}" (${expectedFrom?.deviceLabel}) con "${expectedTo?.label}" (${expectedTo?.deviceLabel}).`,
    };
  }

  return { ok: true };
}

export function attemptTechnicalStepConnection(params: {
  cables: TechnicalCableConnection[];
  selectedCable: CableType | null;
  fromPortId: string;
  toPortId: string;
}): {
  cables: TechnicalCableConnection[];
  completedStep?: TechnicalWiringStep;
  message?: string;
  error?: string;
} {
  const step = getCurrentTechnicalWiringStep(params.cables);
  if (!step) {
    return {
      cables: params.cables,
      error: 'Ya has completado las 8 conexiones de la Fase 3.',
    };
  }

  if (params.fromPortId === params.toPortId) {
    return {
      cables: params.cables,
      error:
        'Has pulsado el mismo puerto dos veces. Haz clic en el otro puerto que parpadea.',
    };
  }

  const checkFrom = validateTechnicalStepPortSelection({
    step,
    selectedCable: params.selectedCable,
    portId: params.fromPortId,
    cables: params.cables,
  });
  if (!checkFrom.ok) {
    return { cables: params.cables, error: checkFrom.reason };
  }

  const checkTo = validateTechnicalStepPortSelection({
    step,
    selectedCable: params.selectedCable,
    portId: params.toPortId,
    cables: params.cables,
  });
  if (!checkTo.ok) {
    return { cables: params.cables, error: checkTo.reason };
  }

  const matchingLink = step.links.find((l) => {
    const pair = new Set([params.fromPortId, params.toPortId]);
    return (
      !isTechnicalLinkDone(params.cables, l) &&
      pair.has(l.fromPortId) &&
      pair.has(l.toPortId)
    );
  });

  if (!matchingLink) {
    return {
      cables: params.cables,
      error:
        'Ese par no coincide: une cada puerto de Switch 1 con su Uplink correspondiente (SW1→SW2 y SW1→SW3).',
    };
  }

  const newCable: TechnicalCableConnection = {
    id: `tech-step-${step.stepNumber}-${matchingLink.fromPortId}-${matchingLink.toPortId}`,
    type: step.requiredCable,
    fromPortId: matchingLink.fromPortId,
    toPortId: matchingLink.toPortId,
    stepNumber: step.stepNumber,
  };

  const nextCables = [...params.cables, newCable];
  const stepNowFinished = isTechnicalStepDone(nextCables, step);

  return {
    cables: nextCables,
    completedStep: step,
    message: stepNowFinished
      ? step.successMessage
      : (step.partialSuccessMessage ?? step.successMessage),
  };
}
