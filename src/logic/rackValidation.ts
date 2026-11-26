import {
  RACK_INVENTORY,
  RackEquipmentId,
  TOTAL_RACK_UNITS,
} from '../data/componentsData';

export interface PlacedRackItem {
  id: RackEquipmentId;
  bottomU: number; // 1-indexed from bottom (U1..U12)
  heightU: 1 | 2;
}

export interface RackRuleResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RackValidationSummary {
  isValid: boolean;
  allPlaced: boolean;
  rules: RackRuleResult[];
}

export function getEquipmentHeight(id: RackEquipmentId): 1 | 2 {
  const spec = RACK_INVENTORY.find((item) => item.id === id);
  return spec ? spec.heightU : 1;
}

export function getOccupiedUnits(item: PlacedRackItem): number[] {
  const units: number[] = [];
  for (let i = 0; i < item.heightU; i++) {
    units.push(item.bottomU + i);
  }
  return units;
}

export function canPlaceItem(
  placedItems: PlacedRackItem[],
  itemId: RackEquipmentId,
  targetBottomU: number
): { ok: boolean; reason?: string } {
  const heightU = getEquipmentHeight(itemId);

  if (targetBottomU < 1 || targetBottomU + heightU - 1 > TOTAL_RACK_UNITS) {
    return {
      ok: false,
      reason: `El equipo necesita ${heightU}U libres y se sale del armario (U1–U${TOTAL_RACK_UNITS}).`,
    };
  }

  const candidateUnits = new Set<number>();
  for (let u = targetBottomU; u < targetBottomU + heightU; u++) {
    candidateUnits.add(u);
  }

  for (const existing of placedItems) {
    if (existing.id === itemId) continue;
    for (const occupiedU of getOccupiedUnits(existing)) {
      if (candidateUnits.has(occupiedU)) {
        const existingSpec = RACK_INVENTORY.find((i) => i.id === existing.id);
        return {
          ok: false,
          reason: `La unidad U${occupiedU} ya está ocupada por ${existingSpec?.nombre ?? existing.id}.`,
        };
      }
    }
  }

  return { ok: true };
}

export function placeRackItem(
  placedItems: PlacedRackItem[],
  itemId: RackEquipmentId,
  targetBottomU: number
): { placedItems: PlacedRackItem[]; error?: string } {
  const check = canPlaceItem(placedItems, itemId, targetBottomU);
  if (!check.ok) {
    return { placedItems, error: check.reason };
  }

  const heightU = getEquipmentHeight(itemId);
  const filtered = placedItems.filter((item) => item.id !== itemId);
  return {
    placedItems: [...filtered, { id: itemId, bottomU: targetBottomU, heightU }],
  };
}

export function removeRackItem(
  placedItems: PlacedRackItem[],
  itemId: RackEquipmentId
): PlacedRackItem[] {
  return placedItems.filter((item) => item.id !== itemId);
}

