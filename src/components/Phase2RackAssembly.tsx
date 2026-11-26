import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GripVertical,
  Trash2,
} from 'lucide-react';
import {
  RACK_INVENTORY,
  RackEquipmentId,
  TECHNICAL_RACK_INVENTORY,
  TechnicalRackEquipmentId,
  TOTAL_RACK_UNITS,
} from '../data/componentsData';
import { DifficultyLevel } from '../logic/gamification';
import {
  canPlaceItem,
  canPlaceTechnicalItem,
  PlacedRackItem,
  RackValidationSummary,
  TechnicalPlacedRackItem,
} from '../logic/rackValidation';
import { DeviceSvg } from './DeviceSvg';

interface Phase2RackAssemblyProps {
  difficulty?: DifficultyLevel;
  placedItems: PlacedRackItem[];
  technicalPlacedItems?: TechnicalPlacedRackItem[];
  validationResult: RackValidationSummary | null;
  onPlaceItem: (itemId: RackEquipmentId, bottomU: number) => string | undefined;
  onPlaceTechnicalItem?: (
    itemId: TechnicalRackEquipmentId,
    bottomU: number
  ) => string | undefined;
  onRemoveItem: (itemId: RackEquipmentId) => void;
  onRemoveTechnicalItem?: (itemId: TechnicalRackEquipmentId) => void;
  onValidate: () => void;
  onGoToPhase3: () => void;
}

