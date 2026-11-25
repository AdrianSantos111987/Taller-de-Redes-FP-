export type CableType = 'fiber' | 'ethernet' | 'power';

export type PortCategory = 'fiber' | 'ethernet' | 'power_source' | 'power_in';

export interface NetworkPort {
  id: string;
  label: string;
  deviceId:
    | 'internet'
    | 'router'
    | 'switch'
    | 'patch_panel'
    | 'pdu'
    | 'sai'
    | 'roseta_1'
    | 'roseta_2'
    | 'roseta_3'
    | 'roseta_4'
    | 'pc_1'
    | 'pc_2'
    | 'pc_3'
    | 'pc_4';
  deviceLabel: string;
  category: PortCategory;
  group: 'wan' | 'rack' | 'classroom';
}

export interface CableConnection {
  id: string;
  type: CableType;
  fromPortId: string;
  toPortId: string;
}

export interface DiagnosticIssue {
  code: string;
  message: string;
}

export interface ConnectivityResult {
  allConnected: boolean;
  routerPowered: boolean;
  switchPowered: boolean;
  pduPowered: boolean;
  wanConnected: boolean;
  routerToSwitchConnected: boolean;
  pcStatuses: {
    pcIndex: 1 | 2 | 3 | 4;
    connectedToInternet: boolean;
    patchConnected: boolean;
    wallToPcConnected: boolean;
    missingReason?: string;
  }[];
  activeSwitchPorts: string[];
  issues: DiagnosticIssue[];
}

export const NETWORK_PORTS: NetworkPort[] = [
  // Internet ONT / Street fiber
  {
    id: 'internet-fiber',
    label: 'Fibra Operadora',
    deviceId: 'internet',
    deviceLabel: 'Internet',
    category: 'fiber',
    group: 'wan',
  },

  // Router ports
  {
    id: 'router-wan',
    label: 'WAN',
    deviceId: 'router',
    deviceLabel: 'Router',
    category: 'fiber',
    group: 'rack',
  },
  {
    id: 'router-lan',
    label: 'LAN 1',
    deviceId: 'router',
    deviceLabel: 'Router',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'router-pwr',
    label: '230V',
    deviceId: 'router',
    deviceLabel: 'Router',
    category: 'power_in',
    group: 'rack',
  },

  // Switch ports (Uplink + 4 LAN ports + Power)
  {
    id: 'switch-p1',
    label: 'P1 (Uplink)',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'switch-p2',
    label: 'P2',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'switch-p3',
    label: 'P3',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'switch-p4',
    label: 'P4',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'switch-p5',
    label: 'P5',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'switch-pwr',
    label: '230V',
    deviceId: 'switch',
    deviceLabel: 'Switch',
    category: 'power_in',
    group: 'rack',
  },

  // Patch Panel ports (mapped internally 1-to-1 to Roseta 1..4)
  {
    id: 'pp-1',
    label: 'PP 1',
    deviceId: 'patch_panel',
    deviceLabel: 'Patch Panel',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'pp-2',
    label: 'PP 2',
    deviceId: 'patch_panel',
    deviceLabel: 'Patch Panel',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'pp-3',
    label: 'PP 3',
    deviceId: 'patch_panel',
    deviceLabel: 'Patch Panel',
    category: 'ethernet',
    group: 'rack',
  },
  {
    id: 'pp-4',
    label: 'PP 4',
    deviceId: 'patch_panel',
    deviceLabel: 'Patch Panel',
    category: 'ethernet',
    group: 'rack',
  },

  // PDU ports
  {
    id: 'pdu-in',
    label: 'Entrada PDU',
    deviceId: 'pdu',
    deviceLabel: 'Regleta PDU',
    category: 'power_in',
    group: 'rack',
  },
  {
    id: 'pdu-out-1',
    label: 'Toma 1',
    deviceId: 'pdu',
    deviceLabel: 'Regleta PDU',
    category: 'power_source',
    group: 'rack',
  },
  {
    id: 'pdu-out-2',
    label: 'Toma 2',
    deviceId: 'pdu',
    deviceLabel: 'Regleta PDU',
    category: 'power_source',
    group: 'rack',
  },
  {
    id: 'pdu-out-3',
    label: 'Toma 3',
    deviceId: 'pdu',
    deviceLabel: 'Regleta PDU',
    category: 'power_source',
    group: 'rack',
  },

  // SAI ports
  {
    id: 'sai-out-1',
    label: 'Salida SAI 1',
    deviceId: 'sai',
    deviceLabel: 'SAI (UPS)',
    category: 'power_source',
    group: 'rack',
  },
  {
    id: 'sai-out-2',
    label: 'Salida SAI 2',
    deviceId: 'sai',
    deviceLabel: 'SAI (UPS)',
    category: 'power_source',
    group: 'rack',
  },

  // Classroom wall sockets (Rosetas) and PCs
  {
    id: 'roseta-1',
    label: 'Roseta 1',
    deviceId: 'roseta_1',
    deviceLabel: 'Roseta Pared 1',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'roseta-2',
    label: 'Roseta 2',
    deviceId: 'roseta_2',
    deviceLabel: 'Roseta Pared 2',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'roseta-3',
    label: 'Roseta 3',
    deviceId: 'roseta_3',
    deviceLabel: 'Roseta Pared 3',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'roseta-4',
    label: 'Roseta 4',
    deviceId: 'roseta_4',
    deviceLabel: 'Roseta Pared 4',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'pc-1',
    label: 'RJ45 PC 1',
    deviceId: 'pc_1',
    deviceLabel: 'PC 1',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'pc-2',
    label: 'RJ45 PC 2',
    deviceId: 'pc_2',
    deviceLabel: 'PC 2',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'pc-3',
    label: 'RJ45 PC 3',
    deviceId: 'pc_3',
    deviceLabel: 'PC 3',
    category: 'ethernet',
    group: 'classroom',
  },
  {
    id: 'pc-4',
    label: 'RJ45 PC 4',
    deviceId: 'pc_4',
    deviceLabel: 'PC 4',
    category: 'ethernet',
    group: 'classroom',
  },
];