export function validateRackAssembly(
  placedItems: PlacedRackItem[]
): RackValidationSummary {
  const findItem = (id: RackEquipmentId) =>
    placedItems.find((item) => item.id === id);

  const allPlaced = RACK_INVENTORY.every((spec) => Boolean(findItem(spec.id)));

  // Rule 1: No overlaps and within bounds U1..U12
  const unitOwners = new Map<number, RackEquipmentId[]>();
  let outOfBounds = false;
  for (const item of placedItems) {
    for (const u of getOccupiedUnits(item)) {
      if (u < 1 || u > TOTAL_RACK_UNITS) {
        outOfBounds = true;
      }
      const list = unitOwners.get(u) ?? [];
      list.push(item.id);
      unitOwners.set(u, list);
    }
  }
  const hasOverlap = Array.from(unitOwners.values()).some(
    (owners) => owners.length > 1
  );
  const noOverlapsPassed = !hasOverlap && !outOfBounds && placedItems.length > 0;

  // Rule 2: SAI at base (U1-U2)
  const sai = findItem('sai');
  const saiAtBase = Boolean(sai && sai.bottomU === 1 && sai.heightU === 2);

  // Rule 3: Patch Panel and Switch adjacent
  const patchPanel = findItem('patch_panel');
  const switchItem = findItem('switch');
  const patchAndSwitchAdjacent = Boolean(
    patchPanel &&
      switchItem &&
      Math.abs(patchPanel.bottomU - switchItem.bottomU) === 1
  );

  // Rule 4: PDU accessible (installed in rack, not buried on floor U1 under equipment, and not overlapping)
  const pdu = findItem('pdu');
  const pduAccessible = Boolean(pdu && pdu.bottomU >= 3 && !hasOverlap);

  const rules: RackRuleResult[] = [
    {
      id: 'all_placed',
      label: 'Todos los equipos instalados en el rack',
      passed: allPlaced,
      detail: allPlaced
        ? 'Has colocado los 6 elementos del inventario dentro del armario.'
        : `Faltan ${RACK_INVENTORY.length - placedItems.length} equipo(s) por colocar en el rack.`,
    },
    {
      id: 'sai_base',
      label: 'SAI en la base del rack (U1–U2)',
      passed: saiAtBase,
      detail: saiAtBase
        ? 'Correcto: el SAI está en U1–U2 dando estabilidad y equilibrio por su peso.'
        : sai
          ? `El SAI está en U${sai.bottomU}–U${sai.bottomU + 1}. Muévelo a la base (U1–U2) para evitar que el armario vuelque.`
          : 'Coloca el SAI en las unidades inferiores U1–U2.',
    },
    {
      id: 'patch_switch_adjacent',
      label: 'Patch Panel y Switch adyacentes (juntos)',
      passed: patchAndSwitchAdjacent,
      detail: patchAndSwitchAdjacent
        ? 'Correcto: están juntos y permitirán usar latiguillos de red cortos y ordenados.'
        : patchPanel && switchItem
          ? `El Patch Panel (U${patchPanel.bottomU}) y el Switch (U${switchItem.bottomU}) están separados. Ponlos en unidades U seguidas.`
          : 'Coloca el Patch Panel y el Switch en dos unidades U contiguas (pegadas).',
    },
    {
      id: 'pdu_accessible',
      label: 'Regleta PDU instalada y accesible',
      passed: pduAccessible,
      detail: pduAccessible
        ? `Correcto: la regleta PDU está en U${pdu?.bottomU}, accesible para conectar los cables de alimentación.`
        : pdu
          ? 'La regleta PDU debe quedar en una posición accesible por encima de la base del SAI (U3 o superior).'
          : 'Coloca la Regleta PDU en una unidad accesible para alimentar los equipos.',
    },
    {
      id: 'no_overlaps',
      label: 'Sin equipos solapados ni fuera de rango',
      passed: noOverlapsPassed,
      detail: noOverlapsPassed
        ? 'Todas las guías están limpias y cada dispositivo ocupa su espacio exacto.'
        : 'Revisa que ningún equipo se pise con otro ni se salga de U1–U12.',
    },
  ];

  const isValid = rules.every((r) => r.passed);

  return {
    isValid,
    allPlaced,
    rules,
  };
}

// =============================================================================
// NIVEL TÉCNICO: Montaje completo de armario rack 12U (11 equipos = 12U llenas)
// =============================================================================

import {
  TECHNICAL_RACK_INVENTORY,
  TechnicalRackEquipmentId,
} from '../data/componentsData';

export interface TechnicalPlacedRackItem {
  id: TechnicalRackEquipmentId;
  bottomU: number;
  heightU: 1 | 2;
}

export function getTechnicalEquipmentHeight(
  id: TechnicalRackEquipmentId
): 1 | 2 {
  const spec = TECHNICAL_RACK_INVENTORY.find((item) => item.id === id);
  return spec ? spec.heightU : 1;
}

export function getTechnicalOccupiedUnits(
  item: TechnicalPlacedRackItem
): number[] {
  const units: number[] = [];
  for (let i = 0; i < item.heightU; i++) {
    units.push(item.bottomU + i);
  }
  return units;
}

