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
