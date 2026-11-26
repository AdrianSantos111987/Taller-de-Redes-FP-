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