export function canPlaceTechnicalItem(
  placedItems: TechnicalPlacedRackItem[],
  itemId: TechnicalRackEquipmentId,
  targetBottomU: number
): { ok: boolean; reason?: string } {
  const heightU = getTechnicalEquipmentHeight(itemId);

  if (targetBottomU < 1 || targetBottomU + heightU - 1 > TOTAL_RACK_UNITS) {
    return {
      ok: false,
      reason: `El equipo necesita ${heightU}U libres y se sale del armario (U1–U${TOTAL_RACK_UNITS}).`,
    };
  }

  const candidateUnits = new Set<number>();
  for (let u = targetBottomU; u < targetBottomU + heightU; u++) {
    candidateUnits.add(u);
  }

  for (const existing of placedItems) {
    if (existing.id === itemId) continue;
    for (const occupiedU of getTechnicalOccupiedUnits(existing)) {
      if (candidateUnits.has(occupiedU)) {
        const existingSpec = TECHNICAL_RACK_INVENTORY.find(
          (i) => i.id === existing.id
        );
        return {
          ok: false,
          reason: `La unidad U${occupiedU} ya está ocupada por ${existingSpec?.nombre ?? existing.id}.`,
        };
      }
    }
  }

  return { ok: true };
}

export function placeTechnicalRackItem(
  placedItems: TechnicalPlacedRackItem[],
  itemId: TechnicalRackEquipmentId,
  targetBottomU: number
): { placedItems: TechnicalPlacedRackItem[]; error?: string } {
  const check = canPlaceTechnicalItem(placedItems, itemId, targetBottomU);
  if (!check.ok) {
    return { placedItems, error: check.reason };
  }

  const heightU = getTechnicalEquipmentHeight(itemId);
  const filtered = placedItems.filter((item) => item.id !== itemId);
  return {
    placedItems: [...filtered, { id: itemId, bottomU: targetBottomU, heightU }],
  };
}

export function removeTechnicalRackItem(
  placedItems: TechnicalPlacedRackItem[],
  itemId: TechnicalRackEquipmentId
): TechnicalPlacedRackItem[] {
  return placedItems.filter((item) => item.id !== itemId);
}

function hasValidAlternatingSwitchPatchPairing(
  switches: TechnicalPlacedRackItem[],
  patchPanels: TechnicalPlacedRackItem[]
): boolean {
  if (switches.length !== 3 || patchPanels.length !== 3) return false;
  // Every switch must be paired 1-to-1 with an adjacent patch panel (|sw.U - pp.U| === 1)
  const used = [false, false, false];
  const backtrack = (swIdx: number): boolean => {
    if (swIdx === switches.length) return true;
    for (let ppIdx = 0; ppIdx < patchPanels.length; ppIdx++) {
      if (
        !used[ppIdx] &&
        Math.abs(switches[swIdx].bottomU - patchPanels[ppIdx].bottomU) === 1
      ) {
        used[ppIdx] = true;
        if (backtrack(swIdx + 1)) return true;
        used[ppIdx] = false;
      }
    }
    return false;
  };
  return backtrack(0);
}