export const Phase2RackAssembly: React.FC<Phase2RackAssemblyProps> = ({
  difficulty = 'principiante',
  placedItems,
  technicalPlacedItems = [],
  validationResult,
  onPlaceItem,
  onPlaceTechnicalItem,
  onRemoveItem,
  onRemoveTechnicalItem,
  onValidate,
  onGoToPhase3,
}) => {
  const isTechnical = difficulty === 'tecnico';

  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    'sai'
  );
  const [draggedEquipment, setDraggedEquipment] = useState<string | null>(null);
  const [hoverBottomU, setHoverBottomU] = useState<number | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);

  const inventory = isTechnical ? TECHNICAL_RACK_INVENTORY : RACK_INVENTORY;
  const activePlacedItems: Array<{
    id: string;
    bottomU: number;
    heightU: 1 | 2;
  }> = isTechnical ? technicalPlacedItems : placedItems;

  const activeItem = draggedEquipment ?? selectedEquipment;

  // Map each U (1..12) to its placed item if any
  const unitMap = new Map<
    number,
    { id: string; bottomU: number; heightU: 1 | 2 }
  >();
  for (const item of activePlacedItems) {
    for (let u = item.bottomU; u < item.bottomU + item.heightU; u++) {
      unitMap.set(u, item);
    }
  }

  const placeByMode = (itemId: string, u: number): string | undefined => {
    if (isTechnical) {
      return onPlaceTechnicalItem?.(itemId as TechnicalRackEquipmentId, u);
    }
    return onPlaceItem(itemId as RackEquipmentId, u);
  };

  const removeByMode = (itemId: string) => {
    if (isTechnical) {
      onRemoveTechnicalItem?.(itemId as TechnicalRackEquipmentId);
    } else {
      onRemoveItem(itemId as RackEquipmentId);
    }
  };

  const handleUnitClick = (u: number) => {
    if (!selectedEquipment) {
      setPlacementError(
        'Primero elige un equipo de la bandeja derecha para colocarlo.'
      );
      return;
    }

    const err = placeByMode(selectedEquipment, u);
    if (err) {
      setPlacementError(err);
      return;
    }

    setPlacementError(null);
    // Auto-select next unplaced item to keep flow smooth
    const nextPlacedIds = new Set(
      activePlacedItems.map((p) => p.id).concat(selectedEquipment)
    );
    const nextUnplaced = inventory.find((i) => !nextPlacedIds.has(i.id));
    setSelectedEquipment(nextUnplaced ? nextUnplaced.id : null);
  };

  const handleDropOnUnit = (u: number) => {
    const itemToPlace = draggedEquipment ?? selectedEquipment;
    setDraggedEquipment(null);
    setHoverBottomU(null);
    if (!itemToPlace) return;

    const err = placeByMode(itemToPlace, u);
    if (err) {
      setPlacementError(err);
      return;
    }
    setPlacementError(null);
    if (selectedEquipment === itemToPlace) {
      const nextPlacedIds = new Set(
        activePlacedItems.map((p) => p.id).concat(itemToPlace)
      );
      const nextUnplaced = inventory.find((i) => !nextPlacedIds.has(i.id));
      setSelectedEquipment(nextUnplaced ? nextUnplaced.id : null);
    }
  };

  const unitsDescending = Array.from(
    { length: TOTAL_RACK_UNITS },
    (_, i) => TOTAL_RACK_UNITS - i
  );

  // Compute preview units when hovering
  const previewUnits = new Set<number>();
  let previewValid = true;
  if (activeItem && hoverBottomU !== null) {
    const check = isTechnical
      ? canPlaceTechnicalItem(
          technicalPlacedItems,
          activeItem as TechnicalRackEquipmentId,
          hoverBottomU
        )
      : canPlaceItem(placedItems, activeItem as RackEquipmentId, hoverBottomU);
    previewValid = check.ok;
    const spec = inventory.find((s) => s.id === activeItem);
    const height = spec?.heightU ?? 1;
    for (let i = 0; i < height; i++) {
      const u = hoverBottomU + i;
      if (u >= 1 && u <= TOTAL_RACK_UNITS) previewUnits.add(u);
    }
  }

  return (
    <section
      aria-labelledby="phase2-heading"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-mono text-sky-700 font-semibold mb-1">
            {isTechnical
              ? 'FASE 2 · MONTAJE COMPLETO 12U (NIVEL TÉCNICO)'
              : 'FASE 2 · MONTAJE DEL ARMARIO'}
          </p>
          <h2
            id="phase2-heading"
            className="text-2xl font-bold text-slate-900 tracking-tight"
          >
            {isTechnical
              ? 'Montaje completo del armario rack 19" (12U llenas)'
              : 'Montaje del armario rack 19" (12U)'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {isTechnical
              ? 'Instala los 11 módulos del inventario hasta llenar las 12U del armario siguiendo la organización profesional de taller.'
              : 'Selecciona un equipo de la bandeja derecha (o arrástralo) y haz clic en la unidad U del armario donde quieras atornillarlo.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onValidate}
            data-tour="p2-validate-btn"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            <span>Comprobar montaje</span>
          </button>

          {validationResult?.isValid && (
            <button
              type="button"
              onClick={onGoToPhase3}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <span>Pasar a Fase 3: Cablear</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Visual 12U Rack Cabinet */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">
              Armario Rack 19&quot; · 12 Unidades (U1 abajo – U12 arriba)
            </h3>
            <span className="text-xs font-mono text-slate-600">
              {activePlacedItems.length}/{inventory.length} instalados
            </span>
          </div>

          {placementError && (
            <div
              role="alert"
              className="mb-3 p-3 bg-rose-50 border border-rose-300 rounded-lg text-sm text-rose-900 flex items-center gap-2"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0"
                aria-hidden="true"
              />
              <span>{placementError}</span>
            </div>
          )}

          {/* Rack Cabinet Frame */}
          <div
            className="bg-slate-800 border-4 border-slate-700 rounded-xl p-3 shadow-inner"
            data-testid="rack-cabinet-12u"
          >
            {/* Top Ventilation Cap */}
            <div className="h-3 bg-slate-900 rounded-t-sm mb-2 flex items-center justify-center gap-2">
              <span className="w-16 h-1 bg-slate-700 rounded-full" />
              <span className="w-16 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="space-y-1">
              {unitsDescending.map((u) => {
                const occupying = unitMap.get(u);
                const isTopOf2U =
                  occupying &&
                  occupying.heightU === 2 &&
                  u === occupying.bottomU + 1;
                const isBottomAnchor = occupying && u === occupying.bottomU;

                // If this unit is the upper half of a 2U device, render merged block with its bottomU row
                if (isTopOf2U) {
                  return null;
                }

                if (occupying && isBottomAnchor) {
                  const spec = inventory.find((s) => s.id === occupying.id);
                  const badgeLabel =
                    spec && 'badgeLabel' in spec ? spec.badgeLabel : undefined;
                  const is2U = occupying.heightU === 2;
                  return (
                    <div
                      key={u}
                      className="flex items-stretch gap-2"
                      data-testid={`rack-installed-${occupying.id}`}
                      data-tour={`p2-slot-u${u}`}
                    >
                      {/* Left U rail labels */}
                      <div className="w-12 shrink-0 flex flex-col justify-between bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-xs text-slate-300">
                        {is2U && <span>U{u + 1}</span>}
                        <span>U{u}</span>
                      </div>

                      {/* Mounted Equipment Visual */}
                      <div
                        className={`flex-1 bg-slate-100 border border-slate-400 rounded px-2 py-0.5 flex items-center justify-between gap-2 ${
                          is2U ? 'h-[84px]' : 'h-[40px]'
                        }`}
                      >
                        <div className="flex-1 min-w-0 h-full flex items-center">
                          <DeviceSvg
                            type={spec?.svgComponent ?? 'bandeja'}
                            badgeLabel={badgeLabel}
                            className="w-full h-full max-h-full"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                            {spec?.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              removeByMode(occupying.id);
                              setPlacementError(null);
                            }}
                            aria-label={`Retirar ${spec?.nombre} de U${u}`}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-100 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600"
                            title="Retirar del rack"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Empty slot U
                const isPreview = previewUnits.has(u);
                const slotBg = isPreview
                  ? previewValid
                    ? 'bg-sky-900/60 border-sky-400 text-sky-100'
                    : 'bg-rose-950/70 border-rose-400 text-rose-200'
                  : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:border-sky-500 hover:text-sky-200';

                return (
                  <div
                    key={u}
                    className="flex items-stretch gap-2"
                    data-tour={`p2-slot-u${u}`}
                  >
                    <div className="w-12 shrink-0 flex items-center justify-center bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-300">
                      U{u}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnitClick(u)}
                      onMouseEnter={() => setHoverBottomU(u)}
                      onMouseLeave={() => setHoverBottomU(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverBottomU(u);
                      }}
                      onDragLeave={() => setHoverBottomU(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnUnit(u);
                      }}
                      aria-label={`Instalar equipo en unidad U${u}`}
                      data-testid={`rack-slot-u${u}`}
                      className={`flex-1 h-[40px] border border-dashed rounded px-3 flex items-center justify-between text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${slotBg}`}
                    >
                      <span>
                        {activeItem
                          ? `Colocar aquí (base en U${u})`
                          : `Guía U${u} libre`}
                      </span>
                      <span className="font-mono text-[11px] opacity-75">
                        19&quot; · U{u}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Rack feet */}
            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between px-4 text-[11px] font-mono text-slate-400">
              <span>BASE DEL ARMARIO</span>
              <span>CARGA MÁXIMA EN U1–U2</span>
            </div>
          </div>
        </div>

        {/* Right: Equipment Inventory & Validation Results */}
        <div className="lg:col-span-6 space-y-5">
          <div
            className="bg-white border border-slate-200 rounded-xl p-5"
            data-tour="p2-inventory"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Bandeja de inventario ({inventory.length} equipos)
              </h3>
              <span className="text-xs text-slate-600">
                Haz clic o arrastra al rack
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map((spec) => {
                const placed = activePlacedItems.find((p) => p.id === spec.id);
                const isSelected = selectedEquipment === spec.id;
                const badgeLabel =
                  'badgeLabel' in spec ? spec.badgeLabel : undefined;

                return (
                  <button
                    key={spec.id}
                    type="button"
                    draggable
                    data-testid={`inv-${spec.id}`}
                    onDragStart={() => {
                      setDraggedEquipment(spec.id);
                      setSelectedEquipment(spec.id);
                    }}
                    onDragEnd={() => {
                      setDraggedEquipment(null);
                      setHoverBottomU(null);
                    }}
                    onClick={() => {
                      setSelectedEquipment(spec.id);
                      setPlacementError(null);
                    }}
                    aria-pressed={isSelected}
                    className={`text-left p-3 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-600/20'
                        : placed
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-400'
                          : 'bg-white border-slate-200 hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical
                          className="w-4 h-4 text-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {spec.nombre}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-600 shrink-0">
                        {spec.heightU}U
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-md p-1.5">
                      <DeviceSvg
                        type={spec.svgComponent}
                        badgeLabel={badgeLabel}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600 truncate">
                        {spec.descripcionCorta}
                      </span>
                      {placed ? (
                        <span className="font-mono font-semibold text-emerald-700 shrink-0">
                          En U{placed.bottomU}
                          {placed.heightU === 2 ? `–U${placed.bottomU + 1}` : ''}
                        </span>
                      ) : (
                        <span className="font-semibold text-sky-700 shrink-0">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Checklist Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Reglas de montaje en taller
            </h3>

            {!validationResult ? (
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  Cuando hayas instalado los {inventory.length} equipos en el
                  rack, pulsa{' '}
                  <strong className="text-slate-900">
                    &quot;Comprobar montaje&quot;
                  </strong>{' '}
                  para verificar:
                </p>
                {isTechnical ? (
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>
                      El SAI va en la base (U1–U2) por su gran peso y baterías.
                    </li>
                    <li>
                      El Router va en la zona superior (U10–U12) para la
                      acometida exterior.
                    </li>
                    <li>
                      Los 3 Patch Panels y los 3 Switches van alternados y
                      pegados para usar latiguillos cortos y ordenados.
                    </li>
                    <li>
                      La Regleta PDU queda accesible (U3 o superior) y todo el
                      armario de 12U queda completo sin solapamientos.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>
                      El SAI va en la base (U1–U2) por su elevado peso y
                      estabilidad.
                    </li>
                    <li>
                      El Patch Panel y el Switch van juntos (adyacentes) para
                      usar latiguillos cortos.
                    </li>
                    <li>
                      La Regleta PDU queda accesible para alimentar los equipos.
                    </li>
                    <li>No hay equipos solapados ni fuera del rango U1–U12.</li>
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-2.5" data-testid="rack-validation-results">
                <div
                  className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-sm font-semibold ${
                    validationResult.isValid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {validationResult.isValid ? (
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="w-5 h-5 text-rose-600 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {validationResult.isValid
                      ? 'Montaje correcto. El armario rack cumple todas las normas de taller.'
                      : 'Hay errores en el montaje. Revisa los puntos marcados en rojo y corrígelos.'}
                  </span>
                </div>

                <ul className="space-y-2 pt-1">
                  {validationResult.rules.map((rule) => (
                    <li
                      key={rule.id}
                      className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 ${
                        rule.passed
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      {rule.passed ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertCircle
                          className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div className="font-semibold">{rule.label}</div>
                        <div className="text-xs opacity-90 mt-0.5">
                          {rule.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
