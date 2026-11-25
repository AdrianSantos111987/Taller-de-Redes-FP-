import React from 'react';
import { Info, MessageSquareHeart, X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      data-testid="info-modal"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Info
              className="w-5 h-5 text-sky-600 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="info-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Más información sobre la aplicación
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de más información"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-slate-900 font-semibold">
              Taller de Redes FP · Armario Rack 19&quot; y Cableado Local
            </p>
            <p className="mt-1.5">
              Es una app educativa creada con{' '}
              <strong className="text-slate-900">AI Studio</strong> por el
              profesor <strong className="text-slate-900">Adrián Santos</strong>{' '}
              para aprender paso a paso a montar un armario rack de 19 pulgadas y
              cablear una red local desde cero.
            </p>
          </div>

          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-lg flex items-start gap-3">
            <MessageSquareHeart
              className="w-5 h-5 text-sky-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-bold text-slate-900">
                ¡Tu ayuda mejora esta herramienta!
              </h3>
              <p className="mt-1 text-slate-700">
                ¿Has detectado algún error o se te ocurre una idea para que las
                prácticas sean más claras, visuales o divertidas? Anímate a
                compartir cualquier sugerencia de mejora o fallo que encuentres:
                cada aportación ayuda a perfeccionar la aplicación para toda la
                clase.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
