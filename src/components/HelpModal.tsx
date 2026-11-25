import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { PhaseId } from './HeaderBar';

interface HelpModalProps {
  isOpen: boolean;
  activePhase: PhaseId;
  onClose: () => void;
}

const HINTS_BY_PHASE: Record<
  PhaseId,
  { title: string; steps: string[] }
> = {
  1: {
    title: 'Pistas para la Fase 1 · Conoce los componentes',
    steps: [
      'Haz clic en las 7 tarjetas de la izquierda para revisar la ficha de cada dispositivo.',
      'Fíjate bien en dónde se coloca cada equipo (por ejemplo, el SAI siempre abajo por su peso).',
      'Presta atención a la diferencia entre un Switch (actual) y un Hub (antiguo): te servirá en el reto final.',
    ],
  },
  2: {
    title: 'Pistas para la Fase 2 · Montaje del Armario Rack 19"',
    steps: [
      'Coloca primero el SAI (2U) en la parte más baja: unidades U1 y U2.',
      'Instala la Regleta PDU en una unidad libre accesible (por ejemplo U3 o U12) para dar corriente.',
      'Pon el Patch Panel y el Switch juntos en unidades U seguidas (por ejemplo U8 y U9) para usar latiguillos cortos.',
      'Añade la Bandeja metálica y el Router sin pisar ninguna unidad U ocupada.',
    ],
  },
  3: {
    title: 'Pistas para la Fase 3 · Cableado y Test Ping',
    steps: [
      '1. Alimentación (Negro/Rojo): Conecta "Salida SAI 1" → "Entrada PDU", y luego "Toma 1" → "230V Router" y "Toma 2" → "230V Switch".',
      '2. Fibra Óptica / WAN (Amarillo): Conecta "Fibra Operadora" (Internet) → puerto "WAN" del Router.',
      '3. Ethernet UTP (Azul): Conecta "LAN 1" del Router → "P1 (Uplink)" del Switch.',
      '4. Ethernet UTP (Azul): Conecta los puertos "P2, P3, P4, P5" del Switch → "PP 1, PP 2, PP 3, PP 4" del Patch Panel.',
      '5. Ethernet UTP (Azul): Conecta cada "Roseta 1..4" de pared → "RJ45 PC 1..4" y pulsa "Test de Conectividad (Ping)".',
    ],
  },
};

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  activePhase,
  onClose,
}) => {
  if (!isOpen) return null;

  const content = HINTS_BY_PHASE[activePhase];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Lightbulb
              className="w-5 h-5 text-amber-500 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="help-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de ayuda"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="mt-4 space-y-2.5 text-sm text-slate-700 leading-relaxed">
          {content.steps.map((step, i) => (
            <li
              key={i}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {step}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            Entendido, volver a la práctica
          </button>
        </div>
      </div>
    </div>
  );
};
