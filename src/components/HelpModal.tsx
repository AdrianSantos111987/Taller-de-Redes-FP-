import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { PhaseId } from './HeaderBar';
import { DifficultyLevel } from '../logic/gamification';

interface HelpModalProps {
  isOpen: boolean;
  activePhase: PhaseId;
  difficulty?: DifficultyLevel;
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
    title: 'Pistas para la Fase 3 · 4 pasos guiados',
    steps: [
      'Paso 1 (Cable Negro - 230V): Selecciona abajo el cable negro y une "Salida 230V" (SAI) con "Entrada 230V" (Router).',
      'Paso 2 (Cable Azul - RJ45): Cambia al cable azul abajo y une "Toma Internet" con "Puerto WAN" (Router).',
      'Paso 3 (Cable Azul - RJ45): Con el cable azul, une "Puerto LAN" (Router) con "Puerto Uplink" (Switch).',
      'Paso 4 (Cable Azul - RJ45): Con el cable azul, une "Puerto Aula" (Switch) con "Puerto Patch Panel" para terminar.',
    ],
  },
};

const TECHNICAL_HINTS_BY_PHASE: Record<
  PhaseId,
  { title: string; steps: string[] }
> = {
  1: {
    title: 'Pistas Nivel Técnico · Fase 1 (Identificación)',
    steps: [
      'Haz clic en cada uno de los 7 equipos para abrir su reto de identificación con 3 opciones.',
      'Si aciertas a la primera sumas los puntos completos (50 pts); si fallas, lee la pista y vuelve a intentarlo.',
      'Al validar cada equipo desbloquearás su ficha técnica completa a la derecha.',
    ],
  },
  2: {
    title: 'Pistas Nivel Técnico · Fase 2 (Rack 12U completo)',
    steps: [
      'El SAI (2U) va siempre abajo del todo (U1–U2) por su gran peso y baterías, evitando que el armario vuelque.',
      'El Router de operadora se coloca en la zona superior (U10–U12) para recibir cómodamente la acometida externa.',
      'Los 3 Patch Panels y 3 Switches se alternan pegados entre sí (ej. U4–U5, U6–U7, U8–U9) para que los latiguillos de conexión entre ambos sean cortos y queden ordenados.',
      'Coloca la Regleta PDU en U3 (accesible) y completa el resto de guías con el Pasahilos y la Bandeja hasta llenar las 12U.',
    ],
  },
  3: {
    title: 'Pistas Nivel Técnico · Fase 3 (8 pasos guiados)',
    steps: [
      'Pasos 1 y 2 (Cable Negro - 230V): Alimenta primero el Router y después el bloque de Switches desde el SAI.',
      'Pasos 3 y 4 (Cable Azul - RJ45): Conecta Internet al puerto WAN del Router y su salida LAN al Switch 1 (Principal).',
      'Paso 5 (Cable Azul - RJ45): Enlaza Switch 1 con Switch 2 y también Switch 1 con Switch 3.',
      'Pasos 6, 7 y 8 (Cable Azul - RJ45): Conecta Switch 1 → Aula 1, Switch 2 → Aula 2 y Switch 3 → Sala de Profesores.',
    ],
  },
};

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  activePhase,
  difficulty = 'principiante',
  onClose,
}) => {
  if (!isOpen) return null;

  const content =
    difficulty === 'tecnico'
      ? TECHNICAL_HINTS_BY_PHASE[activePhase]
      : HINTS_BY_PHASE[activePhase];

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