export function getPortById(portId: string): NetworkPort | undefined {
  return NETWORK_PORTS.find((p) => p.id === portId);
}

export function isPortCompatibleWithCable(
  port: NetworkPort,
  cableType: CableType
): boolean {
  if (cableType === 'fiber') return port.category === 'fiber';
  if (cableType === 'ethernet') return port.category === 'ethernet';
  return port.category === 'power_in' || port.category === 'power_source';
}

export function isPortOccupied(
  cables: CableConnection[],
  portId: string
): boolean {
  return cables.some(
    (c) => c.fromPortId === portId || c.toPortId === portId
  );
}

export function canConnectPorts(
  cables: CableConnection[],
  cableType: CableType,
  fromPortId: string,
  toPortId: string
): { ok: boolean; reason?: string } {
  if (fromPortId === toPortId) {
    return { ok: false, reason: 'No puedes conectar un puerto consigo mismo.' };
  }

  const fromPort = getPortById(fromPortId);
  const toPort = getPortById(toPortId);
  if (!fromPort || !toPort) {
    return { ok: false, reason: 'Puerto no reconocido.' };
  }

  if (
    !isPortCompatibleWithCable(fromPort, cableType) ||
    !isPortCompatibleWithCable(toPort, cableType)
  ) {
    const cableNames: Record<CableType, string> = {
      fiber: 'Fibra Óptica / WAN (Amarillo)',
      ethernet: 'Ethernet UTP RJ45 (Azul)',
      power: 'Alimentación Eléctrica (Negro/Rojo)',
    };
    return {
      ok: false,
      reason: `El cable ${cableNames[cableType]} no encaja en esos puertos. Cambia el tipo de cable o elige puertos compatibles.`,
    };
  }

  if (fromPort.deviceId === toPort.deviceId) {
    return {
      ok: false,
      reason: `Conecta ${fromPort.deviceLabel} con otro equipo distinto, no consigo mismo.`,
    };
  }

  if (isPortOccupied(cables, fromPortId)) {
    return {
      ok: false,
      reason: `El puerto ${fromPort.label} de ${fromPort.deviceLabel} ya tiene un cable conectado.`,
    };
  }

  if (isPortOccupied(cables, toPortId)) {
    return {
      ok: false,
      reason: `El puerto ${toPort.label} de ${toPort.deviceLabel} ya tiene un cable conectado.`,
    };
  }

  if (cableType === 'power') {
    const categories = new Set([fromPort.category, toPort.category]);
    if (
      !categories.has('power_source') ||
      !categories.has('power_in')
    ) {
      return {
        ok: false,
        reason:
          'Un cable de corriente debe unir una salida eléctrica (SAI o toma PDU) con la entrada eléctrica de un equipo.',
      };
    }
  }

  // Enforce clean domain logic for Ethernet pairs so students don't accidentally bypass structured cabling
  if (cableType === 'ethernet') {
    const devices = [fromPort.deviceId, toPort.deviceId];
    const hasInternetOrPower = devices.includes('internet');
    if (hasInternetOrPower) {
      return {
        ok: false,
        reason: 'Internet entra al Router por Fibra Óptica / WAN, no por Ethernet.',
      };
    }
    // Rosetas must connect to PCs (or vice versa), not directly to Router
    const hasPc = devices.some((d) => d.startsWith('pc_'));
    const hasRoseta = devices.some((d) => d.startsWith('roseta_'));
    if (hasPc && !hasRoseta) {
      return {
        ok: false,
        reason:
          'En un aula cableada, conecta cada PC a su roseta de pared RJ45 (no directo al armario).',
      };
    }
    if (hasRoseta && !hasPc) {
      return {
        ok: false,
        reason:
          'La roseta de pared ya llega por detrás al Patch Panel; conéctala al PC del puesto.',
      };
    }
    if (devices.includes('router') && devices.includes('patch_panel')) {
      return {
        ok: false,
        reason:
          'Conecta primero la LAN del Router al Switch, y del Switch al Patch Panel.',
      };
    }
  }

  return { ok: true };
}