export function validateTechnicalRackAssembly(
  placedItems: TechnicalPlacedRackItem[]
): RackValidationSummary {
  const findItem = (id: TechnicalRackEquipmentId) =>
    placedItems.find((item) => item.id === id);

  const allPlaced = TECHNICAL_RACK_INVENTORY.every((spec) =>
    Boolean(findItem(spec.id))
  );

  // Rule 1: Overlaps & bounds
  const unitOwners = new Map<number, TechnicalRackEquipmentId[]>();
  let outOfBounds = false;
  for (const item of placedItems) {
    for (const u of getTechnicalOccupiedUnits(item)) {
      if (u < 1 || u > TOTAL_RACK_UNITS) outOfBounds = true;
      const list = unitOwners.get(u) ?? [];
      list.push(item.id);
      unitOwners.set(u, list);
    }
  }
  const hasOverlap = Array.from(unitOwners.values()).some(
    (owners) => owners.length > 1
  );
  const noOverlapsPassed = !hasOverlap && !outOfBounds && placedItems.length > 0;

  // Rule 2: SAI at base (U1-U2)
  const sai = findItem('sai');
  const saiAtBase = Boolean(sai && sai.bottomU === 1 && sai.heightU === 2);

  // Rule 3: Router in upper zone (U10..U12) for external fiber/operator feed
  const router = findItem('router');
  const routerAtTop = Boolean(router && router.bottomU >= 10);

  // Rule 4: All 3 Patch Panels and 3 Switches alternated & adjacent
  const switches = [
    findItem('switch_1'),
    findItem('switch_2'),
    findItem('switch_3'),
  ].filter((x): x is TechnicalPlacedRackItem => Boolean(x));

  const patchPanels = [
    findItem('patch_panel_1'),
    findItem('patch_panel_2'),
    findItem('patch_panel_3'),
  ].filter((x): x is TechnicalPlacedRackItem => Boolean(x));

  const alternatedAdjacent = hasValidAlternatingSwitchPatchPairing(
    switches,
    patchPanels
  );

  // Rule 5: PDU accessible (>= U3)
  const pdu = findItem('pdu');
  const pduAccessible = Boolean(pdu && pdu.bottomU >= 3 && !hasOverlap);

  const rules: RackRuleResult[] = [
    {
      id: 'all_placed',
      label: 'Armario 12U completo (11 equipos instalados)',
      passed: allPlaced,
      detail: allPlaced
        ? 'Has llenado las 12 unidades U del armario con todos los equipos necesarios.'
        : `Faltan ${TECHNICAL_RACK_INVENTORY.length - placedItems.length} equipo(s) por colocar hasta completar las 12U.`,
    },
    {
      id: 'sai_base',
      label: 'SAI en la base del rack (U1–U2)',
      passed: saiAtBase,
      detail: saiAtBase
        ? 'Correcto: el SAI está abajo del todo (U1–U2) por su gran peso y baterías.'
        : sai
          ? `El SAI está en U${sai.bottomU}–U${sai.bottomU + 1}. Muévelo a la base (U1–U2) para evitar vuelcos.`
          : 'Coloca el SAI en la base inferior (U1–U2).',
    },
    {
      id: 'router_top',
      label: 'Router en la zona superior (U10–U12)',
      passed: routerAtTop,
      detail: routerAtTop
        ? `Correcto: el Router está en U${router?.bottomU}, arriba para recibir cómodamente la acometida externa.`
        : router
          ? `El Router está en U${router.bottomU}. Súbelo a la parte alta (U10–U12) cerca de la entrada superior de fibra.`
          : 'Coloca el Router de operadora en la zona superior (U10–U12).',
    },
    {
      id: 'patch_switch_alternated',
      label: 'Patch Panels alternados junto a los Switches',
      passed: alternatedAdjacent,
      detail: alternatedAdjacent
        ? 'Correcto: cada Switch está pegado a su Patch Panel alternado para usar latiguillos cortos y ordenados.'
        : 'Alterna los 3 Patch Panels y los 3 Switches en parejas pegadas (ej. U4–U5, U6–U7, U8–U9) para que cada Switch quede junto a un Patch Panel.',
    },
    {
      id: 'pdu_accessible',
      label: 'Regleta PDU accesible y sin solapamientos',
      passed: pduAccessible && noOverlapsPassed,
      detail:
        pduAccessible && noOverlapsPassed
          ? `Correcto: la Regleta PDU en U${pdu?.bottomU} y el resto de guías quedan accesibles y sin solapamientos.`
          : 'Asegúrate de colocar la Regleta PDU en U3 o superior y sin solapar equipos.',
    },
  ];

  return {
    isValid: rules.every((r) => r.passed),
    allPlaced,
    rules,
  };
}