export function addCableConnection(
  cables: CableConnection[],
  cableType: CableType,
  fromPortId: string,
  toPortId: string
): { cables: CableConnection[]; error?: string } {
  const check = canConnectPorts(cables, cableType, fromPortId, toPortId);
  if (!check.ok) {
    return { cables, error: check.reason };
  }

  const newCable: CableConnection = {
    id: `${cableType}-${fromPortId}-${toPortId}`,
    type: cableType,
    fromPortId,
    toPortId,
  };
  return { cables: [...cables, newCable] };
}

export function removeCableConnection(
  cables: CableConnection[],
  cableId: string
): CableConnection[] {
  return cables.filter((c) => c.id !== cableId);
}

function getNeighbors(
  cables: CableConnection[],
  portId: string,
  typeFilter?: CableType
): string[] {
  const result: string[] = [];
  for (const c of cables) {
    if (typeFilter && c.type !== typeFilter) continue;
    if (c.fromPortId === portId) result.push(c.toPortId);
    else if (c.toPortId === portId) result.push(c.fromPortId);
  }
  return result;
}

export function validateConnectivity(
  cables: CableConnection[]
): ConnectivityResult {
  const issues: DiagnosticIssue[] = [];

  // 1. Check Power path:
  // SAI outputs feed PDU input (or directly Router/Switch if connected to SAI, though best practice is SAI -> PDU -> Router/Switch)
  const pduInNeighbors = getNeighbors(cables, 'pdu-in', 'power');
  const pduPowered = pduInNeighbors.some((p) => p.startsWith('sai-out'));

  const hasPowerFrom = (portId: string): boolean => {
    const neighbors = getNeighbors(cables, portId, 'power');
    return neighbors.some((n) => {
      if (n.startsWith('sai-out')) return true;
      if (n.startsWith('pdu-out') && pduPowered) return true;
      return false;
    });
  };

  const routerPowered = hasPowerFrom('router-pwr');
  const switchPowered = hasPowerFrom('switch-pwr');

  if (!pduPowered) {
    const routerOnPdu = getNeighbors(cables, 'router-pwr', 'power').some((n) =>
      n.startsWith('pdu-out')
    );
    const switchOnPdu = getNeighbors(cables, 'switch-pwr', 'power').some((n) =>
      n.startsWith('pdu-out')
    );
    if (routerOnPdu || switchOnPdu) {
      issues.push({
        code: 'pdu_no_power',
        message:
          'La regleta PDU no tiene corriente: conecta el SAI a la entrada de la PDU.',
      });
    } else if (!routerPowered || !switchPowered) {
      issues.push({
        code: 'sai_to_pdu_missing',
        message:
          'Conecta el SAI a la entrada de la Regleta PDU para distribuir corriente protegida.',
      });
    }
  }

  if (!routerPowered) {
    issues.push({
      code: 'router_no_power',
      message: 'El Router no tiene corriente eléctrica.',
    });
  }

  if (!switchPowered) {
    issues.push({
      code: 'switch_no_power',
      message: 'El Switch no tiene corriente eléctrica.',
    });
  }

  // 2. Check WAN connection: Internet <-> Router WAN (fiber)
  const wanNeighbors = getNeighbors(cables, 'router-wan', 'fiber');
  const wanConnected = wanNeighbors.includes('internet-fiber');
  if (!wanConnected) {
    issues.push({
      code: 'wan_missing',
      message:
        'Falta conectar Internet al puerto WAN del Router con cable de Fibra Óptica (Amarillo).',
    });
  }

  // 3. Check Router LAN <-> Switch (ethernet)
  const routerLanNeighbors = getNeighbors(cables, 'router-lan', 'ethernet');
  const routerToSwitchPort = routerLanNeighbors.find((p) =>
    p.startsWith('switch-p')
  );
  const routerToSwitchConnected = Boolean(routerToSwitchPort);
  if (!routerToSwitchConnected) {
    issues.push({
      code: 'router_switch_missing',
      message: 'Falta unir el puerto LAN del Router con el Switch.',
    });
  }

  // 4. Check each PC1..PC4 path:
  // Switch port <-> Patch Panel PP_i (internal wall link to Roseta_i) <-> PC_i
  const activeSwitchPorts: string[] = [];
  if (routerToSwitchPort && switchPowered && routerPowered && wanConnected) {
    activeSwitchPorts.push(routerToSwitchPort);
  }

  const pcStatuses = ([1, 2, 3, 4] as const).map((pcIndex) => {
    const ppPortId = `pp-${pcIndex}`;
    const rosetaPortId = `roseta-${pcIndex}`;
    const pcPortId = `pc-${pcIndex}`;

    const ppNeighbors = getNeighbors(cables, ppPortId, 'ethernet');
    const switchPortForPc = ppNeighbors.find((p) => p.startsWith('switch-p'));
    const patchConnected = Boolean(switchPortForPc);

    const rosetaNeighbors = getNeighbors(cables, rosetaPortId, 'ethernet');
    const wallToPcConnected = rosetaNeighbors.includes(pcPortId);

    const connectedToInternet =
      routerPowered &&
      switchPowered &&
      wanConnected &&
      routerToSwitchConnected &&
      patchConnected &&
      wallToPcConnected;

    if (connectedToInternet && switchPortForPc) {
      activeSwitchPorts.push(switchPortForPc);
    }

    let missingReason: string | undefined;
    if (!patchConnected && !wallToPcConnected) {
      missingReason = `Falta unir el Switch con PP ${pcIndex} y la Roseta ${pcIndex} con el PC ${pcIndex}.`;
    } else if (!patchConnected) {
      missingReason = `Falta el latiguillo del Switch al Patch Panel (PP ${pcIndex}) para el PC ${pcIndex}.`;
    } else if (!wallToPcConnected) {
      missingReason = `Falta el cable Ethernet de la Roseta ${pcIndex} al PC ${pcIndex}.`;
    }

    return {
      pcIndex,
      connectedToInternet,
      patchConnected,
      wallToPcConnected,
      missingReason,
    };
  });

  const missingPatch = pcStatuses.filter((s) => !s.patchConnected);
  const missingWall = pcStatuses.filter((s) => !s.wallToPcConnected);

  if (missingPatch.length > 0) {
    issues.push({
      code: 'patch_missing',
      message: `Falta conectar el Switch con el Patch Panel en: ${missingPatch.map((s) => `PP ${s.pcIndex}`).join(', ')}.`,
    });
  }

  if (missingWall.length > 0) {
    issues.push({
      code: 'wall_pc_missing',
      message: `Falta conectar la roseta de pared al ordenador en: ${missingWall.map((s) => `PC ${s.pcIndex}`).join(', ')}.`,
    });
  }

  const allConnected =
    routerPowered &&
    switchPowered &&
    wanConnected &&
    routerToSwitchConnected &&
    pcStatuses.every((s) => s.connectedToInternet);

  return {
    allConnected,
    routerPowered,
    switchPowered,
    pduPowered,
    wanConnected,
    routerToSwitchConnected,
    pcStatuses,
    activeSwitchPorts,
    issues,
  };
}
